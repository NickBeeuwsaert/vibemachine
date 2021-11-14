import Scene from "./scene.js";
import { createImageFromURL } from "./texture.js";

(async function (canvas) {
  const scene = new Scene({
    canvas,
    mountainTexture: await createImageFromURL(
      "./static/images/mountainTexture.svg"
    ),
    roadTexture: await createImageFromURL("./static/images/roadTexture.svg"),
    tileTexture: await createImageFromURL("./static/images/tile.svg"),
  });

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

  (function draw() {
    scene.draw();
    requestAnimationFrame(draw);
  })();
})(document.querySelector("#canvas"));
