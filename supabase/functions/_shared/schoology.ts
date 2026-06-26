/**
 * Shared Schoology helpers for the RealPath Edge Functions.
 *
 * Unlike Canvas (OAuth2 Bearer token), Schoology signs EVERY request with
 * OAuth 1.0a (HMAC-SHA1). This module provides:
 *   - the request signer (`buildAuthHeader`)
 *   - a thin `SchoologyClient` (getMe / listSections / createPage)
 *   - AES-GCM encrypt/decrypt for the stored consumer key/secret — the SAME
 *     scheme and `TOKEN_ENCRYPTION_KEY` the Canvas functions use, so secrets
 *     are at rest the same way across both integrations.
 *
 * Two-legged OAuth (the path we use): the teacher's own personal consumer
 * key/secret act on their own data. `oauth_token` is sent empty and the token
 * secret is empty. The signer also accepts a token/tokenSecret for a future
 * three-legged flow.
 *
 * Schoology auth docs: https://developers.schoology.com/api-documentation/authentication/
 */

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SCHOOLOGY_API_BASE = "https://api.schoology.com/v1";
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;

export { corsHeaders };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errJson(code: string, message: string, status = 400, detail?: unknown): Response {
  return json({ error: message, code, detail }, status);
}

/* ------------------------------------------------------------------ *
 * Token encryption (AES-GCM) — identical scheme to the Canvas funcs.  *
 * ------------------------------------------------------------------ */

async function aesKey(usage: KeyUsage): Promise<CryptoKey> {
  const raw = new Uint8Array(TOKEN_ENCRYPTION_KEY.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [usage]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await aesKey("encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decrypt(b64: string): Promise<string> {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const key = await aesKey("decrypt");
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
}

/* ------------------------------------------------------------------ *
 * OAuth 1.0a request signing.                                        *
 * ------------------------------------------------------------------ */

/**
 * RFC 3986 percent-encoding — stricter than encodeURIComponent (also encodes
 * ! * ' ( ) ). Loose encoding here is the usual cause of "signature does not
 * match" errors. Verified against the canonical OAuth 1.0a example.
 */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

async function hmacSha1Base64(keyStr: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyStr),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export interface SignParams {
  method: string;
  /** Absolute request URL WITHOUT query string (pass query params via `query`). */
  url: string;
  consumerKey: string;
  consumerSecret: string;
  /** Three-legged access token; empty/omitted for two-legged. */
  token?: string;
  tokenSecret?: string;
  query?: Record<string, string>;
}

export async function buildAuthHeader(params: SignParams): Promise<string> {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: params.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: params.token ?? "",
    oauth_version: "1.0",
  };

  const allParams: Record<string, string> = { ...oauthParams, ...(params.query ?? {}) };
  const paramString = Object.keys(allParams)
    .map((k) => [percentEncode(k), percentEncode(allParams[k])] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const baseString = [
    params.method.toUpperCase(),
    percentEncode(params.url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(params.consumerSecret)}&${percentEncode(params.tokenSecret ?? "")}`;
  const signature = await hmacSha1Base64(signingKey, baseString);

  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  return (
    'OAuth realm="Schoology API",' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
      .join(",")
  );
}

/* ------------------------------------------------------------------ *
 * Thin Schoology REST client.                                        *
 * ------------------------------------------------------------------ */

export interface SchoologyCredentials {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
}

export interface SchoologySection {
  id: string;
  title: string;
  courseTitle: string;
}

export class SchoologyClient {
  constructor(private creds: SchoologyCredentials) {}

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    query?: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    const base = `${SCHOOLOGY_API_BASE}${path}`;
    const authorization = await buildAuthHeader({
      method,
      url: base,
      consumerKey: this.creds.consumerKey,
      consumerSecret: this.creds.consumerSecret,
      token: this.creds.token,
      tokenSecret: this.creds.tokenSecret,
      query,
    });

    const url = query ? `${base}?${new URLSearchParams(query).toString()}` : base;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new SchoologyApiError(res.status, text.slice(0, 300));
    }
    // Schoology returns JSON when Accept: application/json is set.
    return (await res.json()) as T;
  }

  /** Resolve the authenticated user — used to verify credentials at connect time. */
  async getMe(): Promise<{ uid: string; name_display?: string }> {
    const me = await this.request<{ uid: number | string; name_display?: string }>("GET", "/users/me");
    return { uid: String(me.uid), name_display: me.name_display };
  }

  /** Sections the teacher is enrolled in — populates the push picker. */
  async listSections(): Promise<SchoologySection[]> {
    const data = await this.request<{
      section?: Array<{ id: number | string; section_title?: string; course_title?: string }>;
    }>("GET", "/users/me/sections");
    return (data.section ?? []).map((s) => ({
      id: String(s.id),
      title: s.section_title ?? "",
      courseTitle: s.course_title ?? "",
    }));
  }

  /**
   * Create a Page material in a section. Schoology's `body` field holds the
   * HTML; `published: 1` makes it visible to students.
   * POST /sections/{section_id}/pages
   */
  async createPage(params: {
    sectionId: string;
    title: string;
    bodyHtml: string;
    published?: boolean;
  }): Promise<{ id: string; title: string }> {
    const data = await this.request<{ id: number | string; title?: string }>(
      "POST",
      `/sections/${params.sectionId}/pages`,
      undefined,
      {
        title: params.title,
        body: params.bodyHtml,
        published: params.published === false ? 0 : 1,
      },
    );
    return { id: String(data.id), title: data.title ?? params.title };
  }
}

export class SchoologyApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SchoologyApiError";
  }
}
