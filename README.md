# BizPilot 🚗 — AI 소상공인 경리·전화 비서

> **Primer 해커톤 2026** 출품작 | 자동차 정비소 특화 AI SaaS

BizPilot은 AI 전화 에이전트, 실시간 예약 관리, 영수증 OCR 회계, 재방문 유도(RCE) 캠페인을 하나의 대시보드로 통합한 소상공인용 백오피스 플랫폼입니다.

---

## ✨ 핵심 기능

| 기능 | 설명 |
|------|------|
| **AI 전화 에이전트** | OpenAI Realtime API + Twilio — 통화 중 예약 확정·조회 |
| **예약 관리** | 실시간 DB 연동 예약 캘린더 |
| **영수증 OCR** | 카메라/파일 업로드 → 자동 회계 분류 |
| **Revenue Continuity Engine** | 주행거리 기반 재방문 유도 SMS 자동 발송 |
| **대시보드** | 실시간 매출·통화·예약 통계 |

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
# Root (Frontend)
npm install

# Server (Backend)
cd server && npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 API 키를 입력하세요
```

### 3. 동시 구동
```bash
npm run dev:all
```
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001
- Health check: http://localhost:3001/health

> **데모 데이터**: 서버 첫 구동 시 차량 3대, 예약 4건, 장부 8건의 샘플 데이터가 자동 삽입됩니다.

---

## 🏗️ 기술 스택

**Frontend**: React 19 · TypeScript · Vite · TailwindCSS v4 · React Router v7

**Backend**: Fastify · better-sqlite3 · OpenAI Realtime API · Twilio SDK · node-cron

---

## 📁 디렉토리 구조

```
BizPilot/
├── src/                  # React Frontend
│   ├── pages/            # Dashboard, Calls, Bookings, Accounting, RCE, Settings
│   ├── components/       # Layout, UI 컴포넌트
│   ├── hooks/            # useBookings, useAccounting, useDashboard, useRce ...
│   ├── i18n/             # ko.json / en.json (다국어)
│   └── types/            # TypeScript 타입
└── server/
    └── src/
        ├── routes/       # Fastify API 라우트
        ├── lib/          # db.ts · scheduler.ts · seed.ts
        └── index.ts      # 서버 진입점
```

---

## 🔑 주요 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/calls` | 통화 기록 목록 |
| GET | `/api/dashboard/stats` | 대시보드 통계 |
| GET/POST | `/api/rce/vehicles` | 차량 목록/등록 |
| POST | `/api/rce/run` | RCE 캠페인 수동 실행 |
| POST | `/api/ocr/receipt` | 영수증 OCR 처리 |
| WS | `/twilio/stream` | Twilio 미디어 스트림 |

---

## 🌐 AI 전화 에이전트 설정 (Twilio + ngrok)

```bash
# 1. ngrok으로 로컬 서버를 외부에 노출
ngrok http 3001

# 2. Twilio 대시보드에서 번호의 Voice Webhook을 설정:
#    https://your-ngrok-url.ngrok-free.app/twilio/voice

# 3. .env의 SERVER_URL을 ngrok URL로 업데이트
```

---

## 📜 라이선스

MIT © 2026 BizPilot Team
