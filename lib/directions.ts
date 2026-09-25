export function directionsUrl(latitude: number | null, longitude: number | null, locationText?: string | null) {
  const validCoordinates = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  const destination = validCoordinates ? `${latitude},${longitude}` : locationText?.trim();
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}
