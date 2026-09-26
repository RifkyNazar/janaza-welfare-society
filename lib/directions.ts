export function directionsUrl(latitude: number | null, longitude: number | null, locationText?: string | null) {
  const validCoordinates = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  const destination = validCoordinates ? `${latitude},${longitude}` : locationText?.trim();
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}

export function trustedMapUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const googleHost = url.hostname === "google.com" || url.hostname.endsWith(".google.com");
    return url.protocol === "https:" && (googleHost || url.hostname === "maps.app.goo.gl") ? url.toString() : null;
  } catch {
    return null;
  }
}
