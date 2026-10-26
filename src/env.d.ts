/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Ce que le Worker reçoit de wrangler.jsonc (bindings + vars).
interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    /** e-mail de la personne connectée via Cloudflare Access */
    user?: string;
  }
}
