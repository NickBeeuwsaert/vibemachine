import GridShader from "./grid.js";
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {GLenum} type
 * @param {string} source
 * @returns {WebGLShader}
 * @throws {ShaderError}
 */
export function compile(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const infoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new ShaderError(infoLog);
  }
  return shader;
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram}
 * @throws {ShaderError}
 */
export function link(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new ShaderError(gl.getProgramInfoLog(program));
  }

  return program;
}
export class ShaderError extends Error {
  /**
   *
   * @param {string} message
   */
  constructor(message) {
    super();
    /** @type {string} */
    this.message = message;
  }
}

export { default } from "./grid.js";
