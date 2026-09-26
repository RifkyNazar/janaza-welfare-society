self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const title = typeof payload.title === "string" ? payload.title : "JWS Notification";
  const body = typeof payload.body === "string" ? payload.body : "A new update is available.";
  const url = typeof payload.url === "string" && payload.url.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/";
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;
  event.waitUntil(self.registration.showNotification(title, { body, tag, data: { url }, icon: "/images/jws/logo.png", badge: "/images/jws/logo.png" }));
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
