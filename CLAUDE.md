# BizPilot — AI Agent Context

## ⚠️ 실행 환경: Windows + Git Bash

이 프로젝트는 **Windows OS + Git Bash 터미널** 환경입니다.
(이전에 WSL 환경에서 개발되었으나, 현재는 Windows 네이티브 + Git Bash로 이전됨)

### 터미널: Git Bash (bash)
- `ls`, `cat`, `mkdir`, `rm`, `cp`, `mv` 등 bash 명령어 정상 동작
- 경로: Windows 경로(`e:\...`)와 bash 경로(`/e/...`) 모두 사용 가능
- **단, `2>&1`, `|`, `&&`, `;` 포함 파이프 명령 금지** → IDE 안전 필터 발동, 자동실행 불가
  → 대신 명령어를 **분리해서 순차 실행**
- `git` 명령 시 **반드시 `git --no-pager` 사용** → pager 멈춤 방지
  예: `git --no-pager log -3 --oneline`

### ✅ 올바른 명령어 예시
```bash
# 파일 읽기
cat .env.local

# git 로그 (pager 없이)
git --no-pager log -5 --oneline

# 명령 분리 실행 (파이프 대신)
git add -A
git commit -m "feat: ..."
git push
```

### 프로젝트 경로
- **루트**: `e:\AI_Programing\BizPilot\`
- **프론트엔드**: `e:\AI_Programing\BizPilot\src\`
- **백엔드**: `e:\AI_Programing\BizPilot\server\`
- **스크립트**: `e:\AI_Programing\BizPilot\scripts\`

### 개발 서버 실행 (올바른 방법)
```powershell
# 프론트엔드
npm run dev

# 백엔드 (server 폴더)
cd server
npm run dev
```

### 패키지 매니저
- **npm** 사용 (yarn, pnpm 혼용 금지)

### 기술 스택
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Hono (server/)
- DB: Supabase
- Deploy: Vercel (frontend) + Render (backend)
- TTS: ElevenLabs API, Kokoro-82M (로컬)

### 주의사항
- Python 스크립트(`scripts/*.py`)는 `python` 명령으로 실행 (WSL의 `python3` 아님)
- `.env.local`에 API 키 저장됨 (`.env.example` 참고)
- Supabase 연결: 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
