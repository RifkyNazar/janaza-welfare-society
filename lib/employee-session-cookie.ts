import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export const employeeCookieScope = new AsyncLocalStorage<{ expires?: Date }>();
const sessionCookie = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/;

export const isSessionCookie = (name: string) => sessionCookie.test(name);

function isIssuedSessionCookie(value: string) {
  const [pair] = value.split(";", 1);
  const separator = pair.indexOf("=");
  return separator > 0 && separator < pair.length - 1 && isSessionCookie(pair.slice(0, separator));
}

export async function withEmployeeCookieExpiry(run: () => Response | Promise<Response>) {
  // Auth.js calculates its role-independent cookie expiry separately from JWT encoding.
  const scope: { expires?: Date } = {};
  const response = await employeeCookieScope.run(scope, run);
  if (!scope.expires) return response;
  const expires = scope.expires.toUTCString();
  const cookies = response.headers.getSetCookie();
  if (!cookies.some(isIssuedSessionCookie)) return response;
  const headers = new Headers(response.headers);
  headers.delete("Set-Cookie");
  for (const cookie of cookies) {
    headers.append("Set-Cookie", isIssuedSessionCookie(cookie)
      ? cookie.replace(/(;\s*Expires=)[^;]+/i, `$1${expires}`)
      : cookie);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
