param(
    [switch]$FullStack,
    [switch]$NoBuild,
    [switch]$Logs
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$composeFile = Join-Path $repoRoot 'docker-compose.yml'

if (-not (Test-Path -LiteralPath $composeFile)) {
    throw "Could not find docker-compose.yml at $composeFile"
}

function Assert-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. Please install it first."
    }
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & docker compose @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose failed with exit code $LASTEXITCODE"
    }
}

function Wait-ForHttp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [int]$Retries = 30,
        [int]$DelaySeconds = 3
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
            if ($attempt -eq $Retries) {
                return $false
            }
        }

        Start-Sleep -Seconds $DelaySeconds
    }

    return $false
}

Assert-Command -Name 'docker'

try {
    & docker compose version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose is not available."
    }
} catch {
    throw "Docker Compose plugin is not available. Open Docker Desktop and make sure 'docker compose' works."
}

Set-Location $repoRoot

$farmStackServices = @(
    'auth-db',
    'auth-service',
    'farm-production-db',
    'farm-production-service',
    'image-storage-db',
    'minio',
    'image-storage-service',
    'bicap-message-queue',
    'kong-gateway',
    'farm-management-web'
)

$upArguments = @('up', '-d')
if (-not $NoBuild) {
    $upArguments += '--build'
}

if ($FullStack) {
    Write-Host 'Starting the full BICAP stack with Docker Compose...' -ForegroundColor Cyan
    Invoke-Compose -Arguments $upArguments
} else {
    Write-Host 'Starting the farm-management-web Docker stack...' -ForegroundColor Cyan
    Invoke-Compose -Arguments ($upArguments + $farmStackServices)
}

Write-Host ''
Write-Host 'Current container status:' -ForegroundColor Cyan
Invoke-Compose -Arguments @('ps')

Write-Host ''
Write-Host 'Waiting for farm-management-web health endpoint...' -ForegroundColor Cyan
$farmHealthy = Wait-ForHttp -Url 'http://localhost:3002/health'

Write-Host ''
if ($farmHealthy) {
    Write-Host 'farm-management-web is reachable.' -ForegroundColor Green
} else {
    Write-Host 'farm-management-web has not responded yet. Check logs below.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Open these URLs after startup:' -ForegroundColor Green
Write-Host '  Farm web:        http://localhost:3002'
Write-Host '  Farm login:      http://localhost:3002/login'
Write-Host '  Dev farm login:  http://localhost:3002/dev/login-as-farm'
Write-Host '  Health check:    http://localhost:3002/health'
Write-Host '  Kong gateway:    http://localhost:8000'
Write-Host '  Kong admin:      http://localhost:8001'
Write-Host '  RabbitMQ UI:     http://localhost:15672'
Write-Host '  MinIO console:   http://localhost:9001'

Write-Host ''
Write-Host 'Useful follow-up commands:' -ForegroundColor Cyan
Write-Host '  docker compose logs -f farm-management-web'
Write-Host '  docker compose logs -f kong-gateway'
Write-Host '  docker compose down'

if ($Logs) {
    Write-Host ''
    Write-Host 'Streaming farm-management-web logs...' -ForegroundColor Cyan
    Invoke-Compose -Arguments @('logs', '-f', 'farm-management-web')
}
