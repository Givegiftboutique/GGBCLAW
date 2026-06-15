param(
  [Parameter(Mandatory = $true)]
  [string]$Input,
  [string]$Output = "apps/dashboard/data/local/whatsapp-task-import.json"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")

Push-Location $repoRoot
try {
  & node "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs" --input $Input --output $Output
} finally {
  Pop-Location
}
