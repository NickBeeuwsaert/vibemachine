import jsx from "./jsx.js";
import Scene from "./scene.js";
const canvas = document.querySelector("#canvas");
const scene = new Scene(canvas);
// console.log(scene.orthographic(15, -15, 15, -15, 150, -150)._buffer);

scene.perspective(
  (15 * Math.PI) / 180,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000.0
);

window.addEventListener("resize", () => {
  scene.resize();

  scene.perspective(
    (15 * Math.PI) / 180,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000.0
  );
});
(function draw(scene) {
  scene.draw().then(() => requestAnimationFrame(() => draw(scene)));
})(scene);

// draw();

// setTimeout(() => vibe.draw().then(() => vibe.draw()), 1000);
// function generateSVGGrid(grid, strokeWidth = 1) {
//   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   // const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//   svg.setAttribute("width", `${grid.height}px`);
//   svg.setAttribute("height", `${grid.width}px`);

//   // Add slight padding to account for stroke-width
//   svg.setAttribute(
//     "viewBox",
//     `${grid.x - strokeWidth / 2} ${grid.y - strokeWidth / 2} ${
//       grid.width + strokeWidth
//     } ${grid.height + strokeWidth}`
//   );

//   const pathTemplate = document.createElementNS(
//     "http://www.w3.org/2000/svg",
//     "path"
//   );
//   pathTemplate.setAttribute("stroke", "black");
//   pathTemplate.setAttribute("stroke-width", "1px");
//   pathTemplate.setAttribute("fill", "none");

//   for (let offset = 0; offset <= grid.indices.length - 3; offset += 3) {
//     const [a, b, c] = grid.indices.slice(offset, offset + 3);

//     const [x0, y0] = grid.vertices.slice(a * 3, a * 3 + 2);
//     const [x1, y1] = grid.vertices.slice(b * 3, b * 3 + 2);
//     const [x2, y2] = grid.vertices.slice(c * 3, c * 3 + 2);

//     const path = /** @type {SVGPathElement} */ (pathTemplate.cloneNode(true));
//     path.setAttribute("d", `M${x0},${y0} ${x1},${y1} ${x2},${y2}z`);
//     svg.appendChild(path);
//   }
//   return svg;
// }

// const canvas = /** @type HTMLCanvasElement */ (
//     document.getElementById("canvas")
//   ),
//   svg = generateSVGGrid(generateGrid(10, 10, 32)),
//   gl = canvas.getContext("webgl"),
//   // texture = createTexture(gl, createImageFromSVG(svg)),
//   vertexShader = shader.compile(
//     gl,
//     SHADER_TYPES.VERTEX_SHADER,
//     `
//       attribute vec4 aVertexPosition;

//       uniform mat4 uModelViewMatrix;
//       uniform mat4 uProjectionMatrix;

//       void main() {
//         gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//       }
//     `
//   ),
//   fragmentShader = shader.compile(
//     gl,
//     SHADER_TYPES.FRAGMENT_SHADER,
//     `
//       void main() {
//         gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
//       }
//     `
//   ),
//   shaderProgram = shader.link(gl, vertexShader, fragmentShader),
//   programInfo = {
//     program: shaderProgram,
//     attribLocations: {
//       vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
//     },
//     uniformLocations: {
//       projectionMatrix: gl.getUniformLocation(
//         shaderProgram,
//         "uProjectionMatrix"
//       ),
//       modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
//     },
//   },
//   mesh = generateGrid(1, 1, 2),
//   positionBuffer = gl.createBuffer(),
//   indexBuffer = gl.createBuffer();

// document.body.appendChild(svg);
// gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// gl.bufferData(
//   gl.ELEMENT_ARRAY_BUFFER,
//   new Uint16Array(mesh.indices),
//   gl.STATIC_DRAW
// );

// gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
// gl.clearDepth(1.0); // Clear everything
// gl.enable(gl.DEPTH_TEST); // Enable depth testing
// gl.depthFunc(gl.LEQUAL); // Near things obscure far things

// // Clear the canvas before we start drawing on it.

// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// // Create a perspective matrix, a special matrix that is
// // used to simulate the distortion of perspective in a camera.
// // Our field of view is 45 degrees, with a width/height
// // ratio that matches the display size of the canvas
// // and we only want to see objects between 0.1 units
// // and 100 units away from the camera.

// const fieldOfView = (45 * Math.PI) / 180; // in radians
// const aspect = canvas.clientWidth / canvas.clientHeight;
// const zNear = 0.1;
// const zFar = 100.0;
// const projectionMatrix = new Matrix(
//   Array.from({ length: 16 }, () => 0),
//   0
// )
//   .identity()
//   .perspective(fieldOfView, aspect, zNear, zFar);

// // Set the drawing position to the "identity" point, which is
// // the center of the scene.
// const modelViewMatrix = new Matrix(
//   Array.from({ length: 16 }, () => 0),
//   0
// )
//   .identity()
//   .translate(-1, 0, -6)
//   .rotate(Math.PI / 4, 1, 0, 0);

// // Tell WebGL how to pull out the positions from the position
// // buffer into the vertexPosition attribute.
// {
//   const numComponents = 3; // pull out 2 values per iteration
//   const type = gl.FLOAT; // the data in the buffer is 32bit floats
//   const normalize = false; // don't normalize
//   const stride = 0; // how many bytes to get from one set of values to the next
//   // 0 = use type and numComponents above
//   const offset = 0; // how many bytes inside the buffer to start from
//   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//   gl.vertexAttribPointer(
//     programInfo.attribLocations.vertexPosition,
//     numComponents,
//     type,
//     normalize,
//     stride,
//     offset
//   );
//   gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
// }
// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// // Tell WebGL to use our program when drawing

// gl.useProgram(programInfo.program);

// // Set the shader uniforms

// gl.uniformMatrix4fv(
//   programInfo.uniformLocations.projectionMatrix,
//   false,
//   projectionMatrix._buffer
// );
// gl.uniformMatrix4fv(
//   programInfo.uniformLocations.modelViewMatrix,
//   false,
//   modelViewMatrix._buffer
// );

// {
//   gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
//   // const offset = 0;
//   // const vertexCount = 4;
//   // gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
// }

// console.log(jsx`<svg><path d="${1}"/></svg>`);

// document.body.appendChild(
//   jsx`<svg width="100" height="100"><path d="M0,0 50,50 100,0"/></svg>`
// );

// document.body.appendChild(
//   jsx`<div><svg width="100" height="${100}"><path d="M0,0 50,50 100,0"/><foreignObject x="0" y="0" width="100" height="50"><input/></foreignObject></svg></div>`
// );

// const vibe = new Vibe(canvas);

// vibe.draw();
