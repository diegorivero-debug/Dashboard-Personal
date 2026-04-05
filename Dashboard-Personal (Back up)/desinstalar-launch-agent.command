#!/bin/bash
# Desinstalador del Launch Agent del Panel APG

PLIST_NAME="com.apg.dashboard.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo ""
echo "🛑 Desinstalando Launch Agent del Panel APG..."

if [ -f "$PLIST_DEST" ]; then
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm "$PLIST_DEST"
    echo "✅ Launch Agent eliminado."
    echo "   El servidor ya no arrancará automáticamente al iniciar sesión."
else
    echo "ℹ️  No se encontró el Launch Agent instalado."
fi

echo ""
