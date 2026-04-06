#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Panel APG — Desinstalador completo
#  Detiene el servidor, elimina el LaunchAgent y opcionalmente
#  elimina la app de /Applications
# ═══════════════════════════════════════════════════════════════════

PLIST_NAME="com.apg.dashboard.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
APP_PATH="/Applications/Panel APG.app"
PID_FILE="/tmp/apg-dashboard.pid"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Panel APG — Desinstalador              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 1. Detener el servidor HTTP
echo "🛑 Deteniendo servidor..."

STOPPED=false

# Intentar por PID guardado
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill "$PID" 2>/dev/null; then
        echo "   ✓ Servidor detenido (PID $PID)"
        STOPPED=true
    fi
    rm -f "$PID_FILE"
fi

# Buscar cualquier proceso python3 sirviendo el puerto 8080
if ! $STOPPED; then
    PID=$(lsof -ti ":8080" -sTCP:LISTEN 2>/dev/null | head -1)
    if [ -n "$PID" ]; then
        if kill "$PID" 2>/dev/null; then
            echo "   ✓ Servidor detenido (PID $PID)"
            STOPPED=true
        fi
    fi
fi

if ! $STOPPED; then
    echo "   ℹ️  El servidor no estaba en ejecución"
fi

# 2. Eliminar Launch Agent
echo ""
echo "🔧 Eliminando Launch Agent..."

if [ -f "$PLIST_DEST" ]; then
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm -f "$PLIST_DEST"
    echo "   ✓ Launch Agent eliminado"
    echo "     El servidor ya no arrancará automáticamente al iniciar sesión"
else
    echo "   ℹ️  Launch Agent no encontrado"
fi

# 3. Preguntar si eliminar la app de /Applications
echo ""
if [ -d "$APP_PATH" ]; then
    echo "   ¿Eliminar 'Panel APG' de /Applications?"
    echo ""

    REMOVE_APP=false
    if command -v osascript &>/dev/null; then
        RESULT=$(osascript -e 'button returned of (display dialog "¿Eliminar Panel APG de Aplicaciones?" buttons {"Cancelar", "Eliminar"} default button "Cancelar" with icon caution)' 2>/dev/null || echo "Cancelar")
        [ "$RESULT" = "Eliminar" ] && REMOVE_APP=true
    else
        read -r -p "   Escribe 'eliminar' para confirmar: " CONFIRM
        [ "$CONFIRM" = "eliminar" ] && REMOVE_APP=true
    fi

    if $REMOVE_APP; then
        rm -rf "$APP_PATH"
        echo "   ✓ Panel APG eliminado de /Applications"
    else
        echo "   ℹ️  App conservada en /Applications"
    fi
else
    echo "   ℹ️  Panel APG no encontrado en /Applications"
fi

# 4. Limpiar logs temporales
echo ""
echo "🧹 Limpiando archivos temporales..."
for log in /tmp/apg-dashboard.log /tmp/apg-dashboard-error.log; do
    if [ -f "$log" ]; then
        rm -f "$log"
        echo "   ✓ $log eliminado"
    fi
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Desinstalación completada            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
