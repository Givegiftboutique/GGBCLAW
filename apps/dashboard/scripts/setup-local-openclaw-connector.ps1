param(
  [string]$BaseUrl,
  [string]$LocalExport
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DashboardDir = Resolve-Path (Join-Path $ScriptDir "..")
$RepoRoot = Resolve-Path (Join-Path $DashboardDir "..\..")
$NodeScript = Join-Path $ScriptDir "setup-local-openclaw-connector.mjs"
$BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NodeExe = "node"
if (Test-Path $BundledNode) {
  $NodeExe = $BundledNode
}

Write-Host "OpenClaw local connector setup helper"
Write-Host "Local-only, read-only, no secrets, no Production connection."

if ($BaseUrl -and $LocalExport) {
  throw "Please provide either -BaseUrl or -LocalExport, not both."
}

if (-not $BaseUrl -and -not $LocalExport) {
  throw "Please provide -BaseUrl http://127.0.0.1:<port> or -LocalExport apps/dashboard/data/local/openclaw-local-export.json."
}

if ($BaseUrl) {
  & $NodeExe $NodeScript --base-url $BaseUrl
} else {
  & $NodeExe $NodeScript --local-export $LocalExport
}

Write-Host "Next step: run node apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs"
