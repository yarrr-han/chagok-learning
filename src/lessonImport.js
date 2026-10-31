import { generateLessons } from "./domain.js";

// Only explicit lesson markers become candidates. Ambiguous OCR remains editable text.
export function parseLessonText(text) {
  if (text.length > 100000)
    throw new Error("읽은 내용이 너무 깁니다. 차시표 부분만 남겨 주세요.");
  const rows = [];
  let page = "",
    current = null,
    pending = "";
  const marker =
    /^(?:제\s*)?(\d{1,3}(?:\s*[~～–—-]\s*\d{1,3})?)\s*차\s*시\s*(?:[|:.)·-]\s*)?(.*)$/;
  for (const original of text.split(/\r?\n/)) {
    const line = original.trim();
    if (!line) continue;
    const pageMatch = line.match(/^【(\d+)쪽】$/);
    if (pageMatch) {
      page = pageMatch[1];
      current = null;
      pending = "";
      continue;
    }
    const match =
      line.match(marker) ||
      line.match(/^(\d{1,3}(?:\s*[~～–—-]\s*\d{1,3})?)\s*[|\t]\s*(.+)$/);
    if (match) {
      const title = match[2].replace(/^[|\s]+/, "").trim();
      current = {
        number: match[1].replace(/\s/g, ""),
        title,
        details: "",
        page,
        selected: true,
      };
      if (rows.length >= 100)
        throw new Error("차시가 너무 많아요. 단원별로 나눠서 읽어 주세요.");
      rows.push(current);
      pending = title ? "" : "title";
    } else if (pending === "title") {
      current.title = line;
      pending = "";
    } else if (current && /^[-•▪●]\s*/.test(line)) {
      current.details +=
        (current.details ? "\n" : "") + line.replace(/^[-•▪●]\s*/, "- ");
    }
  }
  return rows;
}

export function makeImportedLessons(rows) {
  const selected = rows.filter((row) => row.selected);
  if (!selected.length || selected.length > 30)
    throw new Error("지도할 차시를 1~30개 선택해 주세요.");
  return selected.map((row) => {
    const title = row.title.trim();
    if (!title || title.length > 500)
      throw new Error("각 차시의 제목을 1~500자로 확인해 주세요.");
    if (!/^\d{1,3}(?:[~～–—-]\d{1,3})?$/.test(row.number.trim()))
      throw new Error("차시 번호는 숫자 또는 3~4 형태로 입력해 주세요.");
    if ((row.details || "").length > 10000)
      throw new Error("차시 내용은 10,000자 이하로 입력해 주세요.");
    const draft = generateLessons(title, [title], 1)[0];
    return {
      ...draft,
      title, // Keep the reviewed source title; never distribute/repeat source lessons.
      activity: row.details.trim() || draft.activity,
      sourceLabel: `${row.page ? `${row.page}쪽 · ` : ""}${row.number.trim()}차시`,
    };
  });
}
