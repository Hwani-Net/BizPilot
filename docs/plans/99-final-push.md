# 99-final-push.md (Hackathon Final Polish)

## PM Delta Planning
BizPilot의 해커톤 데모 완결성을 극대화하기 위한 마지막 3대 핵심 과제와 보완점 스캔 결과입니다.

### 🎯 핵심 과제
1. **AI 전화 에이전트 Mock 뷰 (Calls 페이지)**
   - 목표: Twilio/실제 전화 연동 없이도 심사위원에게 AI 에이전트의 작동 원리와 인터페이스를 시각적으로 보여줌.
   - UI 요소: Glassmorphism 통화 카드, 파형(Waveform) 애니메이션, 실시간 트랜스크립트(자막) 스트리밍 효과, 끊기 버튼.
   - 의존성: `src/pages/Calls.tsx`, Shadcn UI, CSS Animation.

2. **대시보드 Revenue 차트 실제 데이터 연동**
   - 목표: 대시보드 하단의 수익 차트를 목업 데이터가 아닌 DB(`receipts` 테이블 파생 데이터)와 연동.
   - 현재 상황: `fetchDashboardStats` API (server)는 최근 수익 배열을 반환해야 함.
   - 프론트엔드: `Recharts` 툴팁 고급화, 그라디언트 차트 렌더링.

3. **RCE 캠페인 실행 피드백 (UX 극대화)**
   - 목표: RCE 페이지에서 '설문 발송' 또는 '캠페인 시작' 클릭 시 밋밋한 전환 대신 강력한 마이크로 애니메이션과 Toast(Sonner) 알림 제공.
   - UI 요소: 클릭 시 버튼 로딩 스피너, 성공 시 폭죽(Confetti) 또는 부드러운 Slide-in 성공 알림, 상태 뱃지 실시간 변경.

### 🛡️ 실행 및 방어 전략 (TDD & Safe Execution)
- 각 과제 완료 시마다 `npm run build` 실행하여 90점 이상 달성 시 마이크로 커밋(`execute_shell` 사용).
- `dist` 캐시나 상태 불일치 방지를 위해 에러 발생 시 3회 자가 복구.
- 실패하는 테스트(또는 시각적 결함 렌더링) 확인 -> 최소 구현 -> 성공 확인 루프.

## 진행 상태 체크리스트
- [x] Phase 1: AI 전화 에이전트 Mock 뷰 구현
- [x] Phase 2: 대시보드 Revenue 차트 연동
- [x] Phase 3: RCE 피드백 UX 디자인 및 애니메이션
- [x] Phase 4: 전체 빌드 점검 및 최종 브리핑
