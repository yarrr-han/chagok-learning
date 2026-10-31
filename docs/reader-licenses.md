# Document reader dependencies

- PDF.js / pdfjs-dist: Apache-2.0 (distributed notice: reader/pdf.LICENSE).
- Tesseract.js: Apache-2.0 (worker bundled notices: reader/ocr-worker.LICENSE.txt).
- Tesseract.js-core: Apache-2.0 (reader/ocr-core.LICENSE).
- Korean and English package wrappers are MIT-licensed (metadata in reader/kor-package.json and reader/eng-package.json). The traineddata is distributed through
  @tesseract.js-data/kor and @tesseract.js-data/eng; underlying Tesseract
  language models are Apache-2.0. Package source/provenance:
  https://github.com/naptha/tessdata and https://github.com/tesseract-ocr/tessdata_best.

Versions and package integrity checks are pinned in package-lock.json.
Only the LSTM engine and 4.0.0_best_int traineddata needed by this app are shipped.
