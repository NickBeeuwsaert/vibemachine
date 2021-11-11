/**
 * @typedef Mesh
 * @property {number[]} vertices
 *  array of size (width * height * 3) with the format [x, y, z, ...]
 * @property {number[]} indices
 *  indices into the vertex array
 * @property {number[]} uv
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} cols
 * @property {number} rows
 * @property {number} tileSize
 * @property {number[]} size
 *
 * @typedef GridOptions
 * @property {number} cols
 * @property {number} rows
 * @property {number} tileSize
 * @property {{x: number, y: number}} [uvScale]
 *
 * @param {GridOptions} options
 *
 * @returns {Mesh}
 */
export function generateGrid({ cols, rows, tileSize, uvScale = null }) {
  if (uvScale === null) {
    uvScale = { x: 1, y: 1 };
  }
  const width = cols + 1;
  const height = rows + 1;
  const cx = (cols * tileSize) / 2;
  const cy = (rows * tileSize) / 2;

  let vertices = [],
    indices = [],
    uv = [];
  for (let idx = 0; idx < width * height; idx++) {
    const y = Math.floor(idx / width),
      x = idx % width;
    vertices.push(x * tileSize - cx, 0, y * tileSize - cy);

    uv.push((x / cols) * uvScale.x, (y / rows) * uvScale.y);
  }
  for (let idx = 0; idx < width * height - width; idx++) {
    if ((idx + 1) % width !== 0) {
      indices.push(idx, idx + 1, idx + width);
      indices.push(idx + 1, idx + width + 1, idx + width);
    }
  }

  return {
    vertices,
    indices,
    uv,
    x: -cx,
    y: -cy,
    cols,
    rows,
    tileSize,
    size: [cols, rows],
    width: cols * tileSize,
    height: rows * tileSize,
  };
}
