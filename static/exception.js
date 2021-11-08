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
