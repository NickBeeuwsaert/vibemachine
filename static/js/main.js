import Scene from "./scene.js";
const canvas = document.querySelector("#canvas");
const scene = new Scene(canvas);

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
