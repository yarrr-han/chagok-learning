// Ship OCR/PDF resources with the site: uploaded documents never leave the browser.
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const dest = join(root, "public/reader");
mkdirSync(dest, { recursive: true });
const copy = (source, name) =>
  cpSync(join(root, "node_modules", source), join(dest, name), {
    recursive: true,
  });
copy("tesseract.js/dist/worker.min.js", "ocr-worker.js");
copy("tesseract.js/dist/worker.min.js.LICENSE.txt", "ocr-worker.LICENSE.txt");
copy(
  "tesseract.js-core/tesseract-core-lstm.wasm.js",
  "tesseract-core-lstm.wasm.js",
);
copy("tesseract.js-core/LICENSE", "ocr-core.LICENSE");
for (const lang of ["kor", "eng"])
  copy(
    `@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
    `${lang}.traineddata.gz`,
  );
for (const directory of ["cmaps", "standard_fonts", "wasm"])
  copy(`pdfjs-dist/${directory}`, directory);
copy("pdfjs-dist/LICENSE", "pdf.LICENSE");
copy("tesseract.js/LICENSE.md", "ocr.LICENSE");
for (const lang of ["kor", "eng"]) copy(`@tesseract.js-data/${lang}/package.json`, `${lang}-package.json`);
console.log("Prepared local OCR and PDF resources.");
