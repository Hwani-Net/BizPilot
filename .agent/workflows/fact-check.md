---
description: 작업 전 팩트체크 및 기술 검증 절차
---

## 팩트체크 프로토콜 (Anti-Idiot Protocol)

코드 작성 전 반드시 아래를 확인한다.

### 원칙
1. **File Over History**: 대화 기록보다 PROJECT_BRIEF.md의 팩트를 우선 신뢰하라.
2. **2024년 이후 정보**: 라이브러리 버전, API 스펙은 반드시 웹 검색으로 검증하라.
3. **No Hallucination**: 모델명, SDK명, rate limit 수치를 추측하지 마라. 모르면 검색하라.

### 반드시 검증해야 할 항목
- [ ] 사용하려는 npm 패키지가 최신 버전인가?
- [ ] API 모델 ID가 현재 유효한가? (폐기/종료 여부)
- [ ] rate limit 수치가 실제 문서 기반인가?
- [ ] 폐기된 SDK를 사용하고 있지 않은가?

### 금지 목록 (2026-02-14 확인)
```
❌ google-generativeai (2025-11-30 폐기) → ✅ google-genai
❌ gemini-2.0-flash (2026-03-31 종료)    → ✅ gemini-2.5-flash 이상
❌ claude-sonnet-4-20250514 (구버전)     → ✅ claude-sonnet-4-6
❌ claude-sonnet-4-5-20250929 (종료됨)  → ✅ claude-sonnet-4-6
```
