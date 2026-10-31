import React from "react";
import { ArrowRight } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { BookOpen } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Check } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { CircleCheck } from "lucide-react";
import { CircleQuestionMark } from "lucide-react";
import { Clock3 } from "lucide-react";
import { Download } from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import { Leaf } from "lucide-react";
import { NotebookPen } from "lucide-react";
import { Pencil } from "lucide-react";
import { Plus } from "lucide-react";
import { Settings2 } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Sprout } from "lucide-react";
import { Trash2 } from "lucide-react";
import { X } from "lucide-react";
import {
  WEEKDAYS,
  todayInSeoul,
  nextMonth,
  generateTimeSlots,
  findExampleUnit,
  generateLessons,
  getProgress,
  assignLessonsToSlots,
  parseBackup,
  getUnitOptions,
  INITIAL_TEXTBOOK,
  getPublisher,
  STORAGE_KEY,
  loadState,
  downloadFile,
} from "./domain.js";
import LessonImport from "./components/LessonImport.jsx";
import Modal from "./components/Modal.jsx";
import EmptyState from "./components/EmptyState.jsx";
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
  },
  {
    id: "plans",
    label: "지도계획",
    icon: BookOpen,
  },
  {
    id: "journals",
    label: "지도일지",
    icon: NotebookPen,
  },
  {
    id: "calendar",
    label: "수업 달력",
    icon: CalendarDays,
  },
];
function App() {
  var mn, Qt, Cl;
  const [state, setState] = React.useState(loadState),
    [activePage, setActivePage] = React.useState("dashboard"),
    [toast, setToast] = React.useState(""),
    [storageError, setStorageError] = React.useState(false),
    [planMode, setPlanMode] = React.useState("upload"),
    [uploadDraft, setUploadDraft] = React.useState(null),
    [textbook, setTextbook] = React.useState(INITIAL_TEXTBOOK),
    [editingPlanId, setEditingPlanId] = React.useState(null),
    [backupError, setBackupError] = React.useState(""),
    [backupPreview, setBackupPreview] = React.useState(null),
    [planModalOpen, setPlanModalOpen] = React.useState(false),
    [planQuery, setPlanQuery] = React.useState(""),
    [semester, setSemester] = React.useState(1),
    [lessonCount, setLessonCount] = React.useState(6),
    [unitName, setUnitName] = React.useState(""),
    [focusTopics, setFocusTopics] = React.useState(""),
    [draftLessons, setDraftLessons] = React.useState([]),
    [planError, setPlanError] = React.useState(""),
    [journalLessonId, setJournalLessonId] = React.useState(""),
    [journalDate, setJournalDate] = React.useState(todayInSeoul()),
    [journalContent, setJournalContent] = React.useState(""),
    [journalObservation, setJournalObservation] = React.useState(""),
    [journalDone, setJournalDone] = React.useState(false),
    [journalError, setJournalError] = React.useState(""),
    [selectedPlanId, setSelectedPlanId] = React.useState(null),
    [targetModalOpen, setTargetModalOpen] = React.useState(false),
    [targetInput, setTargetInput] = React.useState(state.target),
    [helpOpen, setHelpOpen] = React.useState(false),
    [calendarMonth, setCalendarMonth] = React.useState(nextMonth()),
    [selectedWeekdays, setSelectedWeekdays] = React.useState([1, 3]),
    [selectedPeriods, setSelectedPeriods] = React.useState([6]),
    [excludedDates, setExcludedDates] = React.useState([]),
    progress = getProgress(state),
    allLessons = state.plans.flatMap((o) =>
      o.lessons.map((_, C) => ({
        ..._,
        plan: o,
        index: C,
      })),
    ),
    selectedLesson = allLessons.find((o) => o.id === journalLessonId),
    selectedPlan = state.plans.find((o) => o.id === selectedPlanId),
    timeSlots = React.useMemo(
      () =>
        generateTimeSlots(
          calendarMonth,
          selectedWeekdays,
          selectedPeriods,
          excludedDates,
        ),
      [calendarMonth, selectedWeekdays, selectedPeriods, excludedDates],
    ),
    proposedBookings = assignLessonsToSlots(state, timeSlots),
    pendingBookings = state.bookings.filter(
      (o) => !state.journals.some((_) => _.lessonId === o.lessonId && _.done),
    ),
    unitOptions = getUnitOptions(
      textbook.grade,
      semester,
      textbook.subject,
      getPublisher(textbook),
      state.plans,
    ),
    selectedUnit = unitOptions.find((o) => o.id === textbook.unitId),
    exampleUnit =
      planMode === "select"
        ? selectedUnit
        : findExampleUnit(planQuery, semester),
    planPublisher = editingPlanId
      ? (Qt =
          (mn = state.plans.find((o) => o.id === editingPlanId)) == null
            ? void 0
            : mn.textbook) == null
        ? void 0
        : Qt.publisher
      : planMode === "select"
        ? getPublisher(textbook)
        : "";
  function changeTextbook(o) {
    (setTextbook(o), setUnitName(""), setFocusTopics(""), setPlanError(""));
  }
  function changeSemester(o) {
    (setSemester(o),
      changeTextbook({
        ...textbook,
        unitId: "",
      }));
  }
  function changePlanMode(o) {
    (setPlanMode(o), setUnitName(""), setFocusTopics(""), setPlanError(""));
  }
  (React.useEffect(() => {
    try {
      (localStorage.setItem(STORAGE_KEY, JSON.stringify(state)),
        setStorageError(false));
    } catch {
      setStorageError(true);
    }
  }, [state]),
    React.useEffect(() => {
      if (!toast) return;
      const o = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(o);
    }, [toast]));
  function openNewPlan() {
    (setEditingPlanId(null),
      setPlanMode("upload"),
      setUploadDraft(null),
      setDraftLessons([]),
      setPlanError(""),
      setUnitName(""),
      setFocusTopics(""),
      setPlanModalOpen(true));
  }
  function buildLessonDraft() {
    if (planMode === "select") {
      if (!getPublisher(textbook))
        return setPlanError(
          "출판사를 선택해 주세요. 미정이면 출판사 미지정을 선택할 수 있어요.",
        );
      if (!selectedUnit && textbook.unitId !== "custom")
        return setPlanError("지도할 단원을 선택해 주세요.");
    } else if (!planQuery.trim())
      return setPlanError("학년, 과목, 단원을 입력해 주세요.");
    if (!exampleUnit && (!unitName.trim() || !focusTopics.trim()))
      return setPlanError(
        "이 단원은 단원명과 핵심 학습 내용을 직접 입력해 주세요.",
      );
    if (lessonCount < 1 || lessonCount > 30 || !Number.isInteger(lessonCount))
      return setPlanError("지도 차시는 1~30 사이의 정수로 입력해 주세요.");
    const o =
        (exampleUnit == null ? void 0 : exampleUnit.unit) || unitName.trim(),
      _ = focusTopics.trim()
        ? focusTopics
            .split(/[,\n]/)
            .map((C) => C.trim())
            .filter(Boolean)
        : exampleUnit.topics;
    if (!_.length)
      return setPlanError("핵심 학습 내용을 한 가지 이상 입력해 주세요.");
    (planMode === "select" &&
      setPlanQuery(
        `${textbook.grade}학년 ${textbook.subject} ${(selectedUnit == null ? void 0 : selectedUnit.number) ?? textbook.unitNumber}단원`,
      ),
      setUnitName(o),
      setDraftLessons(generateLessons(o, _, lessonCount)),
      setPlanError(""));
  }
  function editPlan(o) {
    (setEditingPlanId(o.id),
      setPlanQuery(o.query),
      setSemester(o.semester),
      setUnitName(o.unit),
      setFocusTopics(o.focus),
      setLessonCount(o.lessons.length),
      setDraftLessons(
        o.lessons.map((_) => ({
          ..._,
        })),
      ),
      setSelectedPlanId(null),
      setPlanModalOpen(true));
  }
  async function readBackupFile(o) {
    if ((setBackupError(""), setBackupPreview(null), !!o))
      try {
        if (o.size > 5e6)
          throw new Error("백업 파일은 5 MB 이하만 사용할 수 있어요.");
        setBackupPreview(parseBackup(await o.text()));
      } catch (_) {
        setBackupError(
          _ instanceof Error ? _.message : "파일을 읽지 못했어요.",
        );
      }
  }
  function savePlan() {
    if (editingPlanId) {
      (setState((_) => ({
        ..._,
        plans: _.plans.map((C) =>
          C.id === editingPlanId
            ? {
                ...C,
                lessons: draftLessons,
              }
            : C,
        ),
      })),
        setPlanModalOpen(false),
        setEditingPlanId(null),
        setToast("계획을 수정했어요. 기존 일지와 일정은 유지됩니다."));
      return;
    }
    const o = {
      id: crypto.randomUUID(),
      query: planQuery.trim(),
      semester: semester,
      unit: unitName,
      focus:
        focusTopics ||
        (exampleUnit == null ? void 0 : exampleUnit.topics.join(", ")) ||
        unitName,
      created: todayInSeoul(),
      lessons: draftLessons,
      ...(planMode === "select"
        ? {
            textbook: {
              grade: textbook.grade,
              subject: textbook.subject,
              publisher: getPublisher(textbook),
              unitNumber:
                (selectedUnit == null ? void 0 : selectedUnit.number) ??
                textbook.unitNumber,
            },
          }
        : {}),
    };
    (setState((_) => ({
      ..._,
      plans: [o, ..._.plans],
    })),
      setPlanModalOpen(false),
      setToast("지도계획을 저장했어요. 이제 수업을 배치해 보세요."));
  }
  function openJournal(o) {
    const _ =
      allLessons.find((dl) => dl.id === o) ||
      allLessons.find(
        (dl) => !state.journals.some((le) => le.lessonId === dl.id && le.done),
      ) ||
      allLessons[0];
    if (!_) {
      setToast("먼저 지도계획을 만들어 주세요.");
      return;
    }
    const C = state.journals.find((dl) => dl.lessonId === _.id),
      J = state.bookings.find((dl) => dl.lessonId === _.id);
    (setJournalLessonId(_.id),
      setJournalDate(
        (C == null ? void 0 : C.date) ||
          (J == null ? void 0 : J.date) ||
          todayInSeoul(),
      ),
      setJournalContent((C == null ? void 0 : C.content) || _.activity),
      setJournalObservation((C == null ? void 0 : C.observation) || ""),
      setJournalDone((C == null ? void 0 : C.done) || false),
      setJournalError(""));
  }
  function saveJournal() {
    if (!journalDate || !journalContent.trim())
      return setJournalError("수업일과 실제 지도 내용을 입력해 주세요.");
    if (journalDone && journalDate > todayInSeoul())
      return setJournalError(
        "미래의 수업은 완료로 저장할 수 없어요. 임시 저장을 이용해 주세요.",
      );
    if (journalDone && !journalObservation.trim())
      return setJournalError(
        "완료한 수업의 학생 반응이나 관찰 내용을 기록해 주세요.",
      );
    const o = {
      lessonId: journalLessonId,
      date: journalDate,
      content: journalContent,
      observation: journalObservation,
      done: journalDone,
    };
    (setState((_) => ({
      ..._,
      journals: [
        ..._.journals.filter((C) => C.lessonId !== journalLessonId),
        o,
      ],
    })),
      setJournalLessonId(""),
      setToast(
        journalDone
          ? "지도일지를 저장하고 이수 차시에 반영했어요."
          : "지도일지를 임시 저장했어요.",
      ));
  }
  function deletePlan(o) {
    if (
      !window.confirm(`‘${o.unit}’ 계획과 연결된 일지·일정을 모두 삭제할까요?`)
    )
      return;
    const _ = new Set(o.lessons.map((C) => C.id));
    (setState((C) => ({
      ...C,
      plans: C.plans.filter((J) => J.id !== o.id),
      journals: C.journals.filter((J) => !_.has(J.lessonId)),
      bookings: C.bookings.filter((J) => !_.has(J.lessonId)),
    })),
      setSelectedPlanId(null),
      setToast("계획을 삭제했어요."));
  }
  function exportJournalsCsv() {
    const o = [
      [
        "단원",
        "출판사",
        "차시",
        "수업일",
        "상태",
        "지도 내용",
        "관찰 및 다음 지도",
      ],
      ...state.journals.map((_) => {
        var J;
        const C = allLessons.find((dl) => dl.id === _.lessonId);
        return [
          (C == null ? void 0 : C.plan.unit) || "",
          ((J = C == null ? void 0 : C.plan.textbook) == null
            ? void 0
            : J.publisher) || "미지정",
          String(((C == null ? void 0 : C.index) ?? 0) + 1),
          _.date,
          _.done ? "완료" : "임시",
          _.content,
          _.observation,
        ];
      }),
    ];
    downloadFile(
      `차곡_지도일지_${todayInSeoul()}.csv`,
      "\uFEFF" +
        o.map((_) => _.map((C) => '"' + C.replace(/"/g, '""') + '"').join(","))
          .join(`\r
`),
      "text/csv;charset=utf-8",
    );
  }
  function shiftMonth(o) {
    const [_, C] = calendarMonth.split("-").map(Number),
      J = new Date(_, C - 1 + o, 1);
    setCalendarMonth(
      `${J.getFullYear()}-${String(J.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  const [calendarYear, monthNumber] = calendarMonth.split("-").map(Number),
    daysInMonth = new Date(calendarYear, monthNumber, 0).getDate(),
    firstWeekday = new Date(calendarYear, monthNumber - 1, 1).getDay(),
    monthLabel = `${calendarYear}년 ${monthNumber}월`,
    planList = (
      <div className={"plan-list"}>
        {state.plans.map((o) => {
          const _ = o.lessons.filter((C) =>
            state.journals.some((J) => J.lessonId === C.id && J.done),
          ).length;
          return (
            <button
              key={o.id}
              className={"plan-row"}
              onClick={() => setSelectedPlanId(o.id)}
            >
              <span className={"subject-icon"}>
                <BookOpen size={21} />
              </span>
              <span className={"plan-row-main"}>
                <strong>{o.unit}</strong>
                <span>
                  {o.query}
                  {" · "}
                  {o.semester}
                  {"학기"}
                  {o.textbook && ` · ${o.textbook.publisher}`}
                </span>
              </span>
              <span className={"plan-mini-progress"}>
                <span>
                  {_}
                  <small>
                    {" / "}
                    {o.lessons.length}
                    {"차시"}
                  </small>
                </span>
                <i>
                  <b
                    style={{
                      width: `${(_ / o.lessons.length) * 100}%`,
                    }}
                  />
                </i>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
    ),
    calendarGrid = (
      <div className={"calendar-grid"}>
        {WEEKDAYS.map((o, _) => (
          <div key={o} className={`weekday ${_ === 0 ? "sun" : ""}`}>
            {o}
          </div>
        ))}
        {Array.from(
          {
            length: firstWeekday,
          },
          (o, _) => (
            <div key={`blank${_}`} className={"calendar-day blank"} />
          ),
        )}
        {Array.from(
          {
            length: daysInMonth,
          },
          (o, _) => {
            const C = `${calendarMonth}-${String(_ + 1).padStart(2, "0")}`,
              J = state.bookings.filter((Il) => Il.date === C),
              dl = timeSlots.filter((Il) => Il.date === C),
              le = excludedDates.includes(C);
            return (
              <button
                key={C}
                className={`calendar-day ${dl.length ? "available" : ""} ${J.length ? "booked" : ""} ${le ? "excluded" : ""} ${C === todayInSeoul() ? "today" : ""}`}
                onClick={() =>
                  setExcludedDates((Il) =>
                    Il.includes(C) ? Il.filter((vn) => vn !== C) : [...Il, C],
                  )
                }
                aria-label={`${monthNumber}월 ${_ + 1}일 ${le ? "제외 해제" : "배치 제외"}${J.length ? " (확정 일정은 유지됩니다)" : ""}`}
              >
                <span>{_ + 1}</span>
                {J.length ? (
                  <small>
                    {J.map((Il) => Il.period).join(", ")}
                    {"교시 확정"}
                  </small>
                ) : le ? (
                  <small>{"제외"}</small>
                ) : dl.length ? (
                  <small>
                    {dl.map((Il) => Il.period).join(", ")}
                    {"교시"}
                  </small>
                ) : null}
              </button>
            );
          },
        )}
      </div>
    );
  return (
    <div className={"app-shell"}>
      <aside className={"sidebar"}>
        <a
          className={"brand"}
          href={"#"}
          onClick={(o) => {
            (o.preventDefault(), setActivePage("dashboard"));
          }}
        >
          <span className={"brand-symbol"}>
            <Sprout size={26} />
          </span>
          <span>
            {"차곡"}
            <span className={"brand-dot"}>{"."}</span>
          </span>
        </a>
        <p className={"brand-caption"}>{"배움의 빈틈을 채우는 시간"}</p>
        <div className={"workspace-label"}>
          {"나의 교실 "}
          <span>{"TEACHER"}</span>
        </div>
        <nav>
          {NAV_ITEMS.map(({ id: o, label: _, icon: C }) => (
            <button
              key={o}
              className={activePage === o ? "active" : ""}
              onClick={() => setActivePage(o)}
            >
              <C size={20} />
              {_}
              {o === "journals" && state.journals.length > 0 && (
                <span className={"nav-count"}>{state.journals.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className={"sidebar-bottom"}>
          <div className={"sidebar-note"}>
            <Leaf size={22} />
            <strong>
              {"작은 배움이 쌓여,"}
              <br />
              {"큰 성장이 되도록."}
            </strong>
            <p>{"선생님의 매일을 응원해요."}</p>
          </div>
          <button className={"help-button"} onClick={() => setHelpOpen(true)}>
            <CircleQuestionMark size={18} />
            {" 이용 안내 "}
            <ArrowUpRight size={15} />
          </button>
          <div className={"profile"}>
            <div className={"avatar"}>{"T"}</div>
            <span>
              <strong>{"우리 반 선생님"}</strong>
              <small>{"기초학력 지도 공간"}</small>
            </span>
            <button
              className={"icon-button"}
              onClick={() => {
                (setTargetInput(state.target), setTargetModalOpen(true));
              }}
              aria-label={"목표 차시 설정"}
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className={"main-shell"}>
        <header className={"topbar"}>
          <span>
            {"나의 교실 "}
            <ChevronRight size={14} />{" "}
            <strong>
              {(Cl = NAV_ITEMS.find((o) => o.id === activePage)) == null
                ? void 0
                : Cl.label}
            </strong>
          </span>
          <span className={"storage-state"}>
            <span className={storageError ? "error-dot" : "green-dot"} />
            {storageError ? "저장 공간 확인 필요" : "이 브라우저에 자동 저장"}
            <button
              className={"icon-button mobile-settings"}
              aria-label={"목표 차시 설정"}
              onClick={() => {
                (setTargetInput(state.target), setTargetModalOpen(true));
              }}
            >
              <Settings2 size={16} />
            </button>
          </span>
        </header>
        <main>
          <div className={"page-heading"}>
            <div>
              <p className={"eyebrow"}>{"차곡차곡, 함께 자라는 배움"}</p>
              <h1>
                {activePage === "dashboard"
                  ? "선생님, 오늘도 반가워요"
                  : activePage === "plans"
                    ? "아이의 속도에 맞춘 지도계획"
                    : activePage === "journals"
                      ? "작은 성장을 기록하는 지도일지"
                      : "배움의 시간을 미리 채워요"}
                {activePage === "dashboard" && (
                  <span className={"greeting-sprout"}>{"🌱"}</span>
                )}
              </h1>
              <p>
                {activePage === "dashboard"
                  ? "계획부터 기록까지, 기초학력 지도를 한곳에서 관리해 보세요."
                  : activePage === "plans"
                    ? "차시표 이미지·PDF로 차시별 목표와 활동을 준비해 보세요."
                    : activePage === "journals"
                      ? "계획을 바탕으로 실제 지도 내용과 학생의 변화를 남겨 보세요."
                      : "가능한 요일과 교시를 선택하면, 남은 수업을 달력에 배치해 드려요."}
              </p>
            </div>
            <button
              className={"button primary"}
              onClick={
                activePage === "journals" ? () => openJournal() : openNewPlan
              }
            >
              <Plus size={18} />
              {activePage === "journals" ? "지도일지 작성" : "새 지도계획"}
            </button>
          </div>
          {storageError && (
            <div className={"notice error"}>
              {
                "브라우저 저장에 실패했습니다. 기록 백업을 내려받고 저장 공간을 확인해 주세요."
              }{" "}
              <button
                onClick={() =>
                  downloadFile("차곡_백업.json", JSON.stringify(state, null, 2))
                }
              >
                {"백업 다운로드"}
              </button>
            </div>
          )}
          {activePage === "dashboard" && (
            <React.Fragment>
              <section className={"welcome-banner"}>
                <div>
                  <span className={"banner-label"}>
                    <Sparkles size={14} />
                    {" 수업 준비는 가볍게, 아이의 성장은 차곡차곡"}
                  </span>
                  <h2>
                    {"차시표를 올리면,"}
                    <br />
                    {"우리 반에 꼭 맞는 지도계획."}
                  </h2>
                  <p>
                    {
                      "계획을 세우고, 수업을 기록하고, 다음 배움까지 이어 가세요."
                    }
                  </p>
                  <button onClick={openNewPlan}>
                    {"첫 지도계획 시작하기 "}
                    <ArrowRight size={17} />
                  </button>
                </div>
                <div className={"banner-art"} aria-hidden={"true"}>
                  <div className={"orbit orbit-one"} />
                  <div className={"orbit orbit-two"} />
                  <span className={"art-spark"}>{"✧"}</span>
                  <div className={"art-sheet"}>
                    <div className={"art-tab"} />
                    <span className={"art-title"}>{"GROWING TOGETHER"}</span>
                    <div className={"art-line long"} />
                    <div className={"art-check"}>
                      <Check size={12} />
                      <i />
                    </div>
                    <div className={"art-check"}>
                      <Check size={12} />
                      <i />
                    </div>
                    <div className={"art-check"}>
                      <Check size={12} />
                      <i />
                    </div>
                    <div className={"art-chart"}>
                      <b />
                      <b />
                      <b />
                      <b />
                    </div>
                  </div>
                  <div className={"art-badge"}>
                    <Sprout size={25} />
                  </div>
                  <span className={"art-dot"} />
                </div>
              </section>
              <div className={"stats-grid"}>
                <section className={"stat-card"}>
                  <div className={"stat-top"}>
                    <span>{"전체 지도 차시"}</span>
                    <span className={"stat-icon violet"}>
                      <BookOpen size={19} />
                    </span>
                  </div>
                  <div className={"stat-number"}>
                    {state.target}
                    <small>{"차시"}</small>
                    <button
                      className={"text-button"}
                      onClick={() => {
                        (setTargetInput(state.target),
                          setTargetModalOpen(true));
                      }}
                    >
                      {"목표 설정 "}
                      <Pencil size={12} />
                    </button>
                  </div>
                  <p>{"올해 우리 반의 배움 목표"}</p>
                </section>
                <section className={"stat-card"}>
                  <div className={"stat-top"}>
                    <span>{"완료한 수업"}</span>
                    <span className={"stat-icon green"}>
                      <CircleCheck size={19} />
                    </span>
                  </div>
                  <div className={"stat-number"}>
                    {progress.done}
                    <small>{"차시"}</small>
                    <span className={"pill green"}>{"차곡차곡 성장 중"}</span>
                  </div>
                  <p>{"완료로 저장한 지도일지 기준"}</p>
                </section>
                <section className={"stat-card"}>
                  <div className={"stat-top"}>
                    <span>{"남은 수업"}</span>
                    <span className={"stat-icon amber"}>
                      <Clock3 size={19} />
                    </span>
                  </div>
                  <div className={"stat-number"}>
                    {progress.remaining}
                    <small>{"차시"}</small>
                    <button
                      className={"text-button"}
                      onClick={() => setActivePage("calendar")}
                    >
                      {"일정 배치 "}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <p>
                    {"확정된 예정 수업 "}
                    {pendingBookings.length}
                    {"차시 포함"}
                  </p>
                </section>
              </div>
              <section className={"progress-card"}>
                <div className={"progress-heading"}>
                  <span>
                    <strong>{"우리 반 배움의 여정"}</strong>
                    <small>{"한 차시씩, 목표에 가까워지고 있어요."}</small>
                  </span>
                  <strong className={"purple"}>
                    {progress.percent}
                    <small>{"% 달성"}</small>
                  </strong>
                </div>
                <div
                  className={"progress-track"}
                  role={"progressbar"}
                  aria-label={"전체 수업 이수율"}
                  aria-valuenow={progress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    style={{
                      width: `${progress.percent}%`,
                    }}
                  />
                </div>
                <div className={"progress-labels"}>
                  <span>
                    <i />
                    {"완료 "}
                    {progress.done}
                    {"차시"}
                  </span>
                  <span>
                    {"목표 "}
                    {state.target}
                    {"차시"}
                  </span>
                </div>
              </section>
              <div className={"dashboard-columns"}>
                <section className={"panel quick-plan"}>
                  <div className={"section-heading"}>
                    <h2>
                      <span className={"section-icon violet"}>
                        <Sparkles size={18} />
                      </span>
                      {"어떤 단원을 지도할까요?"}
                    </h2>
                    <span className={"pill lavender"}>{"계획 도우미"}</span>
                  </div>
                  <p className={"section-description"}>
                    {"차시가 적힌 캡처나 PDF로 지도계획의 시작을 도와드려요."}
                  </p>
                  <div className={"quick-selection-summary"}>
                    <span>
                      <small>{"STEP 1"}</small>
                      <strong>{"차시표 올리기"}</strong>
                    </span>
                    <ChevronRight size={16} />
                    <span>
                      <small>{"STEP 2"}</small>
                      <strong>{"차시 확인"}</strong>
                    </span>
                    <ChevronRight size={16} />
                    <span>
                      <small>{"STEP 3"}</small>
                      <strong>{"계획 만들기"}</strong>
                    </span>
                  </div>
                  <p className={"quick-selection-hint"}>
                    {"파일에서 읽은 차시를 확인하고 필요한 수업만 골라 보세요."}
                  </p>
                  <button
                    className={"button primary full"}
                    onClick={openNewPlan}
                  >
                    <BookOpen size={16} />
                    {" 차시표 파일로 시작하기"} <ArrowRight size={16} />
                  </button>
                  <div className={"soft-tip"}>
                    <span>{"💡"}</span>
                    <p>
                      {"단원 확인 → 차시별 계획 → 지도일지"}
                      <br />
                      <strong>
                        {"수업 준비부터 기록까지 자연스럽게 이어져요."}
                      </strong>
                    </p>
                  </div>
                </section>
                <section className={"panel schedule-preview"}>
                  <div className={"section-heading"}>
                    <h2>
                      <span className={"section-icon peach"}>
                        <CalendarDays size={18} />
                      </span>
                      {"다음 배움 미리 준비하기"}
                    </h2>
                    <button
                      className={"icon-button"}
                      aria-label={"달력으로 이동"}
                      onClick={() => setActivePage("calendar")}
                    >
                      <ArrowUpRight size={19} />
                    </button>
                  </div>
                  <p className={"section-description"}>
                    {"다음 달, 우리 반은 몇 번 더 만날 수 있을까요?"}
                  </p>
                  <div className={"schedule-illustration"}>
                    <CalendarDays size={33} />
                    <span>
                      <strong>
                        {nextMonth().replace("-", "년 ")}
                        {"월"}
                      </strong>
                      <small>{"월·수요일 · 6교시 기준"}</small>
                    </span>
                    <span className={"capacity-number"}>
                      {generateTimeSlots(nextMonth(), [1, 3], [6], []).length}
                      <small>{"차시"}</small>
                    </span>
                  </div>
                  <div className={"mini-week"}>
                    {WEEKDAYS.map((o, _) => (
                      <span
                        key={o}
                        className={_ === 1 || _ === 3 ? "selected" : ""}
                      >
                        {o}
                        {_ === 1 || _ === 3 ? <i /> : <b />}
                      </span>
                    ))}
                  </div>
                  <p className={"fine-print"}>
                    {"휴일·학교 일정 제외 전 예상 차시예요."}
                  </p>
                  <button
                    className={"button outline full"}
                    onClick={() => {
                      (setCalendarMonth(nextMonth()),
                        setActivePage("calendar"));
                    }}
                  >
                    {"수업 일정 배치하기 "}
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <section className={"panel recent"}>
                <div className={"section-heading"}>
                  <h2>
                    {"나의 지도계획"}{" "}
                    <span className={"count-label"}>{state.plans.length}</span>
                  </h2>
                  <button
                    className={"text-button"}
                    onClick={() => setActivePage("plans")}
                  >
                    {"전체 보기 "}
                    <ChevronRight size={15} />
                  </button>
                </div>
                {state.plans.length ? (
                  planList
                ) : (
                  <EmptyState
                    title={"첫 배움의 계획을 세워 보세요"}
                    text={"차시표에서 만든 지도계획이 이곳에 차곡차곡 쌓여요."}
                  />
                )}
              </section>
            </React.Fragment>
          )}
          {activePage === "plans" && (
            <section className={"panel"}>
              <div className={"section-heading"}>
                <h2>
                  {"전체 지도계획"}{" "}
                  <span className={"count-label"}>{state.plans.length}</span>
                </h2>
                <span className={"muted"}>
                  {"총 "}
                  {allLessons.length}
                  {"차시 계획"}
                </span>
              </div>
              {state.plans.length ? (
                planList
              ) : (
                <EmptyState
                  title={"우리 반의 첫 지도계획"}
                  text={
                    "수업할 단원을 선택하고 차시별 지도 내용을 준비해 보세요."
                  }
                  action={
                    <button className={"button primary"} onClick={openNewPlan}>
                      <Plus size={16} />
                      {" 지도계획 만들기"}
                    </button>
                  }
                />
              )}
            </section>
          )}
          {activePage === "journals" && (
            <section className={"panel"}>
              <div className={"section-heading"}>
                <h2>
                  {"지도 기록"}{" "}
                  <span className={"count-label"}>{state.journals.length}</span>
                </h2>
                <button
                  disabled={!state.journals.length}
                  className={"button outline small"}
                  onClick={exportJournalsCsv}
                >
                  <Download size={15} />
                  {" CSV 내려받기"}
                </button>
              </div>
              {state.journals.length ? (
                <div className={"journal-list"}>
                  {[...state.journals]
                    .sort((o, _) => _.date.localeCompare(o.date))
                    .map((o) => {
                      const _ = allLessons.find((C) => C.id === o.lessonId);
                      return (
                        <article key={o.lessonId} className={"journal-card"}>
                          <div>
                            <span
                              className={`pill ${o.done ? "green" : "lavender"}`}
                            >
                              {o.done ? "수업 완료" : "임시 저장"}
                            </span>
                            <span className={"muted"}>
                              {o.date}
                              {" · "}
                              {_ == null ? void 0 : _.plan.unit}
                              {" · "}
                              {((_ == null ? void 0 : _.index) ?? 0) + 1}
                              {"차시"}
                            </span>
                          </div>
                          <h3>{_ == null ? void 0 : _.title}</h3>
                          <p>{o.content}</p>
                          {o.observation && (
                            <div className={"observation"}>
                              <strong>{"관찰 및 다음 지도"}</strong>
                              <p>{o.observation}</p>
                            </div>
                          )}
                          <div className={"journal-actions"}>
                            <button
                              className={"text-button"}
                              onClick={() => openJournal(o.lessonId)}
                            >
                              <Pencil size={14} />
                              {" 수정하기"}
                            </button>
                            <button
                              className={"text-button danger"}
                              onClick={() => {
                                window.confirm(
                                  "이 일지를 삭제할까요? 완료 차시에서도 제외됩니다.",
                                ) &&
                                  setState((C) => ({
                                    ...C,
                                    journals: C.journals.filter(
                                      (J) => J.lessonId !== o.lessonId,
                                    ),
                                  }));
                              }}
                            >
                              <Trash2 size={14} />
                              {" 삭제"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </div>
              ) : (
                <EmptyState
                  icon={NotebookPen}
                  title={"수업의 작은 순간을 남겨 주세요"}
                  text={
                    "지도계획에서 차시를 선택하면 지도 내용이 담긴 일지 초안을 불러와요."
                  }
                  action={
                    <button
                      className={"button primary"}
                      onClick={() => openJournal()}
                    >
                      {"첫 지도일지 작성"}
                    </button>
                  }
                />
              )}
            </section>
          )}
          {activePage === "calendar" && (
            <div className={"calendar-layout"}>
              <section className={"panel calendar-panel"}>
                <div className={"section-heading"}>
                  <h2>{monthLabel}</h2>
                  <div className={"month-controls"}>
                    <button
                      className={"icon-button"}
                      aria-label={"이전 달"}
                      onClick={() => shiftMonth(-1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      className={"text-button"}
                      onClick={() => setCalendarMonth(nextMonth())}
                    >
                      {"다음 달"}
                    </button>
                    <button
                      className={"icon-button"}
                      aria-label={"다음 달"}
                      onClick={() => shiftMonth(1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className={"calendar-legend"}>
                  <span>
                    <i className={"lavender-dot"} />
                    {"배치 가능"}
                  </span>
                  <span>
                    <i className={"green-dot"} />
                    {"확정 일정"}
                  </span>
                  <span>{"날짜 클릭으로 휴업일 제외"}</span>
                </div>
                {calendarGrid}
                <p className={"fine-print"}>
                  {
                    "공휴일·방학·학교 행사일은 직접 제외해 주세요. 확정된 일정은 아래 목록에서 취소할 수 있어요."
                  }
                </p>
              </section>
              <section className={"panel schedule-controls"}>
                <span className={"eyebrow"}>{"다음 수업 계획하기"}</span>
                <h2>{"언제 함께 배울까요?"}</h2>
                <label>
                  {"배치할 달"}
                  <input
                    type={"month"}
                    value={calendarMonth}
                    onChange={(o) => {
                      o.target.value && setCalendarMonth(o.target.value);
                    }}
                  />
                </label>
                <label>{"수업 요일"}</label>
                <div className={"day-picker"}>
                  {WEEKDAYS.map((o, _) => (
                    <button
                      key={o}
                      aria-pressed={selectedWeekdays.includes(_)}
                      className={selectedWeekdays.includes(_) ? "selected" : ""}
                      onClick={() =>
                        setSelectedWeekdays((C) =>
                          C.includes(_) ? C.filter((J) => J !== _) : [...C, _],
                        )
                      }
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <label>
                  {"수업 교시 "}
                  <small>{"여러 교시 선택 가능"}</small>
                </label>
                <div className={"period-picker"}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((o) => (
                    <button
                      key={o}
                      aria-pressed={selectedPeriods.includes(o)}
                      className={selectedPeriods.includes(o) ? "selected" : ""}
                      onClick={() =>
                        setSelectedPeriods((_) =>
                          _.includes(o) ? _.filter((C) => C !== o) : [..._, o],
                        )
                      }
                    >
                      {o}
                      {"교시"}
                    </button>
                  ))}
                </div>
                <div className={"capacity-box"}>
                  <span>
                    {"선택한 일정의 총 수업 자리"}
                    <strong>
                      {timeSlots.length}
                      <small>{"차시"}</small>
                    </strong>
                  </span>
                  <hr />
                  <span>
                    {"남은 목표 차시"}
                    <b>
                      {progress.remaining}
                      {"차시"}
                    </b>
                  </span>
                  <span>
                    {"이미 확정된 미이수 차시"}
                    <b>
                      {pendingBookings.length}
                      {"차시"}
                    </b>
                  </span>
                  <span className={"purple"}>
                    {"지금 새로 배치할 수 있어요"}
                    <b>
                      {proposedBookings.length}
                      {"차시"}
                    </b>
                  </span>
                </div>
                <button
                  className={"button primary full"}
                  disabled={!proposedBookings.length}
                  onClick={() => {
                    (setState((o) => ({
                      ...o,
                      bookings: [
                        ...o.bookings,
                        ...assignLessonsToSlots(o, timeSlots),
                      ],
                    })),
                      setToast(
                        `${proposedBookings.length}차시를 달력에 배치했어요.`,
                      ));
                  }}
                >
                  <Plus size={16} /> {proposedBookings.length}
                  {"차시 일정 확정"}
                </button>
                <p className={"fine-print"}>
                  {
                    "계획한 수업을 순서대로 배치해요. 이미 배치한 수업·지난 날짜·목표를 넘는 차시는 제외해요."
                  }
                </p>
                {!allLessons.length && (
                  <button className={"text-button"} onClick={openNewPlan}>
                    {"먼저 지도계획 만들기 "}
                    <ArrowRight size={14} />
                  </button>
                )}
              </section>
              <section className={"panel booking-panel"}>
                <div className={"section-heading"}>
                  <h2>
                    {monthNumber}
                    {"월 확정 일정"}
                  </h2>
                  <span className={"count-label"}>
                    {
                      state.bookings.filter((o) =>
                        o.date.startsWith(calendarMonth),
                      ).length
                    }
                    {"차시"}
                  </span>
                </div>
                {state.bookings.some((o) =>
                  o.date.startsWith(calendarMonth),
                ) ? (
                  <div className={"booking-list"}>
                    {state.bookings
                      .filter((o) => o.date.startsWith(calendarMonth))
                      .sort(
                        (o, _) =>
                          o.date.localeCompare(_.date) || o.period - _.period,
                      )
                      .map((o) => {
                        const _ = allLessons.find((J) => J.id === o.lessonId),
                          C = state.journals.some(
                            (J) => J.lessonId === o.lessonId && J.done,
                          );
                        return (
                          <div key={o.lessonId} className={"booking-row"}>
                            <span className={"booking-date"}>
                              {Number(o.date.slice(-2))}
                              <small>
                                {
                                  WEEKDAYS[
                                    new Date(`${o.date}T12:00:00`).getDay()
                                  ]
                                }
                                {"요일"}
                              </small>
                            </span>
                            <span className={"pill lavender"}>
                              {o.period}
                              {"교시"}
                            </span>
                            <span className={"booking-title"}>
                              <strong>{_ == null ? void 0 : _.title}</strong>
                              <small>
                                {_ == null ? void 0 : _.plan.unit}
                                {" · "}
                                {((_ == null ? void 0 : _.index) ?? 0) + 1}
                                {"차시"}
                              </small>
                            </span>
                            <button
                              className={"text-button"}
                              onClick={() => openJournal(o.lessonId)}
                            >
                              {C ? "일지 보기" : "일지 작성"}
                              <ArrowRight size={14} />
                            </button>
                            <button
                              className={"icon-button"}
                              aria-label={`${o.date} ${o.period}교시 일정 취소`}
                              onClick={() => {
                                window.confirm(
                                  "이 일정 배치를 취소할까요? 지도계획과 일지는 유지됩니다.",
                                ) &&
                                  setState((J) => ({
                                    ...J,
                                    bookings: J.bookings.filter(
                                      (dl) => dl.lessonId !== o.lessonId,
                                    ),
                                  }));
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title={"아직 확정된 일정이 없어요"}
                    text={"요일과 교시를 선택하고 ‘일정 확정’을 눌러 주세요."}
                  />
                )}
              </section>
            </div>
          )}
          <footer>
            <span className={"footer-brand"}>
              <Sprout size={15} />
              {" 차곡"}
            </span>
            <span>{"아이의 배움과 선생님의 시간을 소중하게."}</span>
            <button onClick={() => setHelpOpen(true)}>{"이용 안내"}</button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className={"toast"} role={"status"}>
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
      {planModalOpen && (
        <Modal
          title={
            editingPlanId
              ? "저장한 지도계획 수정"
              : draftLessons.length
                ? "차시별 지도계획 확인"
                : "새 지도계획 만들기"
          }
          wide={true}
          close={() => setPlanModalOpen(false)}
        >
          {draftLessons.length ? (
            <React.Fragment>
              <div className={"preview-summary"}>
                <span className={"pill lavender"}>
                  {planQuery}
                  {" · "}
                  {semester}
                  {"학기"}
                  {planPublisher && ` · ${planPublisher}`}
                </span>
                <h3>
                  {unitName}{" "}
                  <small>
                    {draftLessons.length}
                    {"차시"}
                  </small>
                </h3>
                <p>
                  {"수업 전에 목표·활동·확인 방법을 검토하고 수정해 주세요."}
                </p>
              </div>
              {draftLessons.map((o, _) => (
                <div key={o.id} className={"lesson-editor"}>
                  {o.sourceLabel && (
                    <p className="fine-print">원문: {o.sourceLabel}</p>
                  )}
                  <span className={"lesson-number"}>
                    {_ + 1}
                    {"차시"}
                  </span>
                  <label>
                    {"학습 목표"}
                    <input
                      value={o.title}
                      onChange={(C) =>
                        setDraftLessons((J) =>
                          J.map((dl) =>
                            dl.id === o.id
                              ? {
                                  ...dl,
                                  title: C.target.value,
                                }
                              : dl,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {"지도 내용"}
                    <textarea
                      rows={4}
                      value={o.activity}
                      onChange={(C) =>
                        setDraftLessons((J) =>
                          J.map((dl) =>
                            dl.id === o.id
                              ? {
                                  ...dl,
                                  activity: C.target.value,
                                }
                              : dl,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    {"확인 방법"}
                    <textarea
                      rows={2}
                      value={o.check}
                      onChange={(C) =>
                        setDraftLessons((J) =>
                          J.map((dl) =>
                            dl.id === o.id
                              ? {
                                  ...dl,
                                  check: C.target.value,
                                }
                              : dl,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              ))}
              <div className={"modal-actions sticky"}>
                <button
                  className={"button outline"}
                  onClick={() =>
                    editingPlanId
                      ? setPlanModalOpen(false)
                      : setDraftLessons([])
                  }
                >
                  {editingPlanId ? "취소" : "이전"}
                </button>
                <button
                  className={"button primary"}
                  disabled={draftLessons.some(
                    (o) => !o.title.trim() || !o.activity.trim(),
                  )}
                  onClick={savePlan}
                >
                  <Check size={16} />
                  {" 지도계획 저장"}
                </button>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <p className={"modal-intro"}>
                {
                  "차시표 이미지·PDF를 올리거나 지도할 내용을 직접 입력해 주세요."
                }
              </p>
              <div
                className={"plan-mode-tabs"}
                role={"tablist"}
                aria-label={"지도계획 입력 방식"}
              >
                {[
                  { id: "upload", label: "파일로 만들기" },
                  {
                    id: "manual",
                    label: "직접 입력",
                  },
                ].map((o) => (
                  <button
                    key={o.id}
                    id={`plan-tab-${o.id}`}
                    role={"tab"}
                    aria-selected={planMode === o.id}
                    aria-controls={"plan-input-panel"}
                    tabIndex={planMode === o.id ? 0 : -1}
                    onKeyDown={(_) => {
                      var C;
                      if (_.key === "ArrowLeft" || _.key === "ArrowRight") {
                        _.preventDefault();
                        const modes = ["upload", "manual"];
                        const J =
                          modes[
                            (modes.indexOf(o.id) +
                              (_.key === "ArrowRight" ? 1 : modes.length - 1)) %
                              modes.length
                          ];
                        (changePlanMode(J),
                          (C = document.getElementById(`plan-tab-${J}`)) ==
                            null || C.focus());
                      }
                    }}
                    onClick={() => changePlanMode(o.id)}
                  >
                    <Pencil size={16} /> {o.label}
                  </button>
                ))}
              </div>
              {planMode === "upload" ? (
                <div
                  id="plan-input-panel"
                  role="tabpanel"
                  aria-labelledby="plan-tab-upload"
                >
                  <LessonImport
                    initialDraft={uploadDraft}
                    onDraftChange={setUploadDraft}
                    onBuild={({ unit, query, semester, lessons }) => {
                      setUnitName(unit);
                      setPlanQuery(query);
                      setSemester(semester);
                      setFocusTopics(
                        lessons.map((lesson) => lesson.title).join(", "),
                      );
                      setDraftLessons(lessons);
                      setPlanError("");
                    }}
                  />
                </div>
              ) : (
                <>
                  <div
                    id={"plan-input-panel"}
                    role={"tabpanel"}
                    aria-labelledby={`plan-tab-${planMode}`}
                  >
                    <React.Fragment>
                      <label>
                        {"학년 · 과목 · 단원"}
                        <input
                          value={planQuery}
                          onChange={(o) => {
                            (setPlanQuery(o.target.value),
                              setFocusTopics(""),
                              setUnitName(""));
                          }}
                          placeholder={"예: 3학년 수학 3단원"}
                        />
                      </label>
                      <label>
                        {"학기"}
                        <select
                          aria-label={"학기"}
                          value={semester}
                          onChange={(o) =>
                            changeSemester(Number(o.target.value))
                          }
                        >
                          <option value={1}>{"1학기"}</option>
                          <option value={2}>{"2학기"}</option>
                        </select>
                      </label>
                    </React.Fragment>
                    <label>
                      {"지도 차시"}
                      <input
                        type={"number"}
                        min={1}
                        max={30}
                        value={lessonCount}
                        onChange={(o) => setLessonCount(Number(o.target.value))}
                      />
                    </label>
                    {exampleUnit ? (
                      <div className={"unit-match"}>
                        <CircleCheck size={20} />
                        <div>
                          <strong>
                            {semester}
                            {"학기 · "}
                            {exampleUnit.unit}
                          </strong>
                          <p>{exampleUnit.topics.join(" · ")}</p>
                          <small>
                            {planMode === "select" &&
                            (selectedUnit == null
                              ? void 0
                              : selectedUnit.source) === "saved"
                              ? "선생님이 같은 교과서 조건으로 저장한 단원입니다."
                              : "출판사별로 확인된 목차가 아닌 기본 예시입니다. 교과서와 일치하는지 확인해 주세요."}
                          </small>
                        </div>
                      </div>
                    ) : planMode === "manual" ||
                      textbook.unitId === "custom" ? (
                      <label>
                        {"교과서 단원명"}
                        <input
                          value={unitName}
                          onChange={(o) => setUnitName(o.target.value)}
                          placeholder={"예: 문장의 짜임"}
                        />
                      </label>
                    ) : null}
                    {(exampleUnit ||
                      planMode === "manual" ||
                      textbook.unitId === "custom") && (
                      <label>
                        {"핵심 학습 내용"}{" "}
                        {exampleUnit && (
                          <small>
                            {"선택 · 입력하면 기본 내용을 대신 사용해요"}
                          </small>
                        )}
                        <textarea
                          rows={3}
                          value={focusTopics}
                          onChange={(o) => setFocusTopics(o.target.value)}
                          placeholder={
                            exampleUnit
                              ? "추가로 집중할 내용을 쉼표로 구분해 주세요."
                              : "교과서의 핵심 내용을 쉼표로 구분해 주세요. 예: 주어 찾기, 서술어 찾기, 문장 완성하기"
                          }
                        />
                      </label>
                    )}
                  </div>
                  <p className={"fine-print"}>
                    {
                      "교사 검토용 기본 계획을 구성합니다. 교과서 원문 조회나 AI 생성 결과가 아닙니다."
                    }
                  </p>
                  {planError && (
                    <p className={"form-error"} role={"alert"}>
                      {planError}
                    </p>
                  )}
                  <div className={"modal-actions"}>
                    <button
                      className={"button outline"}
                      onClick={() => setPlanModalOpen(false)}
                    >
                      {"취소"}
                    </button>
                    <button
                      className={"button primary"}
                      onClick={buildLessonDraft}
                    >
                      <Sparkles size={16} />
                      {" 계획 구성하기"}
                    </button>
                  </div>
                </>
              )}
            </React.Fragment>
          )}
        </Modal>
      )}
      {selectedPlan && (
        <Modal
          title={`${selectedPlan.unit} 지도계획`}
          wide={true}
          close={() => setSelectedPlanId(null)}
        >
          <div className={"preview-summary"}>
            <span className={"pill lavender"}>
              {selectedPlan.query}
              {" · "}
              {selectedPlan.semester}
              {"학기"}
              {selectedPlan.textbook && ` · ${selectedPlan.textbook.publisher}`}
            </span>
            <p>
              {selectedPlan.lessons.length}
              {"차시 · "}
              {selectedPlan.created}
              {" 작성"}
            </p>
          </div>
          {selectedPlan.lessons.map((o, _) => (
            <article key={o.id} className={"lesson-detail"}>
              <div className={"section-heading"}>
                <h3>
                  <span className={"lesson-number"}>
                    {_ + 1}
                    {"차시"}
                  </span>
                  {o.title}
                </h3>
                <button
                  className={"button outline small"}
                  onClick={() => {
                    (setSelectedPlanId(null), openJournal(o.id));
                  }}
                >
                  <NotebookPen size={14} />
                  {" 일지 작성"}
                </button>
              </div>
              {o.sourceLabel && (
                <small className="fine-print">원문: {o.sourceLabel}</small>
              )}
              <p>{o.activity}</p>
              <div className={"assessment"}>
                <CircleCheck size={16} />
                {o.check}
              </div>
            </article>
          ))}
          <div className={"modal-actions"}>
            <button
              className={"text-button danger"}
              onClick={() => deletePlan(selectedPlan)}
            >
              <Trash2 size={15} />
              {" 계획 삭제"}
            </button>
            <button
              className={"button outline"}
              onClick={() => editPlan(selectedPlan)}
            >
              <Pencil size={15} />
              {" 계획 수정"}
            </button>
            <button
              className={"button primary"}
              onClick={() => {
                (setSelectedPlanId(null), setActivePage("calendar"));
              }}
            >
              {"수업 일정 배치 "}
              <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {journalLessonId && selectedLesson && (
        <Modal
          title={"지도일지 작성"}
          wide={true}
          close={() => setJournalLessonId("")}
        >
          <p className={"modal-intro"}>
            {"계획에서 가져온 초안을 실제 수업 내용에 맞게 수정해 주세요."}
          </p>
          <label>
            {"지도 차시"}
            <select
              value={journalLessonId}
              onChange={(o) => openJournal(o.target.value)}
            >
              {allLessons.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.plan.query}
                  {" · "}
                  {o.plan.unit}
                  {" · "}
                  {o.index + 1}
                  {"차시 "}
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {"수업일"}
            <input
              type={"date"}
              value={journalDate}
              onChange={(o) => setJournalDate(o.target.value)}
            />
          </label>
          <div className={"assessment"}>
            <CircleCheck size={16} />
            {selectedLesson.check}
          </div>
          <label>
            {"실제 지도 내용"}
            <textarea
              rows={7}
              value={journalContent}
              onChange={(o) => setJournalContent(o.target.value)}
            />
          </label>
          <label>
            {"학생 반응 · 관찰 · 다음 지도"}
            <textarea
              rows={4}
              value={journalObservation}
              onChange={(o) => setJournalObservation(o.target.value)}
              placeholder={
                "어떤 도움으로 문제를 해결했나요? 다음 수업에서 보완할 내용을 기록해 주세요."
              }
            />
          </label>
          <label className={"checkbox-label"}>
            <input
              type={"checkbox"}
              checked={journalDone}
              onChange={(o) => setJournalDone(o.target.checked)}
            />
            <span>
              <strong>{"이 수업을 완료했어요"}</strong>
              <small>{"완료한 일지 한 건이 이수 1차시로 반영됩니다."}</small>
            </span>
          </label>
          {journalError && (
            <p className={"form-error"} role={"alert"}>
              {journalError}
            </p>
          )}
          <div className={"modal-actions"}>
            <button
              className={"button outline"}
              onClick={() => setJournalLessonId("")}
            >
              {"취소"}
            </button>
            <button className={"button primary"} onClick={saveJournal}>
              <Check size={16} />
              {journalDone ? "완료 일지 저장" : "임시 저장"}
            </button>
          </div>
        </Modal>
      )}
      {targetModalOpen && (
        <Modal
          title={"우리 반 목표 설정"}
          close={() => setTargetModalOpen(false)}
        >
          <p className={"modal-intro"}>
            {"운영 계획에 맞게 총 지도 차시를 설정해 주세요."}
          </p>
          <label>
            {"전체 목표 차시"}
            <input
              type={"number"}
              min={Math.max(1, progress.done + pendingBookings.length)}
              max={500}
              value={targetInput}
              onChange={(o) => setTargetInput(Number(o.target.value))}
            />
          </label>
          <p className={"fine-print"}>
            {"완료·예정 수업을 합한 "}
            {progress.done + pendingBookings.length}
            {"차시 이상, 최대 500차시까지 설정할 수 있어요."}
          </p>
          <div className={"modal-actions"}>
            <button
              className={"button outline"}
              onClick={() => setTargetModalOpen(false)}
            >
              {"취소"}
            </button>
            <button
              className={"button primary"}
              disabled={
                !Number.isInteger(targetInput) ||
                targetInput <
                  Math.max(1, progress.done + pendingBookings.length) ||
                targetInput > 500
              }
              onClick={() => {
                (setState((o) => ({
                  ...o,
                  target: targetInput,
                })),
                  setTargetModalOpen(false),
                  setToast("목표 차시를 변경했어요."));
              }}
            >
              {"저장"}
            </button>
          </div>
        </Modal>
      )}
      {helpOpen && (
        <Modal title={"차곡 이용 안내"} close={() => setHelpOpen(false)}>
          <div className={"help-content"}>
            <p>
              <strong>{"1. 지도계획"}</strong>
              <br />
              {
                "새 지도계획에서 차시표 이미지나 PDF를 올리세요. 읽은 차시 번호·제목·순서를 확인하고 필요한 차시만 골라 계획을 만듭니다. 지도 내용이 없는 차시는 제목 기반 활동 초안이므로 검토해 주세요. 파일은 서버로 전송하지 않습니다. 파일 없이 직접 입력해서 만들 수도 있어요."
              }
            </p>
            <p>
              <strong>{"2. 지도일지와 진도"}</strong>
              <br />
              {
                "수업 후 실제 활동과 관찰 내용을 기록하세요. ‘완료’를 선택한 일지만 진도에 반영됩니다."
              }
            </p>
            <p>
              <strong>{"3. 수업 달력"}</strong>
              <br />
              {
                "월·요일·교시를 선택하고 휴업일을 제외하세요. 아직 배치하지 않은 계획을 남은 목표 차시 안에서 확정할 수 있어요."
              }
            </p>
            <p>
              <strong>{"기록 보관"}</strong>
              <br />
              {
                "현재 기기의 브라우저에 저장됩니다. 다른 기기와 동기화되지 않으며 브라우저 데이터 삭제 시 사라질 수 있어요. 지도일지는 CSV로 내려받을 수 있습니다."
              }
            </p>
            <button
              className={"button outline full"}
              onClick={() =>
                downloadFile(
                  `차곡_백업_${todayInSeoul()}.json`,
                  JSON.stringify(state, null, 2),
                )
              }
            >
              <Download size={16} />
              {" 전체 기록 JSON 백업"}
            </button>
            <div className={"restore-box"}>
              <label>
                {"백업 파일로 기록 복원"}
                <input
                  type={"file"}
                  accept={".json,application/json"}
                  onChange={(o) => {
                    var _;
                    (readBackupFile(
                      (_ = o.target.files) == null ? void 0 : _[0],
                    ),
                      (o.target.value = ""));
                  }}
                />
              </label>
              <p className={"fine-print"}>
                {
                  "파일을 확인한 뒤 복원할 수 있습니다. 복원 시 현재 기록 전체를 선택한 백업으로 바꿉니다."
                }
              </p>
              {backupError && (
                <p className={"form-error"} role={"alert"}>
                  {backupError}
                </p>
              )}
              {backupPreview && (
                <div className={"restore-confirm"}>
                  <strong>{"복원할 기록"}</strong>
                  <p>
                    {"목표 "}
                    {backupPreview.target}
                    {"차시 · 계획"} {backupPreview.plans.length}
                    {"개 · 일지"} {backupPreview.journals.length}
                    {"개 · 일정"} {backupPreview.bookings.length}
                    {"개"}
                  </p>
                  <button
                    className={"button primary full"}
                    onClick={() => {
                      window.confirm(
                        "현재 기록을 이 백업으로 교체할까요? 먼저 현재 기록을 JSON 백업으로 보관할 수 있습니다.",
                      ) &&
                        (setState(backupPreview),
                        setTargetInput(backupPreview.target),
                        setBackupPreview(null),
                        setBackupError(""),
                        setHelpOpen(false),
                        setSelectedPlanId(null),
                        setJournalLessonId(""),
                        setActivePage("dashboard"),
                        setToast("백업 기록을 복원했어요."));
                    }}
                  >
                    {"이 백업으로 현재 기록 교체"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default App;
