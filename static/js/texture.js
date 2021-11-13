const xmlSerializer = new XMLSerializer(),
  isPowerOf2 = (value) => (value & (value - 1)) == 0;

/**
 *
 * @param {SVGElement} svgNode
 * @returns {Promise<HTMLImageElement>}
 */
export function createImageFromSVG(svgNode) {
  const dataURI = `data:image/svg+xml;base64,${btoa(
    xmlSerializer.serializeToString(svgNode)
  )}`;

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", (e) => reject(e), { once: true });

    image.src = dataURI;
  });
}
/**
 *
 * @param {URL|string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function createImageFromURL(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", (e) => reject(e), { once: true });

    image.src = url.toString();
  });
}
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {HTMLImageElement} image
 */
export function createTexture(gl, image) {
  const texture = gl.createTexture(),
    level = 0,
    internalFormat = gl.RGBA,
    srcFormat = gl.RGBA,
    srcType = gl.UNSIGNED_BYTE;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
  );

  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  return texture;
}
