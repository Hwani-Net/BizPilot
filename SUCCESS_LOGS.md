# BizPilot Project Success Logs

## 🎯 주요 성과 (Key Achievements)

1.  **자동차 정비소 최적화 (Vertical Pivot)**:
    *   플랫폼의 모든 데이터와 인터페이스를 헤어샵에서 자동차 정비소 맥락으로 완벽히 리팩토링함.
    *   `vehicleModel` 필드 도입을 통해 차주와 차량 정보를 분리하여 데이터 무결성 확보.
2.  **AI 전화 에이전트 구축**:
    *   Twilio + OpenAI Realtime API 기반의 하이브리드(Mock/Real) 백엔드 구축.
    *   자동차 정비 맥락(엔진오일, 타이어, 차량 번호 조회 등)에 특화된 시스템 프롬프트 및 코파일럿 제안 로직 구현.
3.  **영수증 OCR → 회계 파이프라인**:
    *   부품 영수증 스캔 시 자동으로 SQLite DB에 저장되고 장부(Ledger)에 지출로 기입되는 자동화 프로세스 완성.
    *   사용자 수동 확인(Verify) 및 상태 관리 기능 포함.
4.  **프리미엄 UI/UX**:
    *   Glassmorphism, Gradient, Dark Mode를 지원하는 고품질 인터페이스 구축.
    *   i18n(한/영) 및 PWA(manifest/SW) 지원으로 확장성 확보.

## 💡 교훈 (Lessons Learned)

-   **컨텍스트 스위칭의 중요성**: 일반적인 "매장" 프롬프트보다 "자동차 정비소"처럼 도메인을 명확히 정의했을 때 AI의 제안 품질이 비약적으로 상승함.
-   **데이터 구조의 확장성**: 초기 설계에서 차주 이름뿐만 아니라 `vehicleModel` 같은 도메인 특화 속성을 선제적으로 분리하는 것이 UI 리팩토링 비용을 줄임.
-   **하이브리드 모드 운영**: 서버가 오프라인이거나 API 키가 없는 환경을 위해 정교한 `runDemoMode`를 구축하는 것이 개발 및 데모 신뢰성을 높임.

## 🛠️ 기술 스택 (Tech Stack)
- Frontend: React, Vite, TS, TailwindCSS, Lucide Icons
- Backend: Fastify, SQLite (better-sqlite3), OpenAI (Vision, GPT-4o, Realtime), Twilio
- Tools: i18next, PWA manifest, Framer Motion
