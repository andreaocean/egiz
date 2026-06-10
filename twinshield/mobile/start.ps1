Set-Location $PSScriptRoot
if (-not (Test-Path node_modules)) {
    npm install --legacy-peer-deps
}
npx expo start
