---
description: 5인 에이전트 협업 시스템을 통한 고품질 작업 절차 (Ultra Quality)
---

# 🖐️ The Pentagonal Agent Workflow

복잡한 기능 구현, 난제 해결, 또는 고품질 디자인이 요구될 때 이 워크플로우를 따라 5인 페르소나를 체계적으로 가동하라.

## 1. 🧑‍💼 PM (Project Manager): 정의 및 기획
- **목표**: "어떤 문제를 해결해야 하는가?"
- **액션**: 
  - 사용자 요구사항의 모호함을 제거하고 명확한 인수 조건(Acceptance Criteria) 정의.
  - 작업 우선순위 결정.

## 2. 🏗️ Architect (설계): 구조 및 전략
- **목표**: "어떻게 구조적으로 해결할 것인가?"
- **액션**:
  - `docs/architecture.md` (필요 시) 작성하여 데이터 흐름과 컴포넌트 구조 시각화.
  - 기존 `Nano 뇽죵이` 아키텍처(Council, Multi-LLM 등)와의 통합성 검증.
  - 사용할 기술 스택과 라이브러리 선정 (안전성 중심).

## 3. 🎨 Designer (UI/UX): 비주얼 구현 [Codex CLI 전담]
- **목표**: "얼마나 아름답고 편리한가? (WOW Factor)"
- **액션**:
  - **작업 전**: `browser_subagent`로 현재 상태 스크린샷 캡처.
  - **작업 수행**: 터미널에서 `codex "프롬프트"` 실행. (직접 코딩 지양)
    - *프롬프트 예시*: "Make it modern with glassmorphism, use 'Inter' font, and add micro-animations."
  - **검증**: 작업 후 다시 스크린샷 캡처하여 **시각적 품질(심미성)** 자가 평가.

## 4. 👨‍💻 Developer (구현): 로직 및 기능
- **목표**: "실제로 작동하게 만든다."
- **액션**:
  - `src/` 디렉토리에 TypeScript 코드 구현.
  - **방어적 코딩**: `try-catch` 필수, 명확한 에러 로깅.
  - **테스트**: 유닛 테스트 작성 및 `npm run test` 실행.

## 5. 🕵️ Reviewer (검수): 품질 보증
- **목표**: "완벽한가? (90점 이상)"
- **액션**:
  - **정적 분석**: `npm run lint`, `npm run build`.
  - **동적 분석**: 실제 실행 후 로그(`app.log`) 확인.
  - **회고**: 발견된 문제점이나 패턴을 `lessons-learned.md` 및 글로벌 교훈 파일에 기록.
  - **기준 미달 시**: PM에게 반려하고 재작업 요청 (Self-Correction Loop).

---

## 📌 실행 가이드
이 워크플로우는 자동화 스크립트가 아니라 **안티그래비티의 사고(Thinking) 프로세스 가이드**이다.
복잡한 작업을 시작하기 전, 이 5단계를 마음속으로(또는 scratchpad에) 시뮬레이션하고 작업을 시작하라.
