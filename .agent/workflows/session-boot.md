---
description: 매 세션 시작 시 상태 확인 및 보고 절차
---

## 세션 초기화 프로토콜

새 대화 시작 시 반드시 아래 절차를 실행한다.

### 0. 과거 오류 학습 기록 확인 (전역)
// turbo
```powershell
Get-Content "C:\Users\AIcreator\.agent\LESSONS_LEARNED.md"
```
- 현재 작업과 관련된 교훈이 있는지 확인
- 같은 실수를 반복하지 않도록 주의

### 1. 현재 프로젝트 감지 및 상태 확인
// turbo
```powershell
# PROJECT_BRIEF.md 또는 package.json으로 프로젝트 파악
if (Test-Path "PROJECT_BRIEF.md") { Get-Content "PROJECT_BRIEF.md" | Select-Object -First 20 }
elseif (Test-Path "package.json") { Get-Content "package.json" | Select-Object -First 10 }
else { Write-Host "⚠️ 프로젝트 파일 없음 — 새 프로젝트일 수 있음" }
```

### 2. 공용 워크플로우 자동 설치 (없는 것만)
// turbo
```powershell
$source = "C:\Users\AIcreator\.agent\workflows"
$dest = ".agent\workflows"
$commonWorkflows = @(
    "git-push.md",
    "fact-check.md",
    "refresh.md",
    "pentagonal-debate.md",
    "pentagonal-workflow.md",
    "verify-and-report.md"
)
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$installed = 0
foreach ($wf in $commonWorkflows) {
    $destFile = Join-Path $dest $wf
    if (-not (Test-Path $destFile)) {
        Copy-Item (Join-Path $source $wf) $destFile
        Write-Host "✅ 설치됨: $wf"
        $installed++
    }
}
if ($installed -eq 0) { Write-Host "✅ 공용 워크플로우 모두 최신 상태" }
```

### 3. 최근 커밋 확인
// turbo
```powershell
git log -5 --oneline 2>$null || Write-Host "⚠️ git 저장소 없음"
```

### 4. 빌드 상태 확인
// turbo
```powershell
if (Test-Path "package.json") {
    npm run build 2>&1 | Select-Object -Last 5
} else {
    Write-Host "⏭️ package.json 없음 — 빌드 스킵"
}
```

### 5. 상태 보고
아래 형식으로 보고:
```
📊 SESSION BOOT REPORT
━━━━━━━━━━━━━━━━━━━━━━━
📁 프로젝트: (감지된 프로젝트명)
🔖 최근 커밋: (git log)
🔨 빌드: 성공/실패/해당없음
🔧 워크플로우: N개 설치됨 / 이미 최신
━━━━━━━━━━━━━━━━━━━━━━━
```
