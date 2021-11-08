import { reify } from "../decorator.js";
import { generateGrid } from "../grid.js";
import jsx from "../jsx.js";
import { Matrix } from "../matrix.js";
import GridShader from "../shader/main.js";
import { createImageFromSVG, createTexture } from "../texture.js";

const GL = Symbol(),
  MESH = Symbol(),
  VERTEX_BUFFER = Symbol(),
  TEXCOORD_BUFFER = Symbol(),
  INDEX_BUFFER = Symbol(),
  MODEL_VIEW_MATRIX = Symbol(),
  SHADER = Symbol(),
  WIDTH = Symbol(),
  HEIGHT = Symbol(),
  TILE_SIZE = Symbol(),
  GRID_TEXTURE = Symbol(),
  NOISE_TEXTURE = Symbol();

const defaultTileTexture = jsx`
    <svg width="512" height="512" viewBox="0 0 32 32">
      <defs>
        <filter id="glow">
          <feGaussianBlur out="blur" stdDeviation="3" />
        </filter>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="black"/>
      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="hsl(240, 95%, 66%)" stroke-width="5" filter="url(#glow)" opacity="0.50"/>
      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="hsl(240, 95%, 66%)" stroke-width="1"/>
    </svg>
  `;
const defaultNoiseTexture = jsx`
  <svg width="512" height="512">
    <defs>
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05"
          numOctaves="10"
        ></feTurbulence>
      </filter>

      <linearGradient id="roadGradient" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="white" />
        <stop offset="25%" stop-color="black" />
        <stop offset="75%" stop-color="black" />
        <stop offset="100%" stop-color="white" />
      </linearGradient>
      <mask id="roadMask">
        <rect x="0" y="0" width="100%" height="100%" fill="white"/>
        <rect
          x="33%"
          y="0"
          width="33%"
          height="100%"
          fill="url(#roadGradient)"
        />
      </mask>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" filter="url(#noise)" mask="url(#roadMask)" />
  </svg>
`;

export default class GridModel {
  constructor({
    gl,
    width,
    height,
    tileSize,
    tileTexture = defaultTileTexture,
    noiseTexture = defaultNoiseTexture,
    noiseScale = 3.0,
    angleStep = -0.5,
  }) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tileTexture = tileTexture;
    this.noiseTexture = noiseTexture;
    this.noiseScale = noiseScale;
    this.angleStep = angleStep;
    this[GL] = gl;
  }

  get [SHADER]() {
    const { [GL]: gl } = this;
    return new GridShader(gl);
  }

  get [MESH]() {
    console.log("MESH");
    return generateGrid({
      cols: this.width,
      rows: this.height,
      tileSize: this.tileSize,
    });
  }

  get [VERTEX_BUFFER]() {
    console.log("VERTEX_BUFFER");
    const { [GL]: gl, [MESH]: mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(mesh.vertices),
      gl.STATIC_DRAW
    );
    return buffer;
  }

  get [INDEX_BUFFER]() {
    console.log("INDEX_BUFFER");
    const { [GL]: gl, [MESH]: mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(mesh.indices),
      gl.STATIC_DRAW
    );

    return buffer;
  }

  get [TEXCOORD_BUFFER]() {
    console.log("TEX_COORD_BUFFER");
    const { [GL]: gl, [MESH]: mesh } = this,
      buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uv), gl.STATIC_DRAW);

    return buffer;
  }

  get modelViewMatrix() {
    const { [MESH]: mesh } = this;
    return new Matrix(
      Array.from({ length: 16 }, () => 0),
      0
    ).identity();
    // .translate(0, 0, -20)
    // .rotate(angle, 1, 0, 0)
    // .translate(0, -adjacent, 0);

    // .translate(0, -3, 0)
    // .rotate(-(90 - 10) * (Math.PI / 180), 1, 0, 0);
  }

  get [GRID_TEXTURE]() {
    const { [GL]: gl, tileTexture } = this;
    console.log("GRID_TEXTURE");
    return createImageFromSVG(/** @type {SVGElement} */ (tileTexture)).then(
      (image) => createTexture(gl, image)
    );
  }

  get [NOISE_TEXTURE]() {
    const { [GL]: gl, noiseTexture } = this;
    console.log("NOISE_TEXTURE");
    return createImageFromSVG(/** @type {SVGElement} */ (noiseTexture)).then(
      (image) => createTexture(gl, image)
    );
  }

  interval = 0.25 * 1000;
  // Setting the start time here is probably suboptimal
  // because it will be set in the constructor, and not first render
  // so if there is a long gap between construcing the model and rendeing
  // it will screw up the first frame
  start = Date.now();
  noiseOffset = 0;

  /**
   *
   * @param {Matrix} projectionMatrix
   */
  async draw(projectionMatrix) {
    const {
      [GL]: gl,
      [SHADER]: shader,
      [MESH]: mesh,
      [VERTEX_BUFFER]: vertexBuffer,
      [INDEX_BUFFER]: indexBuffer,
      modelViewMatrix,
      [TEXCOORD_BUFFER]: texCoordBuffer,
      [GRID_TEXTURE]: gridTexture,
      [NOISE_TEXTURE]: noiseTexture,
      noiseScale,
      angleStep,
    } = this;

    let elapsed = Date.now() - this.start;

    if (elapsed > this.interval) {
      elapsed = 0;
      this.start = Date.now();
      this.noiseOffset += (1 / mesh.height) * mesh.tileSize;
    }
    const vertexOffset = (elapsed / this.interval) * mesh.tileSize;

    shader.activate({
      vertexBuffer,
      modelViewMatrix,
      projectionMatrix,
      texCoordBuffer,
      vertexOffset,
      gridTexture: await gridTexture,
      noiseTexture: await noiseTexture,
      noiseOffset: this.noiseOffset,
      size: mesh.size,
      noiseScale,
      angleStep,
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

Object.defineProperties(GridModel.prototype, {
  [MESH]: {
    get: reify(Object.getOwnPropertyDescriptor(GridModel.prototype, MESH).get),
  },
  [VERTEX_BUFFER]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, VERTEX_BUFFER).get
    ),
  },
  [TEXCOORD_BUFFER]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, TEXCOORD_BUFFER).get
    ),
  },
  [INDEX_BUFFER]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, INDEX_BUFFER).get
    ),
  },
  ["modelViewMatrix"]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, "modelViewMatrix")
        .get
    ),
  },
  // [MODEL_VIEW_MATRIX]: {
  //   get: reify(
  //     Object.getOwnPropertyDescriptor(GridModel.prototype, MODEL_VIEW_MATRIX)
  //       .get
  //   ),
  // },
  [SHADER]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, SHADER).get
    ),
  },
  [GRID_TEXTURE]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, GRID_TEXTURE).get
    ),
  },
  [NOISE_TEXTURE]: {
    get: reify(
      Object.getOwnPropertyDescriptor(GridModel.prototype, NOISE_TEXTURE).get
    ),
  },
});
