const R =
    /^(?<a>[a-z0-9]{8})(?<b>[a-z0-9]{4})(?<c>[a-z0-9]{4})(?<d>[a-z0-9]{4})(?<e>[a-z0-9]{12})$/,
  M = 4 + 2,
  N = M + 2;
export default function uuidv4() {
  const bytes =
    "crypto" in window
      ? window.crypto.getRandomValues(new Uint8Array(16))
      : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[M] = (bytes[M] & 0x0f) | 0x40;
  bytes[N] = (bytes[N] & 0x3f) | 0x80;

  const match = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .match(R);
  if (!(match && match.groups)) {
    throw new Error("I dunno what happened dawg");
  }
  const { a, b, c, d, e } = match.groups || {};
  return `${a}-${b}-${c}-${d}-${e}`;
}
