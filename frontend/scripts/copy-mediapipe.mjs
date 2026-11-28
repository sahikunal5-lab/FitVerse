import {
  cpSync,
  mkdirSync,
  rmSync,
} from "node:fs";

import { resolve } from "node:path";


const source = resolve(
  "node_modules/@mediapipe/tasks-vision/wasm"
);

const destination = resolve(
  "public/wasm"
);


// Remove previously generated runtime files

rmSync(destination, {
  recursive: true,
  force: true,
});


// Create destination directory

mkdirSync(destination, {
  recursive: true,
});


// Copy MediaPipe runtime files

cpSync(source, destination, {
  recursive: true,
});


console.log(
  "MediaPipe WASM files copied successfully."
);