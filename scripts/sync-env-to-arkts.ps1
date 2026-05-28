$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'
$targetDir = Join-Path $root 'entry\src\main\ets\config'
$targetFile = Join-Path $targetDir 'EnvConfig.ets'

if (-not (Test-Path $envFile)) {
  throw "Missing .env file at $envFile"
}

$pairs = @{}
Get-Content -Path $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line.Length -eq 0 -or $line.StartsWith('#')) {
    return
  }
  $parts = $line -split '=', 2
  if ($parts.Length -eq 2) {
    $pairs[$parts[0].Trim()] = $parts[1].Trim()
  }
}

$clientId = [string]($pairs['MAIN_VITE_ALIYUN_CLIENT_ID'])
$clientSecret = [string]($pairs['MAIN_VITE_ALIYUN_CLIENT_SECRET'])

$clientId = $clientId.Replace('\', '\\').Replace("'", "\'")
$clientSecret = $clientSecret.Replace('\', '\\').Replace("'", "\'")

if (-not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$content = @"
// Generated from hm/.env for HarmonyOS runtime consumption.
// Run scripts/sync-env-to-arkts.ps1 after editing .env.

export const MAIN_VITE_ALIYUN_CLIENT_ID: string = '$clientId'
export const MAIN_VITE_ALIYUN_CLIENT_SECRET: string = '$clientSecret'
"@

Set-Content -Path $targetFile -Value $content -Encoding UTF8
