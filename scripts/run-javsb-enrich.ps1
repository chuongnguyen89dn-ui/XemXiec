$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== XemXiec JAV.SB metadata scan ===" -ForegroundColor Cyan
Write-Host "Repo: $root"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js chưa có trong PATH" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm chưa có trong PATH" }

npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

npm run javsb -- --limit 3225
if ($LASTEXITCODE -ne 0) { throw "jav.sb scan failed" }

npm run javsb:check
if ($LASTEXITCODE -ne 0) { throw "metadata check failed" }

git add javsb_metadata.json
$changes = git diff --cached --name-only
if ($changes) {
  git commit -m "Update jav.sb metadata"
  if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
  git push
  if ($LASTEXITCODE -ne 0) { throw "git push failed" }
  Write-Host "DONE: jav.sb metadata pushed to GitHub." -ForegroundColor Green
} else {
  Write-Host "DONE: no new jav.sb metadata changes." -ForegroundColor Yellow
}
