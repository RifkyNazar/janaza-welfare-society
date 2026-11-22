export function memberPage(value: string | undefined) {
  return value && /^[1-9]\d*$/.test(value) ? Math.min(Number(value), 10_000) : 1;
}
