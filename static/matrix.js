// import { Vector } from "./vector.js";

export class Matrix {
  /**
   *
   * @param {number[]} buffer
   * @param {number} start
   */
  constructor(buffer, start) {
    this._buffer = buffer;
    this._start = start;
  }

  _multiply(
    m11,
    m21,
    m31,
    m41,

    m12,
    m22,
    m32,
    m42,

    m13,
    m23,
    m33,
    m43,

    m14,
    m24,
    m34,
    m44
  ) {
    const _m11 = this._buffer[this._start + 0],
      _m21 = this._buffer[this._start + 1],
      _m31 = this._buffer[this._start + 2],
      _m41 = this._buffer[this._start + 3],
      _m12 = this._buffer[this._start + 4],
      _m22 = this._buffer[this._start + 5],
      _m32 = this._buffer[this._start + 6],
      _m42 = this._buffer[this._start + 7],
      _m13 = this._buffer[this._start + 8],
      _m23 = this._buffer[this._start + 9],
      _m33 = this._buffer[this._start + 10],
      _m43 = this._buffer[this._start + 11],
      _m14 = this._buffer[this._start + 12],
      _m24 = this._buffer[this._start + 13],
      _m34 = this._buffer[this._start + 14],
      _m44 = this._buffer[this._start + 15];

    this._buffer[this._start + 0] =
      _m11 * m11 + _m12 * m21 + _m13 * m31 + _m14 * m41;
    this._buffer[this._start + 4] =
      _m11 * m12 + _m12 * m22 + _m13 * m32 + _m14 * m42;
    this._buffer[this._start + 8] =
      _m11 * m13 + _m12 * m23 + _m13 * m33 + _m14 * m43;
    this._buffer[this._start + 12] =
      _m11 * m14 + _m12 * m24 + _m13 * m34 + _m14 * m44;

    this._buffer[this._start + 1] =
      _m21 * m11 + _m22 * m21 + _m23 * m31 + _m24 * m41;
    this._buffer[this._start + 5] =
      _m21 * m12 + _m22 * m22 + _m23 * m32 + _m24 * m42;
    this._buffer[this._start + 9] =
      _m21 * m13 + _m22 * m23 + _m23 * m33 + _m24 * m43;
    this._buffer[this._start + 13] =
      _m21 * m14 + _m22 * m24 + _m23 * m34 + _m24 * m44;

    this._buffer[this._start + 2] =
      _m31 * m11 + _m32 * m21 + _m33 * m31 + _m34 * m41;
    this._buffer[this._start + 6] =
      _m31 * m12 + _m32 * m22 + _m33 * m32 + _m34 * m42;
    this._buffer[this._start + 10] =
      _m31 * m13 + _m32 * m23 + _m33 * m33 + _m34 * m43;
    this._buffer[this._start + 14] =
      _m31 * m14 + _m32 * m24 + _m33 * m34 + _m34 * m44;

    this._buffer[this._start + 3] =
      _m41 * m11 + _m42 * m21 + _m43 * m31 + _m44 * m41;
    this._buffer[this._start + 7] =
      _m41 * m12 + _m42 * m22 + _m43 * m32 + _m44 * m42;
    this._buffer[this._start + 11] =
      _m41 * m13 + _m42 * m23 + _m43 * m33 + _m44 * m43;
    this._buffer[this._start + 15] =
      _m41 * m14 + _m42 * m24 + _m43 * m34 + _m44 * m44;

    return this;
  }

  /**
   *
   * @param {Matrix} other
   * @returns {Matrix}
   */
  multiply(other) {
    return this._multiply(
      other._buffer[other._start + 0],
      other._buffer[other._start + 1],
      other._buffer[other._start + 2],
      other._buffer[other._start + 3],
      other._buffer[other._start + 4],
      other._buffer[other._start + 5],
      other._buffer[other._start + 6],
      other._buffer[other._start + 7],
      other._buffer[other._start + 8],
      other._buffer[other._start + 9],
      other._buffer[other._start + 10],
      other._buffer[other._start + 11],
      other._buffer[other._start + 12],
      other._buffer[other._start + 13],
      other._buffer[other._start + 14],
      other._buffer[other._start + 15]
    );
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Matrix}
   */
  scale(x, y, z) {
    // prettier-ignore
    return this._multiply(
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    )
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Matrix}
   */
  translate(x, y, z) {
    // prettier-ignore
    return this._multiply(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    );
  }

  /**
   *
   * @param {number} theta
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Matrix}
   */
  rotate(theta, x, y, z) {
    const aMag = Math.sqrt(x * x + y * y + z * z),
      ux = x / aMag,
      uy = y / aMag,
      uz = z / aMag,
      c = Math.cos(theta),
      s = Math.sin(theta);
    // prettier-ignore
    return this._multiply(
      c + ux * ux * (1 - c),
      uy * ux * (1 - c) + uz * s,
      uz * ux * (1 - c) - uy * s,
      0,
      ux * uy * (1 - c) - uz * s,
      c + uy * uy * (1 - c),
      uz * uy * (1 - c) + ux * s,
      0,
      ux * uz * (1 - c) + uy * s,
      uy * uz * (1 - c) - ux * s,
      c + uz * uz * (1 - c),
      0,
      0, 0, 0, 1
    );
  }

  toString() {
    return `${this._buffer[this._start + 0].toFixed(2)} ${this._buffer[
      this._start + 4
    ].toFixed(2)} ${this._buffer[this._start + 8].toFixed(2)} ${this._buffer[
      this._start + 12
    ].toFixed(2)}
${this._buffer[this._start + 1].toFixed(2)} ${this._buffer[
      this._start + 5
    ].toFixed(2)} ${this._buffer[this._start + 9].toFixed(2)} ${this._buffer[
      this._start + 13
    ].toFixed(2)}
${this._buffer[this._start + 2].toFixed(2)} ${this._buffer[
      this._start + 6
    ].toFixed(2)} ${this._buffer[this._start + 10].toFixed(2)} ${this._buffer[
      this._start + 14
    ].toFixed(2)}
${this._buffer[this._start + 3].toFixed(2)} ${this._buffer[
      this._start + 7
    ].toFixed(2)} ${this._buffer[this._start + 11].toFixed(2)} ${this._buffer[
      this._start + 15
    ].toFixed(2)}`;
  }

  /**
   *
   * @returns {Matrix}
   */
  identity() {
    this._buffer[this._start + 0] = 1;
    this._buffer[this._start + 1] = 0;
    this._buffer[this._start + 2] = 0;
    this._buffer[this._start + 3] = 0;
    this._buffer[this._start + 4] = 0;
    this._buffer[this._start + 5] = 1;
    this._buffer[this._start + 6] = 0;
    this._buffer[this._start + 7] = 0;
    this._buffer[this._start + 8] = 0;
    this._buffer[this._start + 9] = 0;
    this._buffer[this._start + 10] = 1;
    this._buffer[this._start + 11] = 0;
    this._buffer[this._start + 12] = 0;
    this._buffer[this._start + 13] = 0;
    this._buffer[this._start + 14] = 0;
    this._buffer[this._start + 15] = 1;

    return this;
  }

  /**
   *
   * @param {number} fovy
   * @param {number} aspect
   * @param {number} zNear
   * @param {number} zFar
   * @returns
   */
  perspective(fovy, aspect, zNear, zFar) {
    const f = 1 / Math.tan(fovy / 2);

    this._buffer[this._start + 0] = f / aspect;
    this._buffer[this._start + 1] = 0;
    this._buffer[this._start + 2] = 0;
    this._buffer[this._start + 3] = 0;

    this._buffer[this._start + 4] = 0;
    this._buffer[this._start + 5] = f;
    this._buffer[this._start + 6] = 0;
    this._buffer[this._start + 7] = 0;

    this._buffer[this._start + 8] = 0;
    this._buffer[this._start + 9] = 0;
    this._buffer[this._start + 10] = (zNear + zFar) / (zNear - zFar);
    this._buffer[this._start + 11] = -1;

    this._buffer[this._start + 12] = 0;
    this._buffer[this._start + 13] = 0;
    this._buffer[this._start + 14] = (2 * zNear * zFar) / (zNear - zFar);
    this._buffer[this._start + 15] = 0;

    return this;
  }

  orthographic(left, right, bottom, top, near, far) {
    this._buffer[this._start + 0] = 2 / (right - left);
    this._buffer[this._start + 1] = 0;
    this._buffer[this._start + 2] = 0;
    this._buffer[this._start + 3] = 0;

    this._buffer[this._start + 4] = 0;
    this._buffer[this._start + 5] = 2 / (top - bottom);
    this._buffer[this._start + 6] = 0;
    this._buffer[this._start + 7] = 0;

    this._buffer[this._start + 8] = 0;
    this._buffer[this._start + 9] = 0;
    this._buffer[this._start + 10] = -2 / (far - near);
    this._buffer[this._start + 11] = 0;

    this._buffer[this._start + 12] = -(right + left) / (right - left);
    this._buffer[this._start + 13] = -(top + bottom) / (top - bottom);
    this._buffer[this._start + 14] = -(far + near) / (far - near);
    this._buffer[this._start + 15] = 1;

    return this;
    // return this.identity()
    //   .scale(2 / (right - left), 2 / (top - bottom), -2 / (far - near))
    //   .translate(
    //     -(right + left) / (right - left),
    //     -(top + bottom) / (top - bottom),
    //     -(far + near) / (far - near)
    //   );
  }
}
