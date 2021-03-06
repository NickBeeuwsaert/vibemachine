import { cubicBezier, cubicBezierZeros } from "./bezier.js";
import { reify } from "./decorator.js";
import { Matrix } from "./matrix.js";
import { GridModel } from "./model/main.js";
import { createImageFromURL } from "./texture.js";

export default class Scene {
  constructor({ canvas, mountainTexture, roadTexture, tileTexture }) {
    this.canvas = canvas;
    this.mountainTexture = mountainTexture;
    this.roadTexture = roadTexture;
    this.tileTexture = tileTexture;
  }

  perspective(fieldOfView, aspect, zNear, zFar) {
    const { projectionMatrix } = this;

    return projectionMatrix.perspective(fieldOfView, aspect, zNear, zFar);
  }

  orthographic(left, right, bottom, top, near, far) {
    const { projectionMatrix } = this;

    return projectionMatrix.orthographic(left, right, bottom, top, near, far);
  }

  /**
   * @returns {WebGLRenderingContext}
   */
  get gl() {
    const { canvas } = this;

    return canvas.getContext("webgl", { antialias: true });
  }

  get projectionMatrix() {
    const { gl } = this;
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
    const [roadStop] = this.roadControlPoints.slice(-1);
    const [mountainStart] = this.mountainControlPoints;
    return mountainStart.x - roadStop.x - mountainStart.x;
  }

  get road() {
    const { gl, roadTexture, tileTexture } = this;
    const controlPoints = this.roadControlPoints;

    const model = new GridModel({
      gl,
      noiseTexture: roadTexture, //: createImageFromURL("./static/images/roadTexture.svg"),
      tileTexture, //: createImageFromURL("./static/images/tile.svg"),
      width: 120 | 1,
      height: 200,
      tileSize: 1 / 4,
      curve1: controlPoints.slice(0, 2).flatMap(({ x, y }) => [x, y]),
      curve2: controlPoints.slice(2).flatMap(({ x, y }) => [x, y]),
    });

    model.modelViewMatrix.translate(0, -this.horizonOffset, this.zOffset);

    return model;
  }

  get horizonOffset() {
    const [cp0, cp1, cp2, cp3] = this.mountainControlPoints,
      curve = cubicBezier(cp0.y, cp1.y, cp2.y, cp3.y),
      [z0, z1] = cubicBezierZeros(cp0.y, cp1.y, cp2.y, cp3.y);

    return Math.max(curve(z0), curve(z1));
  }

  get mountains() {
    const { gl, mountainTexture, tileTexture } = this,
      controlPoints = this.mountainControlPoints,
      model = new GridModel({
        gl,
        noiseTexture: mountainTexture, //: createImageFromURL("./static/images/mountainTexture.svg"),
        tileTexture, //: createImageFromURL("./static/images/tile.svg"),
        width: 100 | 1,
        height: 100,
        tileSize: 1 / 2,
        noiseScale: 3,
        curve1: controlPoints.slice(0, 2).flatMap(({ x, y }) => [x, y]),
        curve2: controlPoints.slice(2).flatMap(({ x, y }) => [x, y]),
      });

    model.modelViewMatrix.translate(0, -this.horizonOffset, this.zOffset);
    return model;
  }

  resize() {
    const { gl, canvas } = this;
    const maxDimension = 1024;
    let w = canvas.clientWidth,
      h = canvas.clientHeight,
      aspectRatio = w / h;
    if (Math.min(w, h) > maxDimension) {
      if (w > h) {
        w = maxDimension;
        h = maxDimension / aspectRatio;
      } else {
        w = maxDimension * aspectRatio;
        h = maxDimension;
      }
    }
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  firstRender = true;

  draw() {
    // const { gl, road, mountains, projectionMatrix } = this;

    if (this.firstRender) {
      this.resize();
      this.firstRender = false;
    }
    this.gl.canvas.width += 0;
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.mountains.draw(this.projectionMatrix);
    this.road.draw(this.projectionMatrix);
  }
}

Object.defineProperties(Scene.prototype, {
  gl: {
    get: reify(Object.getOwnPropertyDescriptor(Scene.prototype, "gl").get),
  },
  road: {
    get: reify(Object.getOwnPropertyDescriptor(Scene.prototype, "road").get),
  },
  mountains: {
    get: reify(
      Object.getOwnPropertyDescriptor(Scene.prototype, "mountains").get
    ),
  },
  projectionMatrix: {
    get: reify(
      Object.getOwnPropertyDescriptor(Scene.prototype, "projectionMatrix").get
    ),
  },
});
