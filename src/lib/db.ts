/**
 * Toutes les requêtes SQL du suivi des paiements, au même endroit.
 * Règle : toujours prepare(...).bind(...) — jamais de SQL construit par
 * concaténation de chaînes (injection SQL).
 */

export interface OrderRow {
  id: number;
  client_name: string;
  client_phone: string | null;
  address: string | null;
  label: string | null;
  total_cents: number;
  note: string | null;
  created_at: string;
  paid_cents: number;
  payment_count: number;
  last_paid_on: string | null;
}

export interface PaymentRow {
  id: number;
  order_id: number;
  amount_cents: number;
  paid_on: string;
  method: string | null;
  note: string | null;
}

export interface OrderInput {
  client_name: string;
  client_phone: string | null;
  address: string | null;
  label: string | null;
  total_cents: number;
  note: string | null;
}

export interface PaymentInput {
  amount_cents: number;
  paid_on: string;
  method: string | null;
  note: string | null;
}

// Le filtre deleted_at des versements est dans le ON du LEFT JOIN, pas dans
// le WHERE : sinon une commande sans aucun versement disparaîtrait de la liste.
const ORDER_SELECT = `
  SELECT o.id, o.client_name, o.client_phone, o.address, o.label,
         o.total_cents, o.note, o.created_at,
         COALESCE(SUM(p.amount_cents), 0) AS paid_cents,
         COUNT(p.id)                      AS payment_count,
         MAX(p.paid_on)                   AS last_paid_on
  FROM orders o
  LEFT JOIN payments p ON p.order_id = o.id AND p.deleted_at IS NULL
  WHERE o.deleted_at IS NULL`;

/** Commandes encore dues d'abord, puis les soldées ; les plus récentes en haut. */
export async function listOrders(db: D1Database): Promise<OrderRow[]> {
  const { results } = await db
    .prepare(
      `${ORDER_SELECT}
       GROUP BY o.id
       ORDER BY (o.total_cents - COALESCE(SUM(p.amount_cents), 0)) <= 0,
                o.created_at DESC, o.id DESC`
    )
    .all<OrderRow>();
  return results;
}

export async function getOrder(db: D1Database, id: number): Promise<OrderRow | null> {
  return db.prepare(`${ORDER_SELECT} AND o.id = ? GROUP BY o.id`).bind(id).first<OrderRow>();
}

export async function listPayments(db: D1Database, orderId: number): Promise<PaymentRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, order_id, amount_cents, paid_on, method, note
       FROM payments
       WHERE order_id = ? AND deleted_at IS NULL
       ORDER BY paid_on, id`
    )
    .bind(orderId)
    .all<PaymentRow>();
  return results;
}

/**
 * Crée la commande et, si fourni, le premier acompte — dans un seul batch :
 * D1 exécute un batch comme une transaction, donc soit les deux lignes
 * existent, soit aucune.
 */
export async function createOrder(
  db: D1Database,
  o: OrderInput,
  firstPayment: PaymentInput | null
): Promise<number> {
  const insertOrder = db
    .prepare(
      `INSERT INTO orders (client_name, client_phone, address, label, total_cents, note)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
    )
    .bind(o.client_name, o.client_phone, o.address, o.label, o.total_cents, o.note);

  if (!firstPayment) {
    const row = await insertOrder.first<{ id: number }>();
    return row!.id;
  }

  const [res] = await db.batch<{ id: number }>([
    insertOrder,
    db
      .prepare(
        `INSERT INTO payments (order_id, amount_cents, paid_on, method, note)
         VALUES (last_insert_rowid(), ?, ?, ?, ?)`
      )
      .bind(firstPayment.amount_cents, firstPayment.paid_on, firstPayment.method, firstPayment.note)
  ]);
  return res.results[0].id;
}

export async function updateOrder(db: D1Database, id: number, o: OrderInput): Promise<boolean> {
  const r = await db
    .prepare(
      `UPDATE orders
       SET client_name = ?, client_phone = ?, address = ?, label = ?,
           total_cents = ?, note = ?, updated_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(o.client_name, o.client_phone, o.address, o.label, o.total_cents, o.note, id)
    .run();
  return r.meta.changes > 0;
}

export async function deleteOrder(db: D1Database, id: number): Promise<boolean> {
  const r = await db
    .prepare(`UPDATE orders SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`)
    .bind(id)
    .run();
  return r.meta.changes > 0;
}

/** N'ajoute le versement que si la commande existe et n'est pas supprimée. */
export async function addPayment(db: D1Database, orderId: number, p: PaymentInput): Promise<boolean> {
  const r = await db
    .prepare(
      `INSERT INTO payments (order_id, amount_cents, paid_on, method, note)
       SELECT id, ?, ?, ?, ? FROM orders WHERE id = ? AND deleted_at IS NULL`
    )
    .bind(p.amount_cents, p.paid_on, p.method, p.note, orderId)
    .run();
  return r.meta.changes > 0;
}

export async function updatePayment(
  db: D1Database,
  id: number,
  orderId: number,
  p: PaymentInput
): Promise<boolean> {
  const r = await db
    .prepare(
      `UPDATE payments SET amount_cents = ?, paid_on = ?, method = ?, note = ?
       WHERE id = ? AND order_id = ? AND deleted_at IS NULL`
    )
    .bind(p.amount_cents, p.paid_on, p.method, p.note, id, orderId)
    .run();
  return r.meta.changes > 0;
}

export async function deletePayment(db: D1Database, id: number, orderId: number): Promise<boolean> {
  const r = await db
    .prepare(
      `UPDATE payments SET deleted_at = datetime('now')
       WHERE id = ? AND order_id = ? AND deleted_at IS NULL`
    )
    .bind(id, orderId)
    .run();
  return r.meta.changes > 0;
}

/** Une ligne par versement, avec la commande — pour l'export CSV. */
export async function exportRows(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT o.id AS order_id, o.client_name, o.client_phone, o.address, o.label,
              o.total_cents, o.created_at,
              p.paid_on, p.amount_cents, p.method, p.note AS payment_note
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id AND p.deleted_at IS NULL
       WHERE o.deleted_at IS NULL
       ORDER BY o.id, p.paid_on, p.id`
    )
    .all<{
      order_id: number;
      client_name: string;
      client_phone: string | null;
      address: string | null;
      label: string | null;
      total_cents: number;
      created_at: string;
      paid_on: string | null;
      amount_cents: number | null;
      method: string | null;
      payment_note: string | null;
    }>();
  return results;
}
