self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const url = typeof payload.url === "string" && payload.url.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/";
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;
  event.waitUntil((async () => {
    let locale = "en";
    try {
      if ((await self.cookieStore?.get("jws-language"))?.value === "ta") locale = "ta";
    } catch {
      // Some browsers restrict cookie access in service workers.
    }
    const copy = (locale === "ta" ? payload.ta : null) ?? payload;
    const title = typeof copy.title === "string" ? copy.title : "JWS Notification";
    const body = typeof copy.body === "string" ? copy.body : "A new update is available.";
    await self.registration.showNotification(title, { body, tag, lang: copy === payload ? "en" : "ta", data: { url }, icon: "/images/jws/logo.png", badge: "/images/jws/logo.png" });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data && typeof event.notification.data.url === "string" ? event.notification.data.url : "/";
  const target = new URL(path, self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const matching = windows.find((client) => new URL(client.url).pathname === target.pathname);
    if (matching) return matching.focus();
    return clients.openWindow(target.href);
  }));
});
