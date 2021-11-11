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
  uniform highp float uTileSize;
  uniform highp float uNoiseScale;

  uniform mat2 uFirstTwoControlPoints;
  uniform mat2 uLastTwoControlPoints;
  uniform highp vec2 uSize;

  varying highp vec2 vTexCoord;


  float cubicBezierCurve(float t, float p0, float p1, float p2, float p3) {
    float a = pow(1.0 - t, 3.0) * p0;
    float b = pow(1.0 - t, 2.0) * t * p1 * 3.0;
    float c = pow(t, 2.0) * (1.0 - t) * p2 * 3.0;
    float d = pow(t, 3.0) * p3;

    return a + b + c + d;
  }

  vec2 cubicBezierCurve2D(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
    return vec2(
      cubicBezierCurve(t, p0.x, p1.x, p2.x, p3.x),
      cubicBezierCurve(t, p0.y, p1.y, p2.y, p3.y)
    );
  }

  float cubicBezierCurveDerivative(float t, float p0, float p1, float p2, float p3) {
    float a = 3.0 * (p3 + 3.0 * p1 - 3.0 * p2 - p0);
    float b = 6.0 * (p0 + p2 - 2.0 * p1);
    float c = 3.0 * (p1 - p0);

    return pow(t, 2.0) * a + t * b + c;
  }

  vec2 cubicBezierCurveDerivative2D(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
    return vec2(
      cubicBezierCurveDerivative(t, p0.x, p1.x, p2.x, p3.x),
      cubicBezierCurveDerivative(t, p0.y, p1.y, p2.y, p3.y)
    );
  }

  vec2 rotate(float theta, vec2 p) {
    return vec2(
      p.x * cos(theta) - p.y * sin(theta),
      p.x * sin(theta) + p.y * cos(theta)
    );
  }

  vec2 wrapAroundCurve(vec2 position, float length, vec2 cp0, vec2 cp1, vec2 cp2, vec2 cp3) {
    float t = position.x / length + 0.5;
    vec2 translation = cubicBezierCurve2D(t, cp0, cp1, cp2, cp3);
    vec2 derivative = cubicBezierCurveDerivative2D(t, cp0, cp1, cp2, cp3);

    float theta = atan(derivative.y, derivative.x);
    return rotate(theta, vec2(0, position.y)) + translation;
  }

  vec3 displacePosition(
    vec3 position,
    sampler2D noiseTexture,
    vec2 texCoord,
    float noiseOffset, float noiseScale,
    float vertexOffset
  ) {
    return vec3(
      position.x,
      position.y + (
        texture2D(
          noiseTexture,
          vec2(
            texCoord.s,
            texCoord.t - noiseOffset
          )
        ).a - 0.5
      ) * noiseScale,
      position.z + vertexOffset
    );
  }


  void main() {
    vTexCoord = aTexCoord;
    // vec4 displacedPosition = vec4(
    //   aVertexPosition.x,
    //   aVertexPosition.y + (
    //     texture2D(uNoise, vec2(aTexCoord.s, aTexCoord.t - uNoiseOffset)).a - 0.5
    //   ) * uNoiseScale,
    //   aVertexPosition.z + uVertexOffset,
    //   1.0
    // );
    vec3 displacedPosition = displacePosition(
      aVertexPosition.xyz,
      uNoise,
      aTexCoord,
      uNoiseOffset, uNoiseScale,
      uVertexOffset
    );
    vec2 rotatedPosition = wrapAroundCurve(
      displacedPosition.zy,
      uSize.y * uTileSize,
      uFirstTwoControlPoints[0],
      uFirstTwoControlPoints[1],
      uLastTwoControlPoints[0],
      uLastTwoControlPoints[1]
    );

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(displacedPosition.x, rotatedPosition.y, rotatedPosition.x, 1.0);
    // gl_Position = uProjectionMatrix * uModelViewMatrix * displacedPosition;
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
  get ["tileSize"]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uTileSize");
  }

  get ["curve1"]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uFirstTwoControlPoints");
  }
  get ["curve2"]() {
    const { [PROGRAM]: program, [GL]: gl } = this;

    return gl.getUniformLocation(program, "uLastTwoControlPoints");
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
   * @property {number} tileSize
   * @property {number[]} curve1
   * @property {number[]} curve2
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
    tileSize,
    curve1,
    curve2,
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
      tileSize: tileSizeUniform,
      noiseScale: noiseScaleUniform,
      curve1: curve1Uniform,
      curve2: curve2Uniform,
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

    gl.uniformMatrix2fv(curve1Uniform, false, curve1);
    gl.uniformMatrix2fv(curve2Uniform, false, curve2);

    gl.uniform1f(noiseOffsetUniform, noiseOffset);
    gl.uniform1f(vertexOffsetUniform, vertexOffset);
    gl.uniform1f(noiseScaleUniform, noiseScale);
    gl.uniform1f(tileSizeUniform, tileSize);
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
  ["tileSize"]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridShader.prototype, "tileSize").get
    ),
  },
});
