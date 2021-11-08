import { reify } from "./decorator.js";
import jsx from "./jsx.js";
import { Matrix } from "./matrix.js";
import GridModel from "./model/grid.js";

const CANVAS = Symbol(),
  GL = Symbol(),
  MODEL = Symbol(),
  PROJECTION_MATRIX = Symbol();

const mountainTexture = jsx`
<svg width="512" height="512">
  <defs>
    <filter id="noise">
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
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const { [GL]: gl } = this;
    return new Matrix(
      Array.from({ length: 16 }, () => 0),
      0
    ).identity();
  }

  get road() {
    const { [GL]: gl } = this;
    const angle = -89 * (Math.PI / 180);
    const adjacent = Math.tan(angle) / (200 * 0.25);
    const model = new GridModel({
      gl,
      width: 120,
      height: 200,
      tileSize: 0.25,
    });

    model.modelViewMatrix
      .translate(0, 0, -20)
      .rotate(angle, 1, 0, 0)
      .translate(0, -adjacent, 0);

    return model;
  }

  get mountains() {
    const { [GL]: gl } = this;
    const model = new GridModel({
      gl,
      width: 200,
      height: 200,
      tileSize: 0.25,
      noiseTexture: mountainTexture,
      noiseScale: 5,
      angleStep: 1 / 5,
    });

    model.modelViewMatrix
      .translate(0, 5.5, (-200 * 1) / 4)
      .scale(1, 1, -1)
      .rotate(80 * (Math.PI / 180), 1, 0, 0);
    // .rotate(100 * (Math.PI / 180), 1, 0, 0);
    // .rotate(90 * (Math.PI / 180), 0, 0, 1);
    // .translate(0, 0, -(120 + 250) * 0.25);
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
