import { reify } from "../decorator.js";
import { Matrix } from "../matrix.js";
import GridModel from "../model/grid.js";
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
  constructor(gl) {
    this.gl = gl;
  }

  get program() {
    const { gl } = this,
      fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
      vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    return link(gl, vertexShader, fragmentShader);
  }

  get vertexPositionAttribute() {
    const { program, gl } = this;

    return gl.getAttribLocation(program, "aVertexPosition");
  }

  get texCoordAttribute() {
    const { program, gl } = this;

    return gl.getAttribLocation(program, "aTexCoord");
  }

  get projectionMatrixUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uProjectionMatrix");
  }

  get modelViewMatrixUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uModelViewMatrix");
  }

  get gridTextureUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uSampler");
  }

  get noiseTextureUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uNoise");
  }

  get noiseOffsetUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uNoiseOffset");
  }

  get vertexOffsetUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uVertexOffset");
  }

  get sizeUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uSize");
  }
  get noiseScaleUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uNoiseScale");
  }
  get tileSizeUniform() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uTileSize");
  }

  get curve1() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uFirstTwoControlPoints");
  }
  get curve2() {
    const { program, gl } = this;

    return gl.getUniformLocation(program, "uLastTwoControlPoints");
  }

  // activate({
  //   vertexBuffer,
  //   projectionMatrix,
  //   modelViewMatrix,
  //   texCoordBuffer,
  //   gridTexture,
  //   noiseTexture,
  //   noiseOffset,
  //   vertexOffset,
  //   size,
  //   noiseScale,
  //   tileSize,
  //   curve1,
  //   curve2,
  // }) {
  /**
   *
   * @param {GridModel} model
   * @param {number} vertexOffset
   * @param {Matrix} projectionMatrix
   */
  activate(model, vertexOffset, projectionMatrix) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.vertexBuffer);
    this.gl.vertexAttribPointer(
      this.vertexPositionAttribute,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.texCoordBuffer);
    this.gl.vertexAttribPointer(
      this.texCoordAttribute,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.texCoordAttribute);

    this.gl.useProgram(this.program);
    this.gl.uniformMatrix4fv(
      this.projectionMatrixUniform,
      false,
      projectionMatrix._buffer
    );
    this.gl.uniformMatrix4fv(
      this.modelViewMatrixUniform,
      false,
      model.modelViewMatrix._buffer
    );

    this.gl.uniformMatrix2fv(this.curve1, false, model.curve1);
    this.gl.uniformMatrix2fv(this.curve2, false, model.curve2);

    this.gl.uniform1f(this.noiseOffsetUniform, model.noiseOffset);
    this.gl.uniform1f(this.vertexOffsetUniform, vertexOffset);
    this.gl.uniform1f(this.noiseScaleUniform, model.noiseScale);
    this.gl.uniform1f(this.tileSizeUniform, model.mesh.tileSize);
    this.gl.uniform2fv(this.sizeUniform, model.mesh.size);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, model._gridTexture);
    this.gl.uniform1i(this.gridTextureUniform, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, model._noiseTexture);
    this.gl.uniform1i(this.noiseTextureUniform, 1);
  }
}

for (const getterName of [
  "program",
  "vertexPositionAttribute",
  "texCoordAttribute",
  "projectionMatrixUniform",
  "modelViewMatrixUniform",
  "gridTextureUniform",
  "noiseTextureUniform",
  "noiseOffsetUniform",
  "vertexOffsetUniform",
  "sizeUniform",
  "noiseScaleUniform",
  "tileSizeUniform",
  "curve1",
  "curve2",
]) {
  const decoratedMethod = reify(
    Object.getOwnPropertyDescriptor(GridShader.prototype, getterName).get
  );
  Object.defineProperty(GridShader.prototype, getterName, {
    get: decoratedMethod,
  });
}
