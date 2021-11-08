import { reify } from "../decorator.js";
import { Matrix } from "../matrix.js";
import { link, compile } from "./main.js";

const GL = Symbol(),
  PROGRAM = Symbol(),
  VERTICES = Symbol(),
  TEX_COORD = Symbol(),
  GRID = Symbol(),
  NOISE = Symbol(),
  MODEL_VIEW_MATRIX = Symbol(),
  PROJECTION_MATRIX = Symbol(),
  NOISE_OFFSET = Symbol(),
  VERTEX_OFFSET = Symbol(),
  SIZE = Symbol();

const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTexCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform sampler2D uNoise;
  uniform highp float uNoiseOffset;
  uniform highp float uVertexOffset;
  uniform highp float uAngleStep;
  uniform highp float uNoiseScale;

  varying highp vec2 vTexCoord;
  void main() {
    vTexCoord = aTexCoord;
    vec4 displacedPosition = aVertexPosition + vec4(
      0,
      -uVertexOffset,
      (
        texture2D(uNoise, vec2(aTexCoord.s, aTexCoord.t + uNoiseOffset)).a
      ) * uNoiseScale,
      0
    );

    vec2 pos = displacedPosition.yz;
    highp float rotation = uAngleStep * pos.x;
    vec2 rotated = vec2(
      pos.x * cos(rotation) - sin(rotation) * pos.y,
      pos.x * sin(rotation) + pos.y * cos(rotation)
    );

    vec4 position = vec4(displacedPosition.x, rotated.x, rotated.y, 1.0);

    gl_Position = uProjectionMatrix * uModelViewMatrix * position;
  }
`,
  fragmentShaderSource = `
  varying highp vec2 vTexCoord;

  uniform sampler2D uSampler;
  uniform highp vec2 uSize;

  void main() {
    gl_FragColor = texture2D(uSampler, vTexCoord * uSize);
  }
`;

export default class GridShader {
  [GL] = null;
  time = 0;

  constructor(gl) {
    Object.assign(this, { [GL]: gl });
  }

  get [PROGRAM]() {
    const { [GL]: gl } = this,
      fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
      vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    return link(gl, vertexShader, fragmentShader);
  }

  get [VERTICES]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getAttribLocation(program, "aVertexPosition");
  }

  get [TEX_COORD]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getAttribLocation(program, "aTexCoord");
  }

  get [PROJECTION_MATRIX]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uProjectionMatrix");
  }

  get [MODEL_VIEW_MATRIX]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uModelViewMatrix");
  }

  get [GRID]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uSampler");
  }

  get [NOISE]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uNoise");
  }

  get [NOISE_OFFSET]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uNoiseOffset");
  }

  get [VERTEX_OFFSET]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uVertexOffset");
  }

  get [SIZE]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uSize");
  }
  get ["noiseScale"]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uNoiseScale");
  }
  get ["angleStep"]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uAngleStep");
  }
  /**
   * @typedef Settings
   * @property {WebGLBuffer} vertexBuffer
   * @property {Matrix} projectionMatrix
   * @property {Matrix} modelViewMatrix
   * @property {WebGLBuffer} texCoordBuffer
   * @property {WebGLTexture} gridTexture
   * @property {WebGLTexture} noiseTexture
   * @property {number} noiseOffset
   * @property {number} vertexOffset
   * @property {number[]} size
   * @property {number} noiseScale
   * @property {number} angleStep
   *
   * @param {Settings} settings
   */
  activate({
    vertexBuffer,
    projectionMatrix,
    modelViewMatrix,
    texCoordBuffer,
    gridTexture,
    noiseTexture,
    noiseOffset,
    vertexOffset,
    size,
    noiseScale,
    angleStep,
  }) {
    const {
      [GL]: gl,
      [PROGRAM]: program,
      [VERTICES]: vertices,
      [TEX_COORD]: texCoordAttribute,
      [MODEL_VIEW_MATRIX]: modelViewMatrixUniform,
      [PROJECTION_MATRIX]: projectionMatrixUniform,
      [GRID]: grid,
      [NOISE]: noise,
      [NOISE_OFFSET]: noiseOffsetUniform,
      [VERTEX_OFFSET]: vertexOffsetUniform,
      [SIZE]: sizeUniform,
      angleStep: angleStepUniform,
      noiseScale: noiseScaleUniform,
    } = this;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertices, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordAttribute);

    gl.useProgram(program);
    gl.uniformMatrix4fv(
      projectionMatrixUniform,
      false,
      projectionMatrix._buffer
    );
    gl.uniformMatrix4fv(modelViewMatrixUniform, false, modelViewMatrix._buffer);
    gl.uniform1f(noiseOffsetUniform, noiseOffset);
    gl.uniform1f(vertexOffsetUniform, vertexOffset);
    gl.uniform1f(noiseScaleUniform, noiseScale);
    gl.uniform1f(angleStepUniform, angleStep * (Math.PI / 180));
    gl.uniform2fv(sizeUniform, size);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gridTexture);
    gl.uniform1i(grid, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.uniform1i(noise, 1);
  }
}

Object.defineProperties(GridShader.prototype, {
  [PROGRAM]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, PROGRAM).get
    ),
  },
  [VERTICES]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, VERTICES).get
    ),
  },
  [TEX_COORD]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, TEX_COORD).get
    ),
  },
  [MODEL_VIEW_MATRIX]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, MODEL_VIEW_MATRIX)
        .get
    ),
  },
  [PROJECTION_MATRIX]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, PROJECTION_MATRIX)
        .get
    ),
  },
  [GRID]: {
    get: reify(Object.getOwnPropertyDescriptor(GridShader.prototype, GRID).get),
  },
  [NOISE]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, NOISE).get
    ),
  },
  [NOISE_OFFSET]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, NOISE_OFFSET).get
    ),
  },
  [VERTEX_OFFSET]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, VERTEX_OFFSET).get
    ),
  },
  [SIZE]: {
    get: reify(Object.getOwnPropertyDescriptor(GridShader.prototype, SIZE).get),
  },
  ["noiseScale"]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, "noiseScale").get
    ),
  },
  ["angleStep"]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, "angleStep").get
    ),
  },
});
