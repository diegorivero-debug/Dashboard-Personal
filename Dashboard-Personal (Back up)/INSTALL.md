# 🛠️ Guía de Instalación y Desinstalación — Panel APG

> **Panel de Gestión Personal — Apple Passeig de Gràcia**
> Última actualización: abril 2026

---

## 📋 Requisitos previos

| Requisito | Detalle |
|---|---|
| **macOS** | 12.3 Monterey o superior |
| **Python 3** | Viene preinstalado en macOS 12.3+. Compruébalo con: `python3 --version` |
| **Safari** | Recomendado. También funciona en Chrome/Edge (con más funciones de Box sync) |
| **Git** | Para clonar el repositorio. Compruébalo con: `git --version` |

---

## 🚀 INSTALACIÓN

### Paso 1 — Clonar el repositorio

Abre **Terminal** (`⌘ + Espacio` → escribe "Terminal") y ejecuta:

```bash
cd ~/Desktop
git clone https://github.com/diegorivero-debug/Dashboard-Personal.git
```

### Paso 2 — Entrar en la carpeta del proyecto

```bash
cd ~/Desktop/Dashboard-Personal/"Dashboard-Personal (Back up)"
```

### Paso 3 — Instalar el Launch Agent

```bash
bash instalar-launch-agent.command
```

Esto hace tres cosas automáticamente:
1. ✅ Instala un **Launch Agent** que arranca el servidor web en `localhost:8080`
2. ✅ El servidor se inicia **automáticamente** cada vez que enciendes el Mac
3. ✅ Abre Safari en `http://localhost:8080`

### Paso 4 — Añadir al Dock

Una vez Safari se abra:

1. Ve a **Safari → Archivo → Añadir al Dock** (o `⌘⇧D` en Safari 17+)
2. Dale nombre: **Panel APG**
3. Haz clic en **Añadir**

> 🎉 **¡Listo!** El icono aparecerá en tu Dock. Púlsalo para abrir el dashboard en cualquier momento.

### Paso 5 (Opcional) — Configurar el equipo

```bash
cp config.example.js config.js
```

Edita `config.js` con los datos reales del equipo. Este archivo **no se sube al repositorio** (está en `.gitignore`).

---

## 🔄 ACTUALIZAR A LA ÚLTIMA VERSIÓN

Cuando haya cambios en el repositorio:

```bash
cd ~/Desktop/Dashboard-Personal
git pull origin main
```

Luego recarga el dashboard en Safari (`⌘R`). El Service Worker detectará la nueva versión y actualizará el caché automáticamente.

> **Si no ves los cambios**, fuerza la actualización:
> Safari → **Menú Desarrollo → Vaciar cachés** (`⌥⌘E`) y luego `⌘⇧R`

---

## 🗑️ DESINSTALACIÓN COMPLETA

### Paso 1 — Parar el servidor y quitar el Launch Agent

```bash
bash ~/Desktop/Dashboard-Personal/"Dashboard-Personal (Back up)"/desinstalar-launch-agent.command
```

Esto:
- ✅ Para el servidor de `localhost:8080`
- ✅ Elimina el arranque automático al iniciar sesión

### Paso 2 — Quitar del Dock

1. **Clic derecho** en el icono de Panel APG en el Dock
2. **Opciones → Eliminar del Dock**

### Paso 3 — Limpiar caché del Service Worker en Safari

1. Safari → **Menú Desarrollo → Vaciar cachés** (`⌥⌘E`)
2. Safari → **Preferencias → Privacidad → Gestionar datos de sitios web**
3. Busca `localhost` → **Eliminar**

> ℹ️ Si no ves el menú "Desarrollo", actívalo en: Safari → Preferencias → Avanzado → ✅ "Mostrar menú Desarrollo en la barra de menús"

### Paso 4 (Opcional) — Borrar datos de localStorage

Si quieres empezar completamente de cero sin ningún dato anterior:

1. Abre Safari → `http://localhost:8080` (antes de parar el servidor)
2. Inspector Web (`⌥⌘I`) → pestaña **Almacenamiento**
3. **Almacenamiento local** → clic derecho → **Borrar**

> ⚠️ **Atención**: Esto elimina TODOS tus datos (KPIs, tareas, equipo, notas, etc.). Haz un backup primero con el botón 💾 del dashboard o desde **Ajustes → Exportar backup**.

### Paso 5 (Opcional) — Borrar la carpeta del repositorio

```bash
rm -rf ~/Desktop/Dashboard-Personal
```

---

## 💾 BACKUP DE DATOS

### Antes de desinstalar

Siempre exporta tus datos antes de desinstalar:

1. Abre el dashboard
2. Haz clic en **⚙️ Ajustes** (en index.html) o **💾** (en dashboard.html)
3. Pulsa **📤 Exportar backup**
4. Se descargará un archivo `apg-backup-YYYY-MM-DD.json`

### Después de reinstalar

1. Abre el dashboard recién instalado
2. Ve a **⚙️ Ajustes**
3. Pulsa **📥 Importar backup**
4. Selecciona tu archivo `.json` de backup
5. Confirma la importación → ¡todos tus datos están de vuelta!

---

## 📁 SINCRONIZACIÓN CON BOX

Para mantener tus datos sincronizados entre dispositivos a través de una carpeta de Box:

1. En el dashboard, haz clic en el botón **📁** del header
2. Pulsa **📂 Vincular archivo** y selecciona un archivo `.json` en tu carpeta de Box
3. Usa **⬆️ Exportar a Box** y **⬇️ Importar desde Box** para sincronizar

| Navegador | Comportamiento |
|---|---|
| **Chrome / Edge** | Vinculación persistente — lectura y escritura directa al archivo |
| **Safari / Firefox** | Importar con selector de archivos + exportar como descarga (guardar manualmente en Box) |

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### El servidor no arranca

```bash
# Verifica que Python 3 está instalado
python3 --version

# Comprueba si el servidor está corriendo
curl http://localhost:8080

# Revisa los logs del Launch Agent
cat /tmp/apg-dashboard.log
cat /tmp/apg-dashboard-error.log
```

### El puerto 8080 está ocupado

```bash
# Encuentra qué proceso usa el puerto
lsof -i :8080

# Mátalo si es necesario
kill -9 <PID>
```

### El dashboard no se actualiza tras un `git pull`

1. Safari → **Desarrollo → Vaciar cachés** (`⌥⌘E`)
2. Recarga con `⌘⇧R` (hard reload)
3. Si sigue sin funcionar, desregistra el Service Worker:
   - Safari → Inspector (`⌥⌘I`) → **Almacenamiento → Service Workers** → **Anular registro**

### El icono del Dock no funciona

Probablemente el servidor no está corriendo. Reinstala el Launch Agent:

```bash
cd ~/Desktop/Dashboard-Personal/"Dashboard-Personal (Back up)"
bash instalar-launch-agent.command
```

---

## 📊 Resumen rápido

| Acción | Comando / Paso |
|---|---|
| **Instalar** | `bash instalar-launch-agent.command` |
| **Añadir al Dock** | Safari → Archivo → Añadir al Dock |
| **Actualizar** | `git pull origin main` + recargar Safari |
| **Desinstalar servidor** | `bash desinstalar-launch-agent.command` |
| **Quitar del Dock** | Clic derecho → Opciones → Eliminar del Dock |
| **Backup de datos** | ⚙️ Ajustes → 📤 Exportar backup |
| **Restaurar datos** | ⚙️ Ajustes → 📥 Importar backup |
| **Sync con Box** | Botón 📁 → Vincular archivo |

---

**Diego Rivero** — Store Leader, Apple Passeig de Gràcia
