/**
 * Read env vars with UPPER_SNAKE or lower_snake (some hosts only allow lowercase names).
 */
export function env(name, fallback = '') {
  const u = process.env[name];
  const l = process.env[name.toLowerCase()];
  const v = u ?? l;
  if (v === undefined || v === '') return fallback;
  return v;
}
