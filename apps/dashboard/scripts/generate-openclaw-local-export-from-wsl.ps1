param(
  [Parameter(Mandatory = $true)]
  [string]$Distro,

  [Parameter(Mandatory = $true)]
  [string]$StateDir,

  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardRoot = Resolve-Path (Join-Path $scriptDir "..")
$repoRoot = Resolve-Path (Join-Path $dashboardRoot "..\..")
$nodeScript = Join-Path $scriptDir "generate-openclaw-local-export-from-wsl.mjs"

$argsList = @($nodeScript, "--distro", $Distro, "--state-dir", $StateDir)
if ($DryRun) {
  $argsList += "--dry-run"
}

Write-Output "OpenClaw WSL local export adapter"
Write-Output "Mode: $(if ($DryRun) { 'dry-run' } else { 'write ignored local export' })"
Write-Output "Safety: read-only, no secrets, no restart, no deploy"

Push-Location $repoRoot
try {
  & node @argsList
  if ($LASTEXITCODE -ne 0) {
    throw "WSL local export adapter failed."
  }
} finally {
  Pop-Location
}
