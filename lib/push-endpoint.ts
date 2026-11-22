const pushHosts = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
]);

export function isAllowedPushEndpoint(endpoint: string) {
  if (endpoint.length > 500) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.port && !url.username && !url.password && !url.hash
      && (pushHosts.has(url.hostname) || url.hostname.endsWith(".push.apple.com") || url.hostname.endsWith(".notify.windows.com"));
  } catch {
    return false;
  }
}
