import fs from "node:fs";
import sharp from "sharp";

export function getImage(path: string, width: number, height: number) {
  return fs.createReadStream(path).pipe(sharp().resize({ width, height }));
}
