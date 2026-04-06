#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Panel APG — Generador de instalador .dmg para macOS
#  Doble clic en el Mac de desarrollo para generar Panel APG.dmg
#
#  Requisitos: macOS con Python 3, sips/iconutil (incluidos en macOS)
#  Sin dependencias externas (no npm, no brew)
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuración ──────────────────────────────────────────────────
APP_NAME="Panel APG"
BUNDLE_ID="com.apg.dashboard"
VERSION="1.0"
APP_BUNDLE="${APP_NAME}.app"
DMG_NAME="${APP_NAME}.dmg"
VOLUME_NAME="${APP_NAME}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
STAGING_DIR="$DIST_DIR/staging"
APP_PATH="$STAGING_DIR/$APP_BUNDLE"
DMG_PATH="$DIST_DIR/$DMG_NAME"

# ── Cabecera ───────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Panel APG — Generador de instalador macOS          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Verificar Python 3 ──────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 no encontrado. Instálalo desde https://www.python.org"
    exit 1
fi
PYTHON_PATH="$(command -v python3)"
echo "✅ Python 3: $PYTHON_PATH"

# ── 2. Limpiar y crear estructura de directorios ───────────────────
echo "🧹 Limpiando dist anterior..."
rm -rf "$DIST_DIR"
mkdir -p "$STAGING_DIR"

# Estructura del .app bundle
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources/dashboard"

echo "📁 Estructura del .app creada"

# ── 3. Copiar archivos web al bundle ───────────────────────────────
echo "📋 Copiando archivos del dashboard..."

WEB_FILES=(
    "index.html"
    "dashboard.html"
    "dashboard.css"
    "dashboard.js"
    "manifest.json"
    "sw.js"
    "icon.svg"
    "icon-512.svg"
    "commitments-data.js"
    "config.example.js"
)

for f in "${WEB_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$f" ]; then
        cp "$SCRIPT_DIR/$f" "$APP_PATH/Contents/Resources/dashboard/"
        echo "   ✓ $f"
    else
        echo "   ⚠ $f no encontrado (omitido)"
    fi
done

# Copiar carpeta js/ completa
if [ -d "$SCRIPT_DIR/js" ]; then
    cp -r "$SCRIPT_DIR/js" "$APP_PATH/Contents/Resources/dashboard/"
    echo "   ✓ js/ ($(find "$SCRIPT_DIR/js" -type f | wc -l | tr -d ' ') archivos)"
fi

# Copiar plist template para el LaunchAgent
if [ -f "$SCRIPT_DIR/com.apg.dashboard.plist" ]; then
    cp "$SCRIPT_DIR/com.apg.dashboard.plist" "$APP_PATH/Contents/Resources/"
    echo "   ✓ com.apg.dashboard.plist"
fi

# ── 4. Crear icono .icns ───────────────────────────────────────────
echo "🎨 Generando icono..."

ICONSET_DIR="$DIST_DIR/AppIcon.iconset"
mkdir -p "$ICONSET_DIR"

# sips no soporta SVG nativamente, así que generamos un PNG programáticamente
export ICON_PNG="$DIST_DIR/icon_base.png"

# Intentar con qlmanage (Quick Look) que puede renderizar SVG
ICON_GENERATED=false

if command -v qlmanage &>/dev/null; then
    qlmanage -t -s 512 -o "$DIST_DIR" "$SCRIPT_DIR/icon-512.svg" 2>/dev/null && \
    mv "$DIST_DIR/icon-512.svg.png" "$ICON_PNG" 2>/dev/null && \
    ICON_GENERATED=true || true
fi

# Si no se pudo con qlmanage, crear un PNG RGBA simple con Python (degradado azul Apple)
if [ "$ICON_GENERATED" = false ]; then
    python3 - <<'PYEOF'
import struct, zlib, os

def make_png(width, height, filename):
    """Genera un PNG RGBA con degradado azul Apple (transparente fuera del círculo)."""
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    png_sig = b'\x89PNG\r\n\x1a\n'
    # color_type=6 → RGBA (8 bits por canal)
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))

    cx, cy = width / 2.0, height / 2.0
    radius = cx * 0.92

    raw_rows = []
    for y in range(height):
        row = bytearray([0])  # filter byte = None
        for x in range(width):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if dist > radius:
                row += bytearray([0, 0, 0, 0])  # transparente
            else:
                ratio = dist / radius
                # Centro: #0071E3 (azul Apple) → borde: #4B4ACF (índigo)
                r = int(0x00 + ratio * (0x4B - 0x00))
                g = int(0x71 + ratio * (0x4A - 0x71))
                b = int(0xE3 + ratio * (0xCF - 0xE3))
                row += bytearray([r, g, b, 255])
        raw_rows.append(bytes(row))

    idat = chunk(b'IDAT', zlib.compress(b''.join(raw_rows), 6))
    iend = chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png_sig + ihdr + idat + iend)

output = os.environ.get('ICON_PNG', '/tmp/icon_base.png')
make_png(512, 512, output)
PYEOF
    ICON_GENERATED=true
fi

# Generar variantes del iconset
ICON_SIZES=(16 32 64 128 256 512)
for size in "${ICON_SIZES[@]}"; do
    if [ "$ICON_GENERATED" = true ] && [ -f "$ICON_PNG" ]; then
        sips -z "$size" "$size" "$ICON_PNG" --out "$ICONSET_DIR/icon_${size}x${size}.png" &>/dev/null
        double=$((size * 2))
        sips -z "$double" "$double" "$ICON_PNG" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" &>/dev/null
    fi
done

# Convertir iconset → .icns
ICNS_PATH="$APP_PATH/Contents/Resources/AppIcon.icns"
if [ -d "$ICONSET_DIR" ] && [ "$(ls -A "$ICONSET_DIR")" ]; then
    iconutil -c icns "$ICONSET_DIR" -o "$ICNS_PATH" 2>/dev/null && \
    echo "✅ Icono .icns generado" || \
    echo "⚠️  No se pudo generar .icns — la app usará icono genérico"
else
    echo "⚠️  No hay iconset — la app usará icono genérico"
fi

# ── 5. Crear Info.plist ────────────────────────────────────────────
echo "📄 Creando Info.plist..."

ICON_FILE=""
[ -f "$ICNS_PATH" ] && ICON_FILE="AppIcon"

cat > "$APP_PATH/Contents/Info.plist" <<INFOPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>${ICON_FILE}</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
INFOPLIST

echo "✅ Info.plist creado"

# ── 6. Crear el launcher principal ────────────────────────────────
echo "⚙️  Creando launcher de la app..."

cat > "$APP_PATH/Contents/MacOS/launcher" <<'LAUNCHER'
#!/bin/bash
# ── Panel APG — Launcher principal ─────────────────────────────────
# Ejecutado por macOS al abrir Panel APG.app

RESOURCES_DIR="$(dirname "$0")/../Resources"
DASHBOARD_DIR="$RESOURCES_DIR/dashboard"
PLIST_TEMPLATE="$RESOURCES_DIR/com.apg.dashboard.plist"
PLIST_NAME="com.apg.dashboard.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
PORT=8080
URL="http://localhost:$PORT"

# ── Función: mostrar diálogo nativo ──────────────────────────────
show_dialog() {
    local msg="$1"
    osascript -e "display dialog \"$msg\" buttons {\"OK\"} default button \"OK\" with icon note" 2>/dev/null || true
}

show_error() {
    local msg="$1"
    osascript -e "display dialog \"$msg\" buttons {\"OK\"} default button \"OK\" with icon stop" 2>/dev/null || true
}

# ── Verificar Python 3 ────────────────────────────────────────────
PYTHON_PATH=""
for p in /usr/bin/python3 /usr/local/bin/python3 /opt/homebrew/bin/python3; do
    if [ -x "$p" ]; then
        PYTHON_PATH="$p"
        break
    fi
done

if [ -z "$PYTHON_PATH" ] && command -v python3 &>/dev/null; then
    PYTHON_PATH="$(command -v python3)"
fi

if [ -z "$PYTHON_PATH" ]; then
    show_error "⚠️ Python 3 no encontrado.\n\nInstálalo desde https://www.python.org\n\nPanel APG necesita Python 3 para funcionar."
    exit 1
fi

# ── Comprobar si el servidor ya está activo ───────────────────────
server_running() {
    curl -s --max-time 2 "$URL" > /dev/null 2>&1
}

# ── Instalar LaunchAgent (primera vez o si fue eliminado) ─────────
install_launch_agent() {
    if [ ! -f "$PLIST_DEST" ] && [ -f "$PLIST_TEMPLATE" ]; then
        mkdir -p "$HOME/Library/LaunchAgents"
        sed \
            -e "s|REPO_PATH_PLACEHOLDER|$DASHBOARD_DIR|g" \
            -e "s|/usr/bin/python3|$PYTHON_PATH|g" \
            "$PLIST_TEMPLATE" > "$PLIST_DEST"
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
        launchctl load "$PLIST_DEST" 2>/dev/null || true
        return 0  # primer arranque
    fi
    return 1  # ya estaba instalado
}

# ── Arrancar servidor manualmente ────────────────────────────────
start_server() {
    # Verificar que el puerto no esté ocupado por otro proceso
    if lsof -i ":$PORT" -sTCP:LISTEN &>/dev/null 2>&1; then
        # El puerto está en uso pero el server no respondió a curl → proceso zombie
        local pid
        pid=$(lsof -ti ":$PORT" -sTCP:LISTEN 2>/dev/null | head -1)
        if [ -n "$pid" ]; then
            show_error "⚠️ El puerto $PORT está ocupado por otro proceso (PID $pid).\n\nCierra ese proceso e intenta de nuevo."
            exit 1
        fi
    fi

    # Arrancar servidor en background
    nohup "$PYTHON_PATH" -m http.server "$PORT" --bind 127.0.0.1 \
        --directory "$DASHBOARD_DIR" \
        > /tmp/apg-dashboard.log 2> /tmp/apg-dashboard-error.log &
    echo $! > /tmp/apg-dashboard.pid

    # Esperar a que responda (hasta 10 segundos)
    for i in $(seq 1 10); do
        sleep 1
        if server_running; then
            return 0
        fi
    done
    return 1
}

# ── Flujo principal ───────────────────────────────────────────────
FIRST_LAUNCH=false

if server_running; then
    # Servidor ya activo → solo abrir Safari
    open -a Safari "$URL"
    exit 0
fi

# Servidor no activo → arrancar
if ! start_server; then
    show_error "⚠️ No se pudo arrancar el servidor del dashboard.\n\nRevisa /tmp/apg-dashboard-error.log para más detalles."
    exit 1
fi

# Instalar LaunchAgent si es necesario
if install_launch_agent; then
    FIRST_LAUNCH=true
fi

# Abrir Safari
open -a Safari "$URL"

# Mostrar mensaje de bienvenida en primer arranque
if [ "$FIRST_LAUNCH" = true ]; then
    sleep 1
    show_dialog "✅ Panel APG instalado correctamente.\n\nEl dashboard se abrirá automáticamente cada vez que enciendas el Mac."
fi

exit 0
LAUNCHER

chmod +x "$APP_PATH/Contents/MacOS/launcher"
echo "✅ Launcher creado"

# ── 7. Crear el .dmg ──────────────────────────────────────────────
echo ""
echo "💿 Generando ${DMG_NAME}..."

# Crear un symlink a /Applications en staging
ln -sf /Applications "$STAGING_DIR/Applications"

# Calcular tamaño necesario (en MB, con margen)
APP_SIZE_KB=$(du -sk "$APP_PATH" | cut -f1)
DMG_SIZE_MB=$(( (APP_SIZE_KB / 1024) + 30 ))
[ "$DMG_SIZE_MB" -lt 50 ] && DMG_SIZE_MB=50

# Crear DMG temporal (lectura/escritura)
DMG_TEMP="$DIST_DIR/_tmp_${APP_NAME}.dmg"
hdiutil create \
    -volname "$VOLUME_NAME" \
    -srcfolder "$STAGING_DIR" \
    -ov \
    -format UDRW \
    -size "${DMG_SIZE_MB}m" \
    "$DMG_TEMP" \
    > /dev/null 2>&1

# Comprimir a DMG final
hdiutil convert \
    "$DMG_TEMP" \
    -format UDZO \
    -o "$DMG_PATH" \
    > /dev/null 2>&1

rm -f "$DMG_TEMP"

# ── 8. Limpiar staging ────────────────────────────────────────────
rm -rf "$STAGING_DIR" "$ICONSET_DIR" "$DIST_DIR/icon_base.png" 2>/dev/null || true

# ── 9. Resultado ──────────────────────────────────────────────────
echo ""
if [ -f "$DMG_PATH" ]; then
    DMG_SIZE=$(du -sh "$DMG_PATH" | cut -f1)
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║  ✅ Instalador generado correctamente                ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    echo "   📦 Archivo: $DMG_PATH"
    echo "   💾 Tamaño:  $DMG_SIZE"
    echo ""
    echo "   Pasos para instalar en el Mac de trabajo:"
    echo "   1. Copia Panel APG.dmg al otro Mac (AirDrop, USB, etc.)"
    echo "   2. Abre el .dmg y arrastra 'Panel APG' a Aplicaciones"
    echo "   3. Abre Panel APG desde Launchpad o Finder"
    echo "   4. ✅ Listo — el dashboard se abrirá automáticamente al"
    echo "      encender el Mac"
    echo ""
    # Abrir Finder en la carpeta dist/
    open "$DIST_DIR"
else
    echo "❌ Error: no se generó el .dmg"
    exit 1
fi
