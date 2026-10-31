import React, { useEffect, useRef, useState } from "react";
import { parseLessonText, makeImportedLessons } from "../lessonImport.js";
import { readLessonFile, validateLessonFile } from "../readLessonFile.js";

const emptyDraft = {
  file: null,
  text: "",
  rows: [],
  unit: "",
  query: "",
  semester: 1,
  firstPage: 1,
  lastPage: 10,
  forceOcr: false,
  summary: "",
  confirmed: false,
};
export default function LessonImport({ onBuild, initialDraft, onDraftChange }) {
  const [draft, setDraft] = useState(initialDraft || emptyDraft);
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState("");
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    onDraftChange(draft);
  }, [draft, onDraftChange]);
  const patch = (values) => setDraft((old) => ({ ...old, ...values }));
  const changeRow = (index, values) =>
    patch({
      rows: draft.rows.map((row, i) =>
        i === index ? { ...row, ...values } : row,
      ),
      confirmed: false,
    });
  const selected = draft.rows.filter((row) => row.selected).length;

  async function read() {
    if (!draft.file) {
      setError("먼저 차시표 파일을 선택해 주세요.");
      return;
    }
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setBusy(true);
    setError("");
    setProgress("파일 읽기 준비 중…");
    try {
      const result = await readLessonFile(draft.file, {
        signal: controller.signal,
        onProgress: setProgress,
        firstPage: draft.firstPage,
        lastPage: draft.lastPage,
        forceOcr: draft.forceOcr,
      });
      if (controller.signal.aborted) return;
      if (!result.text.trim())
        throw new Error(
          "글자를 찾지 못했어요. 더 선명한 차시표를 올리거나 아래에 직접 붙여넣어 주세요.",
        );
      if (result.text.length > 100000)
        throw new Error(
          "읽은 내용이 너무 많아요. PDF 쪽 범위를 줄이거나 차시표만 잘라 올려 주세요.",
        );
      const rows = parseLessonText(result.text);
      patch({
        text: result.text,
        rows,
        summary: result.summary,
        confirmed: false,
      });
      if (!rows.length)
        setError(
          "차시를 자동으로 나누지 못했어요. 읽은 내용을 ‘1차시 제목’ 형태로 고치거나 차시를 직접 추가해 주세요.",
        );
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e.message ||
            "파일을 읽지 못했어요. 다른 파일을 선택하거나 내용을 붙여넣어 주세요.",
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  function build() {
    setError("");
    try {
      if (!draft.unit.trim()) throw new Error("단원명을 입력해 주세요.");
      if (!draft.confirmed)
        throw new Error(
          "차시 번호·순서·제목을 확인한 뒤 확인란을 선택해 주세요.",
        );
      const lessons = makeImportedLessons(draft.rows);
      onBuild({
        unit: draft.unit.trim(),
        query: draft.query.trim() || "자료 기반 지도계획",
        semester: draft.semester,
        lessons,
      });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section
      className="lesson-import"
      aria-label="차시표 파일로 지도계획 만들기"
    >
      <p className="fine-print">
        캡처 이미지 또는 차시표 PDF를 읽어 지도계획 초안을 만들어요. 파일은 이
        브라우저에서만 처리하며 서버로 전송하거나 저장하지 않아요.
      </p>
      <label>
        차시표 이미지 · PDF
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              validateLessonFile(file);
              patch({
                file,
                text: "",
                rows: [],
                summary: "",
                confirmed: false,
              });
              setError("");
            } catch (e) {
              setError(e.message);
            }
          }}
        />
      </label>
      <p className="fine-print">
        PNG·JPG·WEBP·PDF, 최대 20 MB. 흐릿한 사진이나 복잡한 표는 일부 글자와
        순서가 잘못 읽힐 수 있어요.
      </p>
      {draft.file && (
        <p className="import-filename">선택한 파일: {draft.file.name}</p>
      )}
      {draft.file?.name.toLowerCase().endsWith(".pdf") && (
        <div className="form-row">
          <label>
            PDF 시작 쪽
            <input
              type="number"
              min="1"
              value={draft.firstPage}
              disabled={busy}
              onChange={(e) => patch({ firstPage: Number(e.target.value) })}
            />
          </label>
          <label>
            PDF 마지막 쪽
            <input
              type="number"
              min={draft.firstPage}
              value={draft.lastPage}
              disabled={busy}
              onChange={(e) => patch({ lastPage: Number(e.target.value) })}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.forceOcr}
              disabled={busy}
              onChange={(e) => patch({ forceOcr: e.target.checked })}
            />
            PDF를 이미지로 읽기 (글자가 누락될 때)
          </label>
          <p className="fine-print">
            PDF 파일의 쪽 순서 기준으로 한 번에 최대 10쪽을 읽어요. 차시표가
            있는 범위를 지정해 주세요.
          </p>
        </div>
      )}
      <div className="import-actions">
        <button
          className="button outline"
          disabled={busy || !draft.file}
          onClick={read}
        >
          {busy ? "읽는 중…" : "파일에서 차시 읽기"}
        </button>
        {busy && (
          <button
            className="text-button"
            onClick={() => {
              request.current?.abort();
              request.current = null;
              setBusy(false);
              patch({ summary: "읽기를 취소했어요." });
            }}
          >
            읽기 취소
          </button>
        )}
      </div>
      <p role="status" aria-live="polite">
        {busy ? progress : draft.summary}
      </p>
      <fieldset disabled={busy} className="import-review">
        <label>
          읽은 내용 · 직접 붙여넣기
          <textarea
            rows={7}
            value={draft.text}
            placeholder={
              "1차시 원의 모양 알아보기\n2차시 원의 중심 알아보기\n3~4차시 반지름과 지름 알아보기"
            }
            onChange={(e) =>
              patch({ text: e.target.value, rows: [], confirmed: false })
            }
          />
        </label>
        <button
          className="button outline small"
          disabled={!draft.text.trim()}
          onClick={() => {
            try {
              const rows = parseLessonText(draft.text);
              patch({ rows, confirmed: false });
              setError(
                rows.length
                  ? ""
                  : "차시 번호를 찾지 못했어요. ‘1차시 제목’ 형태로 입력하거나 차시를 추가해 주세요.",
              );
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          읽은 내용으로 차시 목록 갱신
        </button>
        <p className="fine-print">
          차시 번호가 확인된 줄만 목록에 넣어요. 빠진 차시는 추가하고, 잘못 나뉜
          항목은 삭제해 주세요. 3~4차시처럼 묶인 항목은 한 개의 계획 항목으로
          유지됩니다.
        </p>
        <div className="form-row">
          <label>
            단원명
            <input
              value={draft.unit}
              maxLength={200}
              placeholder="예: 원"
              onChange={(e) => patch({ unit: e.target.value })}
            />
          </label>
          <label>
            학년 · 과목 · 교과서 (선택)
            <input
              value={draft.query}
              maxLength={300}
              placeholder="예: 3학년 수학 · 아이스크림미디어"
              onChange={(e) => patch({ query: e.target.value })}
            />
          </label>
          <label>
            학기
            <select
              value={draft.semester}
              onChange={(e) => patch({ semester: Number(e.target.value) })}
            >
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </label>
        </div>
        <h3>차시 확인 · 선택 ({selected}개 선택)</h3>
        {draft.rows.map((row, index) => (
          <div className="import-row" key={index}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={row.selected}
                onChange={(e) =>
                  changeRow(index, { selected: e.target.checked })
                }
              />{" "}
              {index + 1}번째 항목 포함
            </label>
            {row.page && <small>PDF {row.page}쪽</small>}
            <div className="form-row">
              <label>
                원문 차시 번호
                <input
                  aria-label={`${index + 1}번째 차시 번호`}
                  value={row.number}
                  maxLength={9}
                  onChange={(e) => changeRow(index, { number: e.target.value })}
                />
              </label>
              <label>
                차시 제목
                <input
                  aria-label={`${index + 1}번째 차시 제목`}
                  value={row.title}
                  maxLength={500}
                  onChange={(e) => changeRow(index, { title: e.target.value })}
                />
              </label>
            </div>
            <label>
              자료의 지도 내용 (선택)
              <textarea
                rows={2}
                value={row.details}
                maxLength={10000}
                placeholder="자료에 있는 활동을 입력하면 그대로 사용해요. 비워두면 제목을 바탕으로 활동 초안을 만들어요."
                onChange={(e) => changeRow(index, { details: e.target.value })}
              />
            </label>
            <div className="import-actions">
              <button
                className="text-button"
                disabled={index === 0}
                aria-label={`${index + 1}번째 차시 위로`}
                onClick={() => {
                  const rows = [...draft.rows];
                  [rows[index - 1], rows[index]] = [
                    rows[index],
                    rows[index - 1],
                  ];
                  patch({ rows, confirmed: false });
                }}
              >
                위로
              </button>
              <button
                className="text-button"
                disabled={index === draft.rows.length - 1}
                aria-label={`${index + 1}번째 차시 아래로`}
                onClick={() => {
                  const rows = [...draft.rows];
                  [rows[index + 1], rows[index]] = [
                    rows[index],
                    rows[index + 1],
                  ];
                  patch({ rows, confirmed: false });
                }}
              >
                아래로
              </button>
              <button
                className="text-button danger"
                aria-label={`${index + 1}번째 차시 삭제`}
                onClick={() =>
                  patch({
                    rows: draft.rows.filter((_, i) => i !== index),
                    confirmed: false,
                  })
                }
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <button
          className="button outline small"
          disabled={draft.rows.length >= 100}
          onClick={() =>
            patch({
              rows: [
                ...draft.rows,
                {
                  number: String(draft.rows.length + 1),
                  title: "",
                  details: "",
                  page: "",
                  selected: true,
                },
              ],
              confirmed: false,
            })
          }
        >
          차시 직접 추가
        </button>
        <p className="fine-print">
          선택한 차시의 제목과 순서를 그대로 사용해요. 자료에 지도 내용이 없으면
          제목에 따른 활동 초안을 제안하므로, 교과서 원문과 같은 내용인지는
          선생님이 확인해 주세요.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={draft.confirmed}
            onChange={(e) => patch({ confirmed: e.target.checked })}
          />
          원본과 비교해 차시 번호·순서·제목을 확인했어요.
        </label>
        <button
          className="button primary full"
          disabled={
            !draft.confirmed ||
            !draft.unit.trim() ||
            selected < 1 ||
            selected > 30
          }
          onClick={build}
        >
          {selected}개 차시로 지도계획 만들기
        </button>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
