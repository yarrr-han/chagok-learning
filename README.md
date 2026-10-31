# 차곡 — 기초학력 지도 도우미

초등학교 지도계획, 지도일지, 수업 일정을 관리하는 React 웹앱입니다.
기존 배포본에서 앱 로직을 분리해 **수정·빌드 가능한 소스 프로젝트로 재구성**했습니다.
삭제된 개발 환경의 원본 파일·주석·타입을 그대로 복구한 것은 아닙니다.

## 개발하기

Node.js 24를 사용합니다. 검증 버전은 `.node-version`에 기록되어 있습니다.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. `base: './'` 설정으로 GitHub Pages의
`/chagok-learning/` 경로에서도 사용할 수 있습니다. `dist/`는 생성물이므로 Git에 넣지 않습니다.

## 수정할 파일

- `src/App.jsx`: 대시보드, 지도계획, 지도일지, 달력 화면과 상태 관리
- `src/components/TextbookPicker.jsx`: 학년·학기·과목·출판사·단원 선택
- `src/components/Modal.jsx`, `EmptyState.jsx`: 공통 화면 요소
- `src/domain.js`: 단원 예시, 차시 생성, 일정 배치, 진행률, 백업 검증, 저장 처리
- `src/styles.css`: 기존 배포 CSS를 읽기 쉽게 정리한 스타일. 새 스타일도 여기서 수정할 수 있습니다.
- `src/index.html`, `src/main.jsx`: Vite 및 React 시작점
- 루트 `index.html`, `assets/`: GitHub Pages 배포 결과 (`npm run build:pages`로 갱신)
- `tests/domain.test.js`: 데이터 형식·일정·백업 등 핵심 로직 회귀 테스트
- `tests/browser_smoke.py`: 브라우저에서 실제 사용자 흐름 검증

기존 CSS에는 생성된 유틸리티 규칙이 포함되어 있습니다. 원래 Tailwind 설정이나 디자인 도구 원본은
남아 있지 않아 추정하여 만들지 않았습니다. 일부 내부 변수에는 축약된 이름이 남아 있습니다.

## 기존 데이터

기존 `localStorage` 키 `chagok-learning-v1`과 데이터 버전 1, JSON 백업 형식을 유지합니다.
같은 사이트 주소에서 배포본을 교체하면 기존 기록을 계속 읽습니다. 로컬 개발 서버는 사이트 주소가
다르므로 브라우저 저장 공간도 별개입니다. 실제 사이트의 **이용 안내 → 전체 기록 JSON 백업**으로
내려받은 파일을 로컬 앱에서 복원할 수 있습니다.

서버나 API 키는 필요하지 않습니다. Google Fonts는 외부 네트워크가 허용된 경우 로드되며,
차단되어도 시스템 글꼴로 동작합니다. 교과서 단원 예시는 기존 구현 그대로이며 AI 생성이나
출판사별 교과서 원문 조회 기능은 아닙니다.

## 브라우저 검증

선택 사항인 브라우저 테스트에는 Python과 Playwright, Chromium이 필요합니다.
이 클라우드 환경에는 이미 설치되어 있습니다. 다른 환경에서는 먼저 다음을 실행합니다.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r tests/requirements.txt
python -m playwright install chromium
```

`npm run build` 후 별도 터미널에서 `npm run preview -- --port 4173`을 실행하고:

```sh
python3 tests/browser_smoke.py
```

시스템 Chromium(`/usr/bin/chromium`) 또는 Playwright가 설치한 Chromium을 자동으로 사용합니다.
다른 실행 파일은 `--chromium /실제/실행파일/경로`로 지정할 수 있습니다.
테스트는 임시 브라우저 컨텍스트에서 실행하며 실제 사용자의 기록은 수정하지 않습니다.
`--baseline URL`을 지정하면 보존된 기존 배포본과 데스크톱·모바일 화면 및 저장 데이터 호환성도 비교합니다.

## 배포

기존 `main` 브랜치 루트에 배포 파일을 두는 방식을 유지합니다. 소스는 `src/`에 함께 보관합니다.

```sh
npm ci
npm test
npm run build:pages
```

`build:pages`는 `dist/`를 빌드한 뒤 루트 `index.html`, `assets/`, `.nojekyll`을 갱신합니다.
소스와 갱신된 배포 파일을 함께 커밋하여 `main`에 push합니다.
GitHub Pages가 `main`의 `/ (root)`를 게시하도록 설정되어 있으면 변경 사항을 자동 게시합니다.
루트의 배포 HTML을 직접 수정하지 말고 `src/index.html`을 수정한 후 다시 빌드하세요.
이전 파일을 캐시한 방문자를 위해 기존 해시 이름의 자산은 삭제하지 않습니다.

`.github/workflows/pages.yml`은 선택적인 **수동 GitHub Actions 배포**용입니다.
사용하려면 Pages Source를 GitHub Actions로 바꾼 뒤 해당 워크플로를 수동 실행합니다.
현재 브랜치 배포 방식에서는 이 변경이 필요하지 않습니다.

배포 전에 실제 사용 기록을 JSON으로 백업해 두세요.
재구성 근거와 검증 범위는 [docs/reconstruction.md](docs/reconstruction.md)에 기록했습니다.

## 차시표 이미지·PDF로 계획 만들기

**새 지도계획 → 파일로 만들기**에서 PNG/JPG/WEBP 캡처 또는 PDF를 선택합니다.
PDF는 파일의 쪽 순서 기준으로 시작·끝 쪽을 지정해 한 번에 최대 10쪽을 읽습니다(파일당 최대 20 MB).
텍스트 PDF는 PDF.js로 읽고, 이미지 및 스캔 PDF는 Tesseract의 한글·영문 OCR로 읽습니다.
PDF의 글자가 일부 누락되면 ‘PDF를 이미지로 읽기’를 선택할 수 있습니다.

인식 결과에서 `1차시 제목`, `3~4차시 제목`, `1 | 제목`처럼 차시 번호가 있는 줄을
후보로 만듭니다. 복잡한 표·흐린 글씨는 정확하지 않을 수 있으므로 원문과 비교하고
번호·제목·순서를 수정한 뒤 필요한 차시(최대 30개)를 선택합니다.
직접 붙여넣기, 차시 추가·삭제, 순서 변경도 가능합니다.
차시 범위를 하나의 계획 항목으로 유지하며 임의로 차시를 분할하거나 반복하지 않습니다.

자료에서 읽은 활동 또는 교사가 입력한 활동은 그대로 사용합니다. 활동이 없으면
검토한 차시 제목을 바탕으로 기존 규칙에 따른 활동 초안을 만듭니다.
이는 교과서 원문의 자동 조회나 생성형 AI 해석이 아니므로 저장 전에 검토해야 합니다.
원문 차시 번호와 PDF 쪽 번호는 계획과 JSON 백업에 보존됩니다.

원본 파일은 서버로 전송하거나 localStorage에 저장하지 않습니다.
완성한 계획만 기존 브라우저 저장 공간에 보관합니다. OCR/PDF 도구와 한글 인식 데이터도
이 사이트에서 내려받으며, 별도 API 키·서버·외부 OCR 서비스가 필요하지 않습니다.
처음 글자를 읽을 때 인식 도구 다운로드에 시간이 걸릴 수 있습니다.

`npm run dev`, `npm run build`는 `scripts/prepare-reader.mjs`로 인식 자원을 준비합니다.
`public/reader/`는 생성물이므로 Git에서 제외하고, `build:pages`가 게시용 `reader/`에 복사합니다.
한글 인식 데이터는 `@tesseract.js-data/kor`, 영문은 `@tesseract.js-data/eng`,
PDF 리더는 `pdfjs-dist`, OCR 엔진은 `tesseract.js`와 `tesseract.js-core`를 사용합니다.
배포된 `reader/`에 라이선스 안내를 포함합니다.

브라우저에서 합성 한글 자료를 사용한 실제 OCR/PDF 통합 테스트:

```sh
python3 tests/import_browser.py --url http://127.0.0.1:4173/
```

이 테스트는 한글 이미지, 텍스트 PDF, 스캔 PDF, 강제 OCR, 모바일 너비,
검토·선택·순서 변경·저장, 잘못된 파일 및 취소 후 재시도를 검증합니다.
