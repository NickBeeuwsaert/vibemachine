import { reify } from "../decorator.js";
import { generateGrid } from "../grid.js";
import { Matrix } from "../matrix.js";
import GridShader from "../shader/main.js";
import { createTexture } from "../texture.js";

export default class GridModel {
  noiseOffset = 0;
  // Setting the start time here is probably suboptimal
  // because it will be set in the constructor, and not first render
  // so if there is a long gap between construcing the model and rendeing
  // it will screw up the first frame
  start = Date.now();

  constructor({
    gl,
    width,
    height,
    tileSize,
    tileTexture,
    noiseTexture,
    noiseScale = 3.0,
    angleStep = -0.5,
    curve1,
    curve2,
    interval = 0.25 * 1000,
  }) {
    this.interval = interval;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tileTexture = tileTexture;
    this.noiseTexture = noiseTexture;
    this.noiseScale = noiseScale;
    this.angleStep = angleStep;
    this.curve1 = curve1;
    this.curve2 = curve2;
    this.gl = gl;
  }

  get shader() {
    const { gl } = this;
    return new GridShader(gl);
  }

  get mesh() {
    return generateGrid({
      cols: this.width,
      rows: this.height,
      tileSize: this.tileSize,
    });
  }

  get vertexBuffer() {
    const { gl, mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(mesh.vertices),
      gl.STATIC_DRAW
    );
    return buffer;
  }

  get indexBuffer() {
    const { gl, mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(mesh.indices),
      gl.STATIC_DRAW
    );

    return buffer;
  }

  get texCoordBuffer() {
    const { gl, mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);

    return buffer;
  }

  get modelViewMatrix() {
    const { mesh } = this;
    return new Matrix(
      Array.from({ length: 16 }, () => 0),
      0
    ).identity();
  }

  get _gridTexture() {
    const { gl, tileTexture } = this;
    console.log(this.noiseTexture);

    return createTexture(gl, tileTexture);
  }

  get _noiseTexture() {
    const { gl, noiseTexture } = this;
    console.log(this.noiseTexture);
    return createTexture(gl, noiseTexture);
    // return noiseTexture.then((image) => createTexture(gl, image));
  }

  /**
   *
   * @param {Matrix} projectionMatrix
   */
  draw(projectionMatrix) {
    // const {
    //   gl,
    //   shader,
    //   mesh,
    //   vertexBuffer,
    //   indexBuffer,
    //   modelViewMatrix,
    //   texCoordBuffer,
    //   _gridTexture,
    //   _noiseTexture,
    //   noiseScale,
    //   curve1,
    //   curve2,
    // } = this;

    let elapsed = Date.now() - this.start;

    if (elapsed > this.interval) {
      elapsed = 0;
      this.start = Date.now();
      this.noiseOffset += (1 / this.mesh.height) * this.mesh.tileSize;
    }
    const vertexOffset = (elapsed / this.interval) * this.mesh.tileSize;

    this.shader.activate(this, vertexOffset, projectionMatrix);
    // shader.activate({
    //   vertexBuffer,
    //   modelViewMatrix,
    //   projectionMatrix,
    //   texCoordBuffer,
    //   vertexOffset,
    //   gridTexture: _gridTexture,
    //   noiseTexture: _noiseTexture,
    //   noiseOffset: this.noiseOffset,
    //   size: mesh.size,
    //   noiseScale,
    //   tileSize: mesh.tileSize,
    //   curve1,
    //   curve2,
    // });

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.mesh.indices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }
}

for (const getterName of [
  "mesh",
  "vertexBuffer",
  "texCoordBuffer",
  "indexBuffer",
  "modelViewMatrix",
  "shader",
  "_noiseTexture",
  "_gridTexture",
]) {
  const decoratedMethod = reify(
    Object.getOwnPropertyDescriptor(GridModel.prototype, getterName).get
  );
  Object.defineProperty(GridModel.prototype, getterName, {
    get: decoratedMethod,
  });
}
