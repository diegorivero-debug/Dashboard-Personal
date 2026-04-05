#!/bin/bash
# ═══════════════════════════════════════════════════
#  Panel APG — Instalador de Launch Agent
#  Ejecuta este script UNA VEZ con doble clic.
#  Después el Dashboard arrancará solo al encender el Mac.
# ═══════════════════════════════════════════════════

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.apg.dashboard.plist"
PLIST_SRC="$REPO_DIR/$PLIST_NAME"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Panel APG — Instalador de inicio       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📁 Directorio del repo: $REPO_DIR"
echo ""

# 1. Verificar que python3 existe
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 no encontrado."
    echo "   Instálalo desde https://www.python.org o con: brew install python3"
    exit 1
fi

PYTHON_PATH=$(command -v python3)
echo "✅ Python 3 encontrado en: $PYTHON_PATH"

# 2. Crear ~/Library/LaunchAgents si no existe
mkdir -p "$LAUNCH_AGENTS_DIR"

# 3. Generar el plist con la ruta real del repo y la ruta real de python3
sed \
    -e "s|REPO_PATH_PLACEHOLDER|$REPO_DIR|g" \
    -e "s|/usr/bin/python3|$PYTHON_PATH|g" \
    "$PLIST_SRC" > "$PLIST_DEST"

echo "✅ Launch Agent instalado en: $PLIST_DEST"

# 4. Descargar si ya estaba cargado (por si se reinstala)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# 5. Cargar el Launch Agent ahora mismo (sin necesidad de reiniciar)
launchctl load "$PLIST_DEST"

echo "✅ Servidor arrancado en http://localhost:8080"
echo ""

# 6. Esperar a que el servidor responda (hasta 10 intentos, 1s entre cada uno)
echo "⏳ Verificando servidor..."
SERVER_OK=false
for i in $(seq 1 10); do
    if curl -s --max-time 2 http://localhost:8080 > /dev/null 2>&1; then
        SERVER_OK=true
        break
    fi
    sleep 1
done

if $SERVER_OK; then
    echo "🟢 Servidor verificado — responde correctamente"
else
    echo "⚠️  El servidor tardó más de lo esperado. Espera unos segundos y prueba el Dock."
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Instalación completada               ║"
echo "║                                          ║"
echo "║  El servidor arrancará automáticamente   ║"
echo "║  cada vez que inicies sesión en el Mac.  ║"
echo "║                                          ║"
echo "║  Ahora pulsa el icono del Dock 🚀        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 7. Abrir Safari en el dashboard
open -a Safari http://localhost:8080
