<#
.SYNOPSIS
    Peek-a-boo Windows bootstrapper — the PowerShell counterpart to install.sh.

.DESCRIPTION
    Same steps as install.sh, plus the two preflight checks that only matter on
    Windows + Docker Desktop:

      * whether a non-default PEEKABOO_BIND_IP is actually a bound loopback
        alias (127.0.0.2+ are NOT valid bind targets on Windows out of the box)
      * whether another service already holds :80/:443 on 0.0.0.0, which Docker
        Desktop's port forwarder treats as reserving the port for EVERY address

.EXAMPLE
    .\install.ps1

.NOTES
    Run from the directory you extracted the release into.
#>

#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-Head($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Wait($msg) { Write-Host "[WAIT] $msg" -ForegroundColor Yellow }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

function Stop-WithError {
    param([string]$Message, [string[]]$Hints = @())
    Write-Host "`n[ERROR] $Message" -ForegroundColor Red
    foreach ($h in $Hints) { Write-Host "        $h" }
    exit 1
}

Write-Head "========================================="
Write-Head "    Peek-a-boo Windows Bootstrapper      "
Write-Head "========================================="

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Stop-WithError "Docker is not installed or not in PATH." @(
        "Install Docker Desktop, then re-run this script."
    )
}

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Docker is installed but the daemon is not responding." @(
        "Start Docker Desktop and wait for it to report 'Engine running', then re-run."
    )
}

docker compose version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "'docker compose' (v2) is not available." @(
        "The standalone docker-compose.exe (v1) is not supported."
    )
}

$python = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $python = $candidate; break }
}
if (-not $python) {
    Stop-WithError "Python is required to run the setup wizard but was not found." @(
        "Install Python 3.11+ from https://python.org (tick 'Add to PATH'), then re-run."
    )
}

if (-not ((Test-Path "docker-compose.yml") -and (Test-Path "setup.py"))) {
    Stop-WithError "docker-compose.yml / setup.py not found in $(Get-Location)." @(
        "Run this script from the directory you extracted the release into."
    )
}

# ---------------------------------------------------------------------------
# Environment configuration (setup.py)
# ---------------------------------------------------------------------------
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Wait "Initializing environment configuration wizard..."
    & $python -m venv .venv
    if (Test-Path "wheels") {
        & ".venv\Scripts\python.exe" -m pip install --no-index --find-links=wheels -r requirements.txt --quiet
        if ($LASTEXITCODE -ne 0) {
            Stop-WithError "Could not install the wizard's Python packages from wheels\." @(
                "The bundle may be incomplete - re-download the offline release."
            )
        }
    } else {
        & ".venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet
    }
    & ".venv\Scripts\python.exe" setup.py
    if (-not (Test-Path ".env")) {
        Stop-WithError "The setup wizard did not produce a .env file." @(
            "Re-run it directly to see the failure: .venv\Scripts\python.exe setup.py"
        )
    }
    Write-Ok "Environment configured."
} else {
    Write-Host ""
    Write-Ok "Existing .env found. Skipping configuration wizard."
}

if (-not (Test-Path "websock\websocket_token_source.txt")) {
    Stop-WithError "websock\websocket_token_source.txt is missing." @(
        "setup.py writes it from Hive's student list - re-run: .venv\Scripts\python.exe setup.py"
    )
}
if (-not ((Test-Path "nginx\ssl\star.crt") -and (Test-Path "nginx\ssl\star.key"))) {
    Stop-WithError "TLS certificate missing (nginx\ssl\star.crt, nginx\ssl\star.key)." @(
        "setup.py issues one; or drop your own certificate there under those names."
    )
}

function Get-EnvValue([string]$Key) {
    $line = Select-String -Path ".env" -Pattern "^$Key=" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($line) { return (($line.Line -split "=", 2)[1]).Trim("'", '"') }
    return $null
}

function Set-EnvValue([string]$Key, [string]$Value) {
    $envLines = @(Get-Content ".env")
    if ($envLines -match "^$Key=") {
        $envLines = $envLines -replace "^$Key=.*", "$Key=$Value"
        Set-Content ".env" $envLines -Encoding UTF8
    } else {
        Add-Content ".env" "$Key=$Value" -Encoding UTF8
    }
}

$bindIp    = Get-EnvValue "PEEKABOO_BIND_IP";    if (-not $bindIp)    { $bindIp = "0.0.0.0" }
$httpPort  = Get-EnvValue "PEEKABOO_HTTP_PORT";  if (-not $httpPort)  { $httpPort = "80" }
$httpsPort = Get-EnvValue "PEEKABOO_HTTPS_PORT"; if (-not $httpsPort) { $httpsPort = "443" }

# ---------------------------------------------------------------------------
# Windows loopback alias check — Docker's failure for an unbound 127.0.0.x is
# indistinguishable from a genuine port conflict.
# ---------------------------------------------------------------------------
if ($bindIp -ne "0.0.0.0" -and $bindIp -ne "127.0.0.1") {
    $aliasExists = $false
    try {
        $aliasExists = [bool](Get-NetIPAddress -IPAddress $bindIp -ErrorAction SilentlyContinue)
    } catch {
        $aliasExists = $null -ne (netsh interface ipv4 show address 2>$null | Select-String -SimpleMatch $bindIp)
    }

    if (-not $aliasExists) {
        Stop-WithError "PEEKABOO_BIND_IP is set to $bindIp, which is not a bound address on this machine." @(
            "Windows does not make 127.0.0.2+ bindable by default. Either:",
            "",
            "  1. Add the loopback alias (Administrator PowerShell, one time):",
            "       netsh interface ipv4 add address `"Loopback Pseudo-Interface 1`" $bindIp 255.0.0.0",
            "",
            "  2. Or set PEEKABOO_BIND_IP=0.0.0.0 in .env and give peek-a-boo its own ports:",
            "       PEEKABOO_HTTP_PORT=8080",
            "       PEEKABOO_HTTPS_PORT=8443"
        )
    }
    Write-Ok "Loopback alias $bindIp is present."
}

# ---------------------------------------------------------------------------
# Port availability (our own proxy holding it on a re-run is fine)
# ---------------------------------------------------------------------------
$ownProxy = (docker ps --format "{{.Names}}") -contains "peekaboo-proxy"
if (-not $ownProxy) {
    foreach ($port in @($httpPort, $httpsPort)) {
        $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
        if ($listener) {
            Write-Host ""
            Write-Warn "Something is already listening on port $port."
            if ($listener | Where-Object { $_.LocalAddress -in @("0.0.0.0", "::") }) {
                Write-Host "        It is bound to 0.0.0.0. Docker Desktop reserves a published port by"
                Write-Host "        NUMBER, so PEEKABOO_BIND_IP alone will not get around this. Bind the"
                Write-Host "        other service to a specific IP, or set PEEKABOO_HTTP_PORT /"
                Write-Host "        PEEKABOO_HTTPS_PORT in .env."
            } else {
                Write-Host "        Set PEEKABOO_HTTP_PORT / PEEKABOO_HTTPS_PORT in .env to free ports."
            }
        }
    }
}

# ---------------------------------------------------------------------------
# Image resolution & versioning
# ---------------------------------------------------------------------------
$detectedTag = ""
if (Test-Path "VERSION") { $detectedTag = (Get-Content "VERSION" -Raw).Trim() }
$isOffline = $false

Write-Host ""
Write-Wait "Resolving Docker images..."
$imageArchives = Get-ChildItem -Path "images\*.tar" -ErrorAction SilentlyContinue
if ($imageArchives) {
    $isOffline = $true
    Write-Host ">> Offline bundle detected. Loading local image archives..." -ForegroundColor Blue
    foreach ($img in $imageArchives) {
        Write-Host "   Loading $($img.Name)..."
        docker load -i $img.FullName | Out-Null
        if ($LASTEXITCODE -ne 0) { Stop-WithError "docker load failed for $($img.Name)." }
    }
    Write-Ok "Loaded offline images."
} else {
    Write-Host ">> No local images found. Assuming online mode." -ForegroundColor Blue
}

if (-not $detectedTag) {
    Stop-WithError "Could not determine which peek-a-boo version to run." @(
        "The bundle should contain a VERSION file.",
        "Set it by hand if you know the version:  'v1.0.0' | Set-Content VERSION"
    )
}

Set-EnvValue "PEEKABOO_VERSION" $detectedTag
if ($env:HIVE_NETWORK_NAME) { Set-EnvValue "HIVE_NETWORK_NAME" $env:HIVE_NETWORK_NAME }

# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
$composeArgs = @("-f", "docker-compose.yml")
if ((Get-EnvValue "HIVE_NETWORK_NAME") -and (Test-Path "docker-compose.hive-local.yml")) {
    $composeArgs += @("-f", "docker-compose.hive-local.yml")
}

Write-Host ""
Write-Wait "Validating compose configuration..."
docker compose @composeArgs config --quiet
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "docker-compose.yml did not validate against your .env." @(
        "The error above names the missing or malformed variable."
    )
}

if (-not $isOffline) {
    Write-Host ""
    Write-Wait "Pulling containers ($detectedTag)..."
    docker compose @composeArgs pull
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "Failed to pull images for version $detectedTag." @(
            "If the packages are private, log in first: docker login ghcr.io"
        )
    }
}

Write-Host ""
Write-Wait "Starting peek-a-boo services..."
docker compose @composeArgs up -d --wait
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Services did not become healthy." @(
        "If the proxy reports 'port is already allocated', see the port warnings above.",
        "Inspect with: docker compose logs ui proxy vnc-bridge"
    )
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Peek-a-boo Installation Complete!       " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$nextauthUrl = Get-EnvValue "NEXTAUTH_URL"
if ($nextauthUrl) { Write-Host "Peek-a-boo should now be reachable at: $nextauthUrl" -ForegroundColor Cyan }
Write-Host "Trust nginx\ssl\ca.crt once to silence certificate warnings:"
Write-Host "    certutil -addstore -user Root nginx\ssl\ca.crt"

Write-Host ""
Write-Host "To stop the system, run: docker compose down"
Write-Host "Running Hive on this same machine? Run ./link-hive.sh from Git Bash or WSL."
