const colomboOffset = 330 * 60_000;

export function advertisementDateInput(date: Date | null) {
  return date ? new Date(date.getTime() + colomboOffset).toISOString().slice(0, 10) : "";
}

export function advertisementDateBoundary(value: string, endOfDay = false) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000) return undefined;
  const midnight = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== value) return undefined;
  const boundary = new Date(midnight - colomboOffset + (endOfDay ? 86_400_000 - 1 : 0));
  return boundary.getUTCFullYear() < 1000 ? undefined : boundary;
}

export function liveAdvertisementFilter(now: Date) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}
