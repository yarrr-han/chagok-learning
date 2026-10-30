import { PUBLISHERS } from "../domain.js";
function TextbookPicker({
  value: value,
  semester: semester,
  options: options,
  onChange: onChange,
  onSemesterChange: onSemesterChange,
}) {
  const updateSelection = (x) =>
      onChange({
        ...value,
        ...x,
        unitId: "",
      }),
    savedOptions = options.filter((x) => x.source === "saved"),
    exampleOptions = options.filter((x) => x.source === "example");
  return (
    <div className={"textbook-picker"}>
      <div className={"form-row"}>
        <label>
          {"학년"}
          <select
            aria-label={"학년"}
            value={value.grade}
            onChange={(x) =>
              updateSelection({
                grade: Number(x.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5, 6].map((x) => (
              <option key={x} value={x}>
                {x}
                {"학년"}
              </option>
            ))}
          </select>
        </label>
        <label>
          {"학기"}
          <select
            aria-label={"학기"}
            value={semester}
            onChange={(x) => onSemesterChange(Number(x.target.value))}
          >
            <option value={1}>{"1학기"}</option>
            <option value={2}>{"2학기"}</option>
          </select>
        </label>
      </div>
      <div className={"form-row"}>
        <label>
          {"과목"}
          <select
            aria-label={"과목"}
            value={value.subject}
            onChange={(x) =>
              updateSelection({
                subject: x.target.value,
              })
            }
          >
            {["수학", "국어", "영어"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          {"출판사"}
          <select
            aria-label={"출판사"}
            value={value.publisher}
            onChange={(x) =>
              updateSelection({
                publisher: x.target.value,
              })
            }
          >
            <option value={""} disabled={true}>
              {"출판사를 선택하세요"}
            </option>
            {PUBLISHERS.map((x) => (
              <option key={x}>{x}</option>
            ))}
            <option value={"other"}>{"다른 출판사 직접 입력"}</option>
            <option value={"미지정"}>{"출판사 미지정"}</option>
          </select>
        </label>
      </div>
      {value.publisher === "other" && (
        <label>
          {"출판사 이름"}
          <input
            value={value.otherPublisher}
            onChange={(x) =>
              updateSelection({
                otherPublisher: x.target.value,
              })
            }
            placeholder={"교과서 표지의 출판사 이름"}
          />
        </label>
      )}
      <label>
        {"단원"}
        <select
          aria-label={"단원"}
          value={value.unitId}
          onChange={(x) =>
            onChange({
              ...value,
              unitId: x.target.value,
            })
          }
        >
          <option value={""} disabled={true}>
            {"단원을 선택하세요"}
          </option>
          {savedOptions.length > 0 && (
            <optgroup label={"이 조건으로 내가 저장한 단원"}>
              {savedOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.number ? `${x.number}단원 · ` : ""}
                  {x.unit}
                </option>
              ))}
            </optgroup>
          )}
          {exampleOptions.length > 0 && (
            <optgroup label={"기본 단원 예시 · 출판사별 검증 전"}>
              {exampleOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.number}
                  {"단원 · "}
                  {x.unit}
                </option>
              ))}
            </optgroup>
          )}
          <option value={"custom"}>{"새 단원 직접 등록"}</option>
        </select>
      </label>
      {!exampleOptions.length && !savedOptions.length && (
        <p className={"selection-note"}>
          {
            "이 조건의 단원 목록은 아직 없어요. 처음 한 번만 등록하면 다음부터 같은 학년·학기·과목·출판사에서 선택할 수 있어요."
          }
        </p>
      )}
      {value.unitId === "custom" && (
        <label>
          {"단원 번호"}
          <select
            aria-label={"단원 번호"}
            value={value.unitNumber}
            onChange={(x) =>
              onChange({
                ...value,
                unitNumber: Number(x.target.value),
              })
            }
          >
            {Array.from(
              {
                length: 20,
              },
              (x, p) => (
                <option key={p + 1} value={p + 1}>
                  {p + 1}
                  {"단원"}
                </option>
              ),
            )}
          </select>
        </label>
      )}
    </div>
  );
}
export default TextbookPicker;
