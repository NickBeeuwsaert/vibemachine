import { cubicBezier, cubicBezierZeros } from "./bezier.js";
import { reify } from "./decorator.js";
import jsx from "./jsx.js";
import { Matrix } from "./matrix.js";
import { GridModel } from "./model/main.js";

const CANVAS = Symbol(),
  GL = Symbol(),
  PROJECTION_MATRIX = Symbol();

const mountainTexture = jsx`
<svg width="512" height="512">
  <defs>
    <filter id="noise" x="0" y="0" width="100%" height="100%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.025"
        numOctaves="10"
      ></feTurbulence>
    </filter>
  </defs>
  <rect x="0" y="0" width="100%" height="100%" filter="url(#noise)" />
</svg>
`;

export default class Scene {
  [CANVAS] = null;
  constructor(canvas) {
    Object.assign(this, {
      [CANVAS]: canvas,
    });
  }

  perspective(fieldOfView, aspect, zNear, zFar) {
    const { [PROJECTION_MATRIX]: projectionMatrix } = this;

    return projectionMatrix.perspective(fieldOfView, aspect, zNear, zFar);
  }

  orthographic(left, right, bottom, top, near, far) {
    const { [PROJECTION_MATRIX]: projectionMatrix } = this;

    return projectionMatrix.orthographic(left, right, bottom, top, near, far);
  }

  /**
   * @returns {WebGLRenderingContext}
   */
  get [GL]() {
    const { [CANVAS]: canvas } = this;

    console.log("Creating gl context");

    return canvas.getContext("webgl", { antialias: true });
  }

  get [PROJECTION_MATRIX]() {
    const { [GL]: gl } = this;
    return new Matrix(
      Array.from({ length: 16 }, () => 0),
      0
    ).identity();
  }

  get roadControlPoints() {
    const [, , cp2, cp3] = this.mountainControlPoints;
    return [
      cp3,
      { x: cp3.x + (cp3.x - cp2.x), y: cp3.y + (cp3.y - cp2.y) },
      { x: 180, y: 10 },
      { x: 200, y: 10 },
    ];
  }

  get mountainControlPoints() {
    return [
      { x: 50, y: 0 },
      { x: 60, y: 30 },
      { x: 75, y: -15 },
      { x: 100, y: 0 },
    ];
  }

  get zOffset() {
    const [roadStart, , , roadStop] = this.roadControlPoints;
    const [mountainStart, , , mountainStop] = this.mountainControlPoints;
    return mountainStart.x - roadStop.x - mountainStart.x;
  }

  get road() {
    const { [GL]: gl } = this;
    const angle = -89 * (Math.PI / 180);
    const adjacent = Math.tan(angle) / (200 * 0.25);
    const controlPoints = this.roadControlPoints;
    const [roadStart, , , roadStop] = controlPoints;
    const [mountainStart, , , mountainStop] = this.mountainControlPoints;

    const model = new GridModel({
      gl,
      width: 120 | 1,
      height: 200,
      tileSize: 1 / 4,
      curve1: controlPoints.slice(0, 2).flatMap(({ x, y }) => [x, y]),
      curve2: controlPoints.slice(2).flatMap(({ x, y }) => [x, y]),
    });

    console.log("Z OFFSET: ", this.zOffset);

    model.modelViewMatrix.translate(0, -this.horizonOffset, this.zOffset);

    return model;
  }

  get horizonOffset() {
    const [cp0, cp1, cp2, cp3] = this.mountainControlPoints;
    const curve = cubicBezier(cp0.y, cp1.y, cp2.y, cp3.y);
    const [z0, z1] = cubicBezierZeros(cp0.y, cp1.y, cp2.y, cp3.y);
    return Math.max(curve(z0), curve(z1));
  }

  get mountains() {
    const { [GL]: gl } = this;
    const controlPoints = this.mountainControlPoints;
    const model = new GridModel({
      gl,
      width: 100 | 1,
      height: 100,
      tileSize: 1 / 2,
      noiseTexture: mountainTexture,
      noiseScale: 3,
      curve1: controlPoints.slice(0, 2).flatMap(({ x, y }) => [x, y]),
      curve2: controlPoints.slice(2).flatMap(({ x, y }) => [x, y]),
    });
    model.modelViewMatrix.translate(0, -this.horizonOffset, this.zOffset);
    return model;
  }

  resize() {
    const { [GL]: gl, [CANVAS]: canvas } = this;

    gl.canvas.width = canvas.clientWidth;
    gl.canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  firstRender = true;

  async draw() {
    const {
      [GL]: gl,
      road,
      mountains,
      [PROJECTION_MATRIX]: projectionMatrix,
    } = this;

    if (this.firstRender) {
      this.resize();
      this.firstRender = false;
    }
    gl.canvas.width += 0;
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);

    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    await mountains.draw(projectionMatrix);
    await road.draw(projectionMatrix);
  }
}

Object.defineProperties(Scene.prototype, {
  [GL]: {
    get: reify(Object.getOwnPropertyDescriptor(Scene.prototype, GL).get),
  },
  road: {
    get: reify(Object.getOwnPropertyDescriptor(Scene.prototype, "road").get),
  },
  mountains: {
    get: reify(
      Object.getOwnPropertyDescriptor(Scene.prototype, "mountains").get
    ),
  },
  [PROJECTION_MATRIX]: {
    get: reify(
      Object.getOwnPropertyDescriptor(Scene.prototype, PROJECTION_MATRIX).get
    ),
  },
});
