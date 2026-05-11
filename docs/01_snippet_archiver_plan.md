# Snippet Archiver 구현 계획서

## 1. 개요 (Objective)
본 계획은 단발성으로 생성되는 코드, 스크립트, 웹앱 등을 영구적으로 아카이빙하고 메타데이터 기반으로 검색하여 즉시 실행할 수 있는 **Snippet Archiver**의 구현을 목적으로 합니다. 
사용자 요구사항에 따라 **Electron 기반 데스크톱 애플리케이션**으로 개발되며, 저장소는 버전 관리가 용이한 **JSON + File System** 구조를 채택합니다.

## 2. 아키텍처 및 기술 스택 (Architecture & Tech Stack)
- **App Platform**: Electron (Node.js 기반 메인 프로세스 + Renderer 프로세스)
- **Frontend**: React + TypeScript (UI의 상태 관리 및 컴포넌트화)
- **Storage**: JSON 메타데이터 및 로컬 파일 시스템
  - 저장 구조 예시:
    ```
    /archive/
      ├── snippet_001/
      │   ├── meta.json (제목, 태그, 실행 명령어, 파라미터 정보 등)
      │   └── main.py (실제 코드)
    ```
- **Testing & Debugging**: Jest, Playwright (Headless 모드 테스트)
- **Observability**: OpenTelemetry, Pino/Winston (구조화된 로깅)

## 3. 핵심 기능 구현 방안 (Key Features)
1. **메타데이터 인덱싱 및 검색**
   - 앱 실행 시 `/archive/` 디렉토리 내의 모든 `meta.json`을 읽어 메모리에 캐싱.
   - 키워드, 태그 기반의 실시간 검색 기능 제공.
2. **매개변수 치환 (Parameter Injection)**
   - 코드 실행 전, 사용자 UI에서 입력받은 값을 기반으로 코드 내 지정된 변수 템플릿(예: `{setting 1}`)을 치환.
   - 원본 파일은 유지하고, 임시 파일(temp)을 생성하여 치환된 코드를 저장 후 실행.
3. **즉시 실행 엔진 (Execution Engine)**
   - **Python / CMD**: Node.js의 `child_process.spawn` 또는 `exec`를 활용하여 로컬 프로세스로 실행. 실행 결과(stdout/stderr)를 UI에 스트리밍.
   - **HTML 웹앱**: Electron의 새로운 `BrowserWindow` 객체를 생성하여 독립된 창에서 즉시 렌더링.

## 4. 디버깅 및 관측성 (Debugging & Observability)
1. **로깅 시스템 (Logging System)**
   - Pino 또는 Winston을 활용한 JSON 기반의 구조화된 로깅 시스템 구축.
   - 앱 크래시, 실행 엔진 에러, 파일 IO 오류 등을 전용 로그 파일(`app.log`)에 지속적으로 기록.
2. **OpenTelemetry 통합**
   - 메인 프로세스와 렌더러 프로세스 간의 IPC 통신, 스니펫 실행 지연 시간, 파일 시스템 스캔 등의 병목 구간을 추적(Tracing)하기 위한 OpenTelemetry 계측(Instrumentation) 적용.
3. **디버깅을 위한 헤드리스 모드 (Headless Mode)**
   - CI/CD 및 자동화된 E2E 디버깅을 위해 UI를 띄우지 않고 백그라운드에서 스니펫 실행 및 결과 반환을 테스트할 수 있는 헤드리스 CLI 실행 모드 지원.

## 5. UI 설계 및 레이아웃 원칙 (UI Design Principles)
1. **상대값 기반 레이아웃 (Relative Unit Layout)**
   - `px` 기반의 절대값 배치를 지양하고, CSS Flexbox/Grid 및 `rem`, `%`, `vh/vw` 등 상대적 단위를 최우선으로 사용.
   - 윈도우 창 크기 조절 시 컨텐츠가 컨테이너 영역 바깥으로 빠져나가거나 겹치는 현상(Overflow/Escaping)을 원천 차단.
2. **디버깅 친화적 DOM ID 할당**
   - 화면에 렌더링되는 모든 주요 UI 컴포넌트는 디버깅 시 어떤 코드 블록인지 즉시 식별할 수 있도록 명시적이고 고유한 `id` 속성을 반드시 포함.
   - 예: `<input id="search-bar-input" />`, `<button id="btn-execute-snippet-001" />`, `<div id="panel-snippet-metadata-editor" />`

## 6. 단계별 구현 계획 (Implementation Phases)

### Phase 1: 기본 환경 구성 및 관측성 셋업
- Electron + React 프로젝트 스캐폴딩.
- Pino 로깅 시스템 및 OpenTelemetry 연동. Headless 디버그 모드 기초 설정.
- 파일 시스템 기반 CRUD 인터페이스 작성.

### Phase 2: 매개변수 치환 및 실행 엔진 구현
- 정규식 기반 매개변수 치환 로직 작성.
- 로컬 프로세스(CMD, Python) 및 새 브라우저 창(HTML) 실행 로직 작성 (실행 소요 시간 OpenTelemetry Tracing 포함).

### Phase 3: 사용자 인터페이스(UI) 개발
- 상대값 기반의 반응형 레이아웃 구축. 모든 컴포넌트에 명시적 ID 부여.
- IPC 연동을 통해 스니펫 목록 조회, 검색, 파라미터 입력 및 실행 UI 구현.

## 7. 작업 원칙 (Core Principles)
- **TDD 기반 외과적 접근**: 각 단계는 테스트 케이스를 먼저 작성하여(Fail) 목표를 명확히 한 후, 최소한의 코드로 구현(Pass)합니다.
- **테스트 영구 보존**: 기존 스니펫 포맷 처리 및 실행 기능에 영향을 주지 않음을 보장하기 위해 작성된 테스트는 지속적인 회귀 테스트에 활용됩니다.
- **단순함(Simplicity)**: 초기 구현 시 불필요하게 복잡한 디자인 패턴을 지양하고 직관적인 파일/폴더 제어 방식으로 구현합니다.
