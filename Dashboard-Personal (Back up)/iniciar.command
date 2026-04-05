#!/bin/bash
# Auto-fix permissions if needed (run once from Terminal: bash iniciar.command)
chmod +x "$0"

cd "$(dirname "$0")"

# Si el servidor ya está corriendo (Launch Agent activo), solo abrir Safari
if curl -s --max-time 1 http://localhost:8080 > /dev/null 2>&1; then
    echo ""
    echo "✅ Servidor ya activo en http://localhost:8080"
    open -a Safari http://localhost:8080
    echo "   (El servidor está gestionado por el Launch Agent — arranca solo al encender el Mac)"
    echo ""
    exit 0
fi

# Si no está corriendo, arrancar manualmente
echo ""
echo "✅ Dashboard arrancado en http://localhost:8080"
echo "🌐 Ábrelo en Safari para instalarlo en el Dock"
echo "👉 Safari → Archivo → Añadir al Dock"
echo ""
echo "💡 TIP: Ejecuta instalar-launch-agent.command para que el servidor"
echo "        arranque automáticamente al encender el Mac."
echo ""
echo "Pulsa Ctrl+C para detener el servidor."
echo ""

open -a Safari http://localhost:8080

if command -v python3 &>/dev/null; then
  python3 -m http.server 8080
elif command -v python &>/dev/null; then
  python -m http.server 8080
else
  echo "⚠️ Python no encontrado. Instala Python 3 desde python.org"
  exit 1
fi
