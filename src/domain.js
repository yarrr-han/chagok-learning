export const INITIAL_STATE = {
  version: 1,
  target: 20,
  plans: [],
  journals: [],
  bookings: [],
};
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export function formatLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function todayInSeoul() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}
export function nextMonth() {
  const [year, month] = todayInSeoul().split("-").map(Number);
  return `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}`;
}
export function generateTimeSlots(month, weekdays, periods, excludedDates) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || monthNumber < 1 || monthNumber > 12) return [];
  const slots = [];
  for (let q = 1; q <= new Date(year, monthNumber, 0).getDate(); q++) {
    const x = new Date(year, monthNumber - 1, q),
      p = formatLocalDate(x);
    weekdays.includes(x.getDay()) &&
      !excludedDates.includes(p) &&
      [...new Set(periods)]
        .sort((B, j) => B - j)
        .forEach((B) =>
          slots.push({
            date: p,
            period: B,
          }),
        );
  }
  return slots;
}
export const GRADE_THREE_MATH_UNITS = {
  1: [
    {
      unit: "덧셈과 뺄셈",
      topics: [
        "세 자리 수의 자릿값",
        "받아올림이 없는 덧셈",
        "받아올림이 있는 덧셈",
        "받아내림이 있는 뺄셈",
        "덧셈과 뺄셈의 관계",
        "생활 속 덧셈과 뺄셈",
      ],
    },
    {
      unit: "평면도형",
      topics: [
        "선분과 반직선, 직선",
        "각과 직각",
        "직각삼각형",
        "직사각형",
        "정사각형",
        "생활 속 평면도형",
      ],
    },
    {
      unit: "나눗셈",
      topics: [
        "똑같이 나누기",
        "같은 수씩 묶기",
        "나눗셈식으로 나타내기",
        "곱셈과 나눗셈의 관계",
        "곱셈구구로 몫 구하기",
        "생활 속 나눗셈 문제",
      ],
    },
    {
      unit: "곱셈",
      topics: [
        "묶음으로 곱셈 이해하기",
        "몇십 × 몇",
        "올림이 없는 두 자리 수 × 한 자리 수",
        "십의 자리로 올림이 있는 곱셈",
        "백의 자리로 올림이 있는 곱셈",
        "생활 속 곱셈 문제",
      ],
    },
    {
      unit: "길이와 시간",
      topics: [
        "1 mm 알아보기",
        "cm와 mm의 관계",
        "1 km 알아보기",
        "길이의 합과 차",
        "1초와 시간 읽기",
        "시간의 합과 차",
      ],
    },
    {
      unit: "분수와 소수",
      topics: [
        "전체를 똑같이 나누기",
        "분수 알아보기",
        "분모와 분자",
        "단위분수의 크기 비교",
        "소수 알아보기",
        "소수의 크기 비교",
      ],
    },
  ],
  2: [
    {
      unit: "곱셈",
      topics: [
        "곱셈구구 확인",
        "세 자리 수 × 한 자리 수",
        "올림이 있는 곱셈",
        "몇십 × 몇십",
        "두 자리 수 × 두 자리 수",
        "생활 속 곱셈 문제",
      ],
    },
    {
      unit: "나눗셈",
      topics: [
        "곱셈구구로 몫 구하기",
        "두 자리 수 ÷ 한 자리 수",
        "나머지가 있는 나눗셈",
        "세 자리 수 ÷ 한 자리 수",
        "나눗셈 검산하기",
        "생활 속 나눗셈 문제",
      ],
    },
    {
      unit: "원",
      topics: [
        "원의 모양 찾기",
        "원의 중심",
        "반지름 알아보기",
        "지름 알아보기",
        "반지름과 지름의 관계",
        "컴퍼스로 원 그리기",
      ],
    },
    {
      unit: "분수",
      topics: [
        "전체와 부분",
        "분수로 나타내기",
        "진분수와 가분수",
        "대분수 알아보기",
        "분수의 변환",
        "분모가 같은 분수의 크기 비교",
      ],
    },
    {
      unit: "들이와 무게",
      topics: [
        "들이 비교하기",
        "L와 mL",
        "들이의 합과 차",
        "무게 비교하기",
        "kg과 g",
        "무게의 합과 차",
      ],
    },
    {
      unit: "자료의 정리",
      topics: [
        "자료 분류하기",
        "표로 나타내기",
        "그림그래프 읽기",
        "그림그래프로 나타내기",
        "자료 비교하기",
        "자료에서 알 수 있는 점",
      ],
    },
  ],
};
export function findExampleUnit(query, semester) {
  var H;
  const gradeMatch = query.match(/([1-6])\s*학년/),
    unitMatch = query.match(/([1-9])\s*단원/);
  return (gradeMatch == null ? void 0 : gradeMatch[1]) === "3" &&
    query.includes("수학") &&
    unitMatch
    ? (H = GRADE_THREE_MATH_UNITS[semester]) == null
      ? void 0
      : H[Number(unitMatch[1]) - 1]
    : void 0;
}
// Short, editable lesson outlines. Persisted plans keep their original text.
export const TOPIC_OUTLINES = {
  "똑같이 나누기": { activities: ["구체물을 똑같이 나누기", "한 곳에 나누어 놓은 수 알아보기", "똑같이 나눈 결과 이야기하기"] },
  "같은 수씩 묶기": { activities: ["구체물을 같은 수씩 묶기", "묶음의 수 알아보기", "똑같이 나누기와 같은 수씩 묶기 비교하기"] },
  "나눗셈식으로 나타내기": { activities: ["그림에서 나누는 상황 알아보기", "나누는 상황을 나눗셈식으로 나타내기", "나눗셈식 읽고 각 수의 뜻 설명하기"] },
  "곱셈과 나눗셈의 관계": { activities: ["배열을 곱셈식으로 나타내기", "같은 배열을 나눗셈식으로 나타내기", "곱셈과 나눗셈 사이의 관계 이야기하기"] },
  "곱셈구구로 몫 구하기": { activities: ["나눗셈식과 관련된 곱셈구구 찾기", "곱셈구구를 이용하여 몫 구하기", "곱셈으로 나눗셈의 결과 확인하기"] },
  "생활 속 나눗셈 문제": { activities: ["생활 속에서 나눗셈이 필요한 상황 찾기", "상황에 맞는 나눗셈식을 세워 문제 해결하기", "나눗셈 문제의 해결 과정 설명하기"] },
  "원의 모양 찾기": { activities: ["생활 속에서 원 모양 찾기", "원과 다른 도형의 모양 비교하기", "원 모양의 특징 이야기하기"] },
  "원의 중심": { activities: ["종이 원을 접어 중심 찾기", "원의 중심 표시하기", "원의 중심에서 원 위의 점까지 거리 비교하기"] },
  "반지름 알아보기": { activities: ["원의 중심과 원 위의 점 연결하기", "원의 반지름 알아보기", "한 원에서 반지름의 길이 비교하기"] },
  "지름 알아보기": { activities: ["원의 중심을 지나는 선분 그리기", "원의 지름 알아보기", "한 원에서 지름의 길이 비교하기"] },
  "반지름과 지름의 관계": {
    title: "원의 성질 알아보기",
    activities: ["원의 반지름과 지름 알아보기", "원의 반지름과 지름 사이의 관계 알아보기", "원의 성질 이야기하기"],
  },
  "컴퍼스로 원 그리기": { activities: ["컴퍼스의 사용 방법 알아보기", "반지름의 길이를 정하여 원 그리기", "그린 원의 중심과 반지름 표시하기"] },
};

function learningGoal(topic) {
  return /(?:하기|보기|찾기|읽기|쓰기|나누기|묶기|그리기|구하기|나타내기|비교)$/.test(topic)
    ? topic
    : `${topic} 알아보기`;
}

export function generateLessons(unit, topics, count) {
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * topics.length) / count);
    const end = Math.max(start + 1, Math.floor(((index + 1) * topics.length) / count));
    const lessonTopics = topics.slice(start, end);
    if (!lessonTopics.length) lessonTopics.push(unit);

    const outlines = lessonTopics.map((topic) => {
      const outline = TOPIC_OUTLINES[topic];
      return {
        title: outline?.title || learningGoal(topic),
        activities: outline?.activities || [
          learningGoal(topic),
          "관련 예시와 문제 해결하기",
          "배운 내용 정리하고 설명하기",
        ],
      };
    });
    const title = outlines.map((outline) => outline.title).join(" · ");
    const repeated = index > 0 && Math.floor(((index - 1) * topics.length) / count) === start;
    const activities = [...new Set(outlines.flatMap((outline) => outline.activities))];
    return {
      id: crypto.randomUUID(),
      title: title + (repeated ? " (반복 연습)" : ""),
      activity: activities.map((activity) => `- ${activity}`).join("\n"),
      check: "학습 내용을 이해하고 스스로 설명하거나 문제를 해결하는지 확인하기",
    };
  });
}
export function getProgress(state) {
  const lessonIds = new Set(
      state.plans.flatMap((r) => r.lessons.map((H) => H.id)),
    ),
    completedCount = new Set(
      state.journals
        .filter((r) => r.done && lessonIds.has(r.lessonId))
        .map((r) => r.lessonId),
    ).size;
  return {
    done: completedCount,
    remaining: Math.max(0, state.target - completedCount),
    percent: Math.min(100, Math.round((completedCount / state.target) * 100)),
  };
}
export function assignLessonsToSlots(state, slots) {
  const completedIds = new Set(
      state.journals.filter((q) => q.done).map((q) => q.lessonId),
    ),
    bookedIds = new Set(state.bookings.map((q) => q.lessonId)),
    availableLessons = state.plans
      .flatMap((q) => q.lessons)
      .filter((q) => !completedIds.has(q.id) && !bookedIds.has(q.id)),
    D = new Set(state.bookings.map((q) => `${q.date}/${q.period}`)),
    V = Math.max(
      0,
      getProgress(state).remaining -
        state.bookings.filter((q) => !completedIds.has(q.lessonId)).length,
    );
  return slots
    .filter((q) => !D.has(`${q.date}/${q.period}`) && q.date >= todayInSeoul())
    .slice(0, Math.min(availableLessons.length, V))
    .map((q, x) => ({
      ...q,
      lessonId: availableLessons[x].id,
    }));
}
export function parseBackup(text) {
  if (text.length > 5e6)
    throw new Error("백업 파일은 5 MB 이하만 사용할 수 있어요.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("올바른 JSON 백업 파일이 아니에요.");
  }
  const invalidBackup = () => {
      throw new Error(
        "차곡 백업 형식이나 기록 연결을 확인할 수 없어요. 기존 기록은 유지됩니다.",
      );
    },
    isText = (j) => typeof j == "string" && j.length <= 1e5,
    isNonemptyText = (j) => isText(j) && j.length > 0,
    isDate = (j) => {
      if (typeof j != "string" || !/^\d{4}-\d{2}-\d{2}$/.test(j)) return false;
      const X = new Date(j + "T12:00:00Z");
      return !Number.isNaN(X.getTime()) && X.toISOString().slice(0, 10) === j;
    };
  (!data ||
    data.version !== 1 ||
    !Number.isInteger(data.target) ||
    data.target < 1 ||
    data.target > 500 ||
    !Array.isArray(data.plans) ||
    !Array.isArray(data.journals) ||
    !Array.isArray(data.bookings) ||
    data.plans.length > 1e3) &&
    invalidBackup();
  const planIds = new Set(),
    lessonIds = new Set();
  for (const j of data.plans) {
    if (
      ((!j ||
        !isNonemptyText(j.id) ||
        planIds.has(j.id) ||
        !isText(j.query) ||
        ![1, 2].includes(j.semester) ||
        !isText(j.unit) ||
        !isText(j.focus) ||
        !isDate(j.created) ||
        !Array.isArray(j.lessons) ||
        j.lessons.length < 1 ||
        j.lessons.length > 30) &&
        invalidBackup(),
      j.textbook !== void 0)
    ) {
      const X = j.textbook;
      (!X ||
        !Number.isInteger(X.grade) ||
        X.grade < 1 ||
        X.grade > 6 ||
        !isNonemptyText(X.subject) ||
        !isNonemptyText(X.publisher) ||
        (X.unitNumber !== void 0 &&
          (!Number.isInteger(X.unitNumber) ||
            X.unitNumber < 1 ||
            X.unitNumber > 30))) &&
        invalidBackup();
    }
    planIds.add(j.id);
    for (const X of j.lessons)
      ((!X ||
        !isNonemptyText(X.id) ||
        lessonIds.has(X.id) ||
        !isText(X.title) ||
        !isText(X.activity) ||
        !isText(X.check)) &&
        invalidBackup(),
        lessonIds.add(X.id));
  }
  const journalIds = new Set(),
    bookedLessonIds = new Set(),
    slotIds = new Set();
  for (const j of data.journals)
    ((!j ||
      !lessonIds.has(j.lessonId) ||
      journalIds.has(j.lessonId) ||
      !isDate(j.date) ||
      !isText(j.content) ||
      !isText(j.observation) ||
      typeof j.done != "boolean" ||
      (j.done && j.date > todayInSeoul())) &&
      invalidBackup(),
      journalIds.add(j.lessonId));
  for (const j of data.bookings)
    ((!j ||
      !lessonIds.has(j.lessonId) ||
      bookedLessonIds.has(j.lessonId) ||
      !isDate(j.date) ||
      !Number.isInteger(j.period) ||
      j.period < 1 ||
      j.period > 8 ||
      slotIds.has(`${j.date}/${j.period}`)) &&
      invalidBackup(),
      bookedLessonIds.add(j.lessonId),
      slotIds.add(`${j.date}/${j.period}`));
  return {
    version: 1,
    target: data.target,
    plans: data.plans.map((j) => ({
      id: j.id,
      query: j.query,
      semester: j.semester,
      unit: j.unit,
      focus: j.focus,
      created: j.created,
      ...(j.textbook
        ? {
            textbook: {
              grade: j.textbook.grade,
              subject: j.textbook.subject,
              publisher: j.textbook.publisher,
              ...(j.textbook.unitNumber !== void 0
                ? {
                    unitNumber: j.textbook.unitNumber,
                  }
                : {}),
            },
          }
        : {}),
      lessons: j.lessons.map((X) => ({
        id: X.id,
        title: X.title,
        activity: X.activity,
        check: X.check,
      })),
    })),
    journals: data.journals.map((j) => ({
      lessonId: j.lessonId,
      date: j.date,
      content: j.content,
      observation: j.observation,
      done: j.done,
    })),
    bookings: data.bookings.map((j) => ({
      lessonId: j.lessonId,
      date: j.date,
      period: j.period,
    })),
  };
}
export function getUnitOptions(grade, semester, subject, publisher, plans) {
  var x;
  const savedUnits = [],
    seenUnits = new Set();
  for (const p of plans) {
    if (
      ((x = p.textbook) == null ? void 0 : x.grade) !== grade ||
      p.semester !== semester ||
      p.textbook.subject !== subject ||
      p.textbook.publisher !== publisher
    )
      continue;
    const B = `${p.textbook.unitNumber ?? ""}/${p.unit}`;
    seenUnits.has(B) ||
      (seenUnits.add(B),
      savedUnits.push({
        id: `saved:${p.id}`,
        unit: p.unit,
        topics: p.focus
          .split(/[,\n]/)
          .map((j) => j.trim())
          .filter(Boolean),
        number: p.textbook.unitNumber,
        source: "saved",
      }));
  }
  const examples =
    grade === 3 && subject === "수학"
      ? (GRADE_THREE_MATH_UNITS[semester] || []).map((p, B) => ({
          ...p,
          id: `example:${semester}:${B + 1}`,
          number: B + 1,
          source: "example",
        }))
      : [];
  return [...savedUnits, ...examples];
}
export const INITIAL_TEXTBOOK = {
  grade: 3,
  subject: "수학",
  publisher: "",
  otherPublisher: "",
  unitId: "",
  unitNumber: 1,
};
export const getPublisher = (m) =>
  m.publisher === "other" ? m.otherPublisher.trim() : m.publisher;
export const PUBLISHERS = [
  "국정 교과서",
  "천재교육",
  "천재교과서",
  "비상교육",
  "동아출판",
  "미래엔",
  "아이스크림미디어",
  "금성출판사",
  "지학사",
  "대교",
];
export const STORAGE_KEY = "chagok-learning-v1";
export function loadState() {
  try {
    const m = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      (m == null ? void 0 : m.version) === 1 &&
      Number.isInteger(m.target) &&
      m.target > 0 &&
      Array.isArray(m.plans) &&
      Array.isArray(m.journals) &&
      Array.isArray(m.bookings)
    )
      return m;
  } catch {}
  return structuredClone(INITIAL_STATE);
}
export function downloadFile(filename, content, mimeType = "application/json") {
  const url = URL.createObjectURL(
      new Blob([content], {
        type: mimeType,
      }),
    ),
    link = document.createElement("a");
  ((link.href = url),
    (link.download = filename),
    link.click(),
    setTimeout(() => URL.revokeObjectURL(url), 1e3));
}
