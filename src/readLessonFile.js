const MAX_BYTES = 20 * 1024 * 1024;
const abortError = () => new DOMException("읽기를 취소했습니다.", "AbortError");

export function validateLessonFile(file) {
  if (!file || file.size === 0)
    throw new Error("내용이 있는 파일을 선택해 주세요.");
  if (file.size > MAX_BYTES)
    throw new Error("파일은 20 MB 이하로 올려 주세요.");
  const type = file.name.toLowerCase().split(".").pop();
  if (!["pdf", "png", "jpg", "jpeg", "webp"].includes(type))
    throw new Error("PNG, JPG, WEBP 이미지 또는 PDF 파일을 선택해 주세요.");
  return type;
}

export async function readLessonFile(
  file,
  { signal, onProgress, firstPage = 1, lastPage = 10, forceOcr = false },
) {
  const type = validateLessonFile(file);
  if (
    type === "pdf" &&
    (!Number.isInteger(firstPage) ||
      !Number.isInteger(lastPage) ||
      firstPage < 1 ||
      lastPage < firstPage ||
      lastPage - firstPage >= 10)
  ) {
    throw new Error("PDF는 시작 쪽부터 최대 10쪽까지 읽을 수 있어요.");
  }
  // Absolute same-origin URLs also work in workers and under GitHub Pages subpaths.
  const resources = new URL(
    "./reader/",
    new URL(import.meta.env.BASE_URL, document.baseURI),
  );
  let ocr = null,
    pdfTask = null,
    phase = "";
  const check = () => {
    if (signal.aborted) throw abortError();
  };
  const cancel = () => {
    ocr?.terminate();
    pdfTask?.destroy();
  };
  signal.addEventListener("abort", cancel, { once: true });
  const abortable = (promise) =>
    new Promise((resolve, reject) => {
      const abort = () => reject(abortError());
      if (signal.aborted) {
        promise.catch(() => {});
        reject(abortError());
        return;
      }
      signal.addEventListener("abort", abort, { once: true });
      promise
        .then(resolve, reject)
        .finally(() => signal.removeEventListener("abort", abort));
    });
  const recognize = async (canvas) => {
    check();
    if (!ocr) {
      onProgress(
        `${phase}한글 인식 도구 준비 중… 처음에는 시간이 걸릴 수 있어요.`,
      );
      const { createWorker } = await import("tesseract.js");
      check();
      ocr = await abortable(
        createWorker("kor+eng", 1, {
          workerPath: new URL("ocr-worker.js", resources).href,
          corePath: new URL("tesseract-core-lstm.wasm.js", resources).href,
          langPath: resources.href,
          logger: (event) => {
            if (!signal.aborted && event.status === "recognizing text")
              onProgress(
                `${phase}글자 읽는 중 ${Math.round(event.progress * 100)}%`,
              );
          },
        }).then((worker) => {
          if (signal.aborted) {
            worker.terminate();
            throw abortError();
          }
          return worker;
        }),
      );
    }
    check();
    const result = await abortable(ocr.recognize(canvas));
    check();
    return result.data.text;
  };
  try {
    check();
    if (type !== "pdf") {
      const bitmap = await createImageBitmap(file);
      try {
        check();
        if (bitmap.width * bitmap.height > 40000000)
          throw new Error(
            "이미지가 너무 큽니다. 차시표 부분만 잘라서 올려 주세요.",
          );
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return {
          text: await recognize(canvas),
          summary: "이미지 1개를 읽었어요.",
        };
      } finally {
        bitmap.close();
      }
    }
    onProgress("PDF 여는 중…");
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    check();
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    pdfTask = pdfjs.getDocument({
      data: await file.arrayBuffer(),
      cMapUrl: new URL("cmaps/", resources).href,
      cMapPacked: true,
      standardFontDataUrl: new URL("standard_fonts/", resources).href,
      wasmUrl: new URL("wasm/", resources).href,
      isEvalSupported: false,
    });
    pdfTask.onPassword = () => {
      pdfTask.destroy();
    };
    const pdf = await pdfTask.promise;
    check();
    if (firstPage > pdf.numPages)
      throw new Error(
        `이 PDF는 ${pdf.numPages}쪽입니다. 시작 쪽을 확인해 주세요.`,
      );
    const end = Math.min(lastPage, pdf.numPages),
      pages = [];
    for (let n = firstPage; n <= end; n++) {
      check();
      phase = `${n}쪽: `;
      onProgress(`${phase}내용 읽는 중…`);
      const page = await pdf.getPage(n);
      try {
        const content = await page.getTextContent();
        const lines = [];
        // Geometric row grouping avoids concatenating separate table rows.
        for (const item of content.items.filter(
          (item) => "str" in item && item.str.trim(),
        )) {
          const y = item.transform[5];
          let line = lines.find(
            (line) => Math.abs(line.y - y) < Math.max(2, item.height * 0.3),
          );
          if (!line) {
            line = { y, items: [] };
            lines.push(line);
          }
          line.items.push(item);
        }
        let text = lines
          .sort((a, b) => b.y - a.y)
          .map((line) =>
            line.items
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map((item) => item.str)
              .join(" | "),
          )
          .join("\n");
        if (forceOcr || text.replace(/\s/g, "").length < 20) {
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: Math.min(2.5, 2200 / Math.max(base.width, base.height)),
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport,
          }).promise;
          text = await recognize(canvas);
          canvas.width = canvas.height = 0;
        }
        pages.push(`【${n}쪽】\n${text}`);
      } finally {
        page.cleanup();
      }
    }
    return {
      text: pages.join("\n\n"),
      summary: `전체 ${pdf.numPages}쪽 중 ${firstPage}~${end}쪽을 읽었어요.`,
    };
  } catch (error) {
    if (signal.aborted) throw abortError();
    if (
      error.name === "PasswordException" ||
      /password|Password|Worker was destroyed/.test(error.message)
    )
      throw new Error(
        "암호가 걸린 PDF는 읽을 수 없어요. 암호 없는 PDF를 올려 주세요.",
      );
    if (error.name === "InvalidPDFException")
      throw new Error(
        "PDF 파일을 읽지 못했어요. 파일이 손상되지 않았는지 확인해 주세요.",
      );
    if (error.name === "InvalidStateError")
      throw new Error(
        "이미지를 읽지 못했어요. PNG 또는 JPG로 다시 저장해 올려 주세요.",
      );
    throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
    await ocr?.terminate();
    await pdfTask?.destroy();
  }
}
