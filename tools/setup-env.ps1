$taskRoot = Split-Path -Parent $PSScriptRoot
$taskEnv = Join-Path $taskRoot '.env'
if (Test-Path -LiteralPath $taskEnv) {
    Write-Output '.env already exists; unchanged.'
    exit 0
}
function New-LabSecret {
    $taskBytes = New-Object byte[] 32
    $taskRandom = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $taskRandom.GetBytes($taskBytes) } finally { $taskRandom.Dispose() }
    return [Convert]::ToBase64String($taskBytes)
}
$taskLines = @(
    'DB_NAME=students',
    'DB_USER=students',
    ('DB_PASSWORD=' + (New-LabSecret)),
    ('JWT_SECRET=' + (New-LabSecret)),
    'JWT_ISSUER=students-lab',
    'ACCESS_TOKEN_SECONDS=900',
    'REFRESH_TOKEN_SECONDS=604800',
    'ADMIN_USERNAME=admin',
    'ADMIN_EMAIL=admin@students.local',
    ('ADMIN_PASSWORD=' + (New-LabSecret)),
    'API_PORT=8000',
    'FRONTEND_PORT=8080'
)
[System.IO.File]::WriteAllLines($taskEnv, $taskLines, [System.Text.UTF8Encoding]::new($false))
Write-Output '.env created. Administrator login and password are in ADMIN_USERNAME and ADMIN_PASSWORD.'
