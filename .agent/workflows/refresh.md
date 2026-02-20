---
description: 대화 중 컨텍스트가 꼬였을 때 핵심 규칙을 다시 로드하는 절차
---

# /refresh — 컨텍스트 리프레시

대화가 길어져서 초기 규칙을 잊었거나, 작업 방향이 이상해질 때 사용합니다.

## 1단계: 전역 규칙 재확인
// turbo
```
cat "C:\Users\AIcreator\.gemini\GEMINI.md"
```

## 2단계: 과거 오류 학습 재확인
// turbo
```
cat "C:\Users\AIcreator\.agent\LESSONS_LEARNED.md"
```

## 3단계: 현재 프로젝트 상태 확인
// turbo
```
git --no-pager log -3 --oneline
```

## 4단계: 상태 보고
아래 내용을 사용자에게 보고:
```
🔄 컨텍스트 리프레시 완료
━━━━━━━━━━━━━━━━━━━━━━━
✅ 전역 규칙 로드: GEMINI.md
✅ 오류 학습 기록 로드: LESSONS_LEARNED.md
✅ 현재 프로젝트: [프로젝트명]
✅ 베이스 프로젝트: e:\Agent\Nano 뇽죵이 (참고 전용)
━━━━━━━━━━━━━━━━━━━━━━━
```
