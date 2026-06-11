param(
  [int]$Port = 5173,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
  $candidate = Resolve-Path (Join-Path $scriptPath "..\..\..")
  return $candidate.Path
}

$repoRoot = Get-RepoRoot
$dashboardRoot = Join-Path $repoRoot "apps\dashboard"
$recommendedPath = "/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json"
$recommendedUrl = "http://localhost:$Port$recommendedPath"

Write-Host "OpenClaw Operator Dashboard local preview"
Write-Host "Recommended operator view:"
Write-Host $recommendedUrl
Write-Host "Health source: local-file-only / local-reviewed-json"
Write-Host "Production: no-go-for-production"
Write-Host "Mutation: disabled"
Write-Host "Restart: disabled"
Write-Host "Production gateway: disabled"
Write-Host ""

$portBusy = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portBusy) {
  Write-Host "Port $Port is already in use. If this is not the dashboard server, rerun with -Port $($Port + 1)."
  if (-not $NoBrowser) {
    Start-Process $recommendedUrl | Out-Null
  }
  return
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
  Write-Error "Python was not found. Install Python or start a local static server manually from apps\dashboard."
}

Push-Location $dashboardRoot
try {
  if ($python.Name -eq "py.exe" -or $python.Name -eq "py") {
    Start-Process -FilePath $python.Source -ArgumentList "-m","http.server",$Port -WorkingDirectory $dashboardRoot -WindowStyle Hidden | Out-Null
  } else {
    Start-Process -FilePath $python.Source -ArgumentList "-m","http.server",$Port -WorkingDirectory $dashboardRoot -WindowStyle Hidden | Out-Null
  }
  Start-Sleep -Seconds 1
  Write-Host "Local static server started on http://localhost:$Port"
  Write-Host "Open recommended operator view:"
  Write-Host $recommendedUrl
  if (-not $NoBrowser) {
    Start-Process $recommendedUrl | Out-Null
  }
} finally {
  Pop-Location
}
