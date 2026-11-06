#!/usr/bin/env bash
# Freetree — Automated Freenet Website Publisher (Bash)

set -euo pipefail

echo "=========================================="
echo "   Freetree — Freenet Website Publisher   "
echo "=========================================="

if ! command -v fdev &> /dev/null; then
    echo "Errore: fdev CLI non trovato nel PATH." >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "Cartella progetto: $PROJECT_ROOT"

KEY_LIST=$(fdev website list 2>&1 || true)

if echo "$KEY_LIST" | grep -q "freetree"; then
    echo "Chiave 'freetree' trovata. Aggiornamento in corso (fdev website update)..."
    fdev website update . --key freetree
else
    echo "Inizializzazione nuova chiave 'freetree' (fdev website init)..."
    fdev website init freetree
    echo "Pubblicazione iniziale (fdev website publish)..."
    fdev website publish . --key freetree
fi

echo "=========================================="
echo "Pubblicazione completata!"
echo "=========================================="

