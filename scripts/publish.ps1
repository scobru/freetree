# Freetree -- Automated Freenet Website Publisher
# Uses fdev website CLI to publish or update freetree on Freenet

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Freetree -- Freenet Website Publisher   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check if fdev is installed
if (-not (Get-Command fdev -ErrorAction SilentlyContinue)) {
    Write-Error "fdev CLI non trovato nel PATH. Installa o aggiungi Freenet bin al PATH."
    exit 1
}

# 2. Change directory to freetree root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "`nCartella progetto: $projectRoot" -ForegroundColor Gray

# 3. Check existing keys
Write-Host "`nControllo chiavi di pubblicazione Freenet..." -ForegroundColor Yellow
$keyList = & fdev website list 2>&1 | Out-String

if ($keyList -match "freetree") {
    Write-Host "Chiave freetree trovata. Aggiornamento in corso (fdev website update)..." -ForegroundColor Green
    & fdev website update . --key freetree
} else {
    Write-Host "Inizializzazione nuova chiave freetree (fdev website init)..." -ForegroundColor Yellow
    & fdev website init freetree
    Write-Host "Pubblicazione iniziale (fdev website publish)..." -ForegroundColor Green
    & fdev website publish . --key freetree
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Pubblicazione completata!" -ForegroundColor Green
Write-Host "Controlla il link URL stampato sopra per accedere a Freetree su Freenet." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
