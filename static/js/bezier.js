export const cubicBezier = (p0, p1, p2, p3) => (t) => {
  const a = Math.pow(1 - t, 3) * p0;
  const b = Math.pow(1 - t, 2) * p1 * t * 3;
  const c = (1 - t) * Math.pow(t, 2) * p2 * 3;
  const d = Math.pow(t, 3) * p3;

  return a + b + c + d;
};

export const cubicBezierZeros = (p0, p1, p2, p3) => {
  const a = 3 * (p3 + 3 * p1 - 3 * p2 - p0);
  const b = 6 * (p0 + p2 - 2 * p1);
  const c = 3 * (p1 - p0);
  return [
    (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
    (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
  ];
};
