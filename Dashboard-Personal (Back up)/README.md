# 📊 Dashboard Personal — Apple Passeig de Gràcia

## 🚀 Instalación permanente (recomendado)

Para que el icono del Dock funcione directamente sin abrir Terminal:

1. **Doble clic en `instalar-launch-agent.command`**
2. Si macOS pregunta, confirma en **Ajustes del Sistema → Privacidad y Seguridad**
3. ¡Listo! El servidor arrancará automáticamente cada vez que inicies sesión

> Después de instalarlo, el icono del Dock funciona directamente, sin necesidad de ejecutar nada más.

Para desinstalar: doble clic en `desinstalar-launch-agent.command`

---

## ▶️ Inicio manual (sin instalación permanente)

Si prefieres no instalar el Launch Agent:

1. Doble clic en `iniciar.command`
2. Safari se abre en `http://localhost:8080`
3. Safari → Archivo → Añadir al Dock

---

Panel de gestión personal para **Store Leader de Apple Passeig de Gràcia**. Una aplicación web completa (PWA) que funciona 100% en el navegador, sin backend, con persistencia en `localStorage`.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)

---

## 🧩 Funcionalidades principales

### 📊 KPIs de tienda
- Seguimiento de métricas clave: Ventas, NPS, DTA, Conversión, UPT, AppleCare, Accesorios, GBR
- Comparativas YoY (año anterior) y WoW (semana anterior) con badges automáticos
- Barras de progreso visuales hacia objetivo
- 📷 **OCR**: importa KPIs directamente desde una captura de pantalla usando Tesseract.js
- Histórico de snapshots con contexto

### ✅ Gestión de tareas
- Tareas con prioridades (Alta, Media, Baja) y estados
- **Matriz de Eisenhower** (Urgente/Importante) para priorización visual
- Filtros por estado y prioridad
- Edición inline

### 📅 Agenda y reuniones
- Vista semanal tipo Google Calendar con cuadrícula horaria 07:00–22:00
- Drag & drop visual con snap a 15 minutos
- Eventos recurrentes automáticos (reuniones de tienda, 1:1, etc.)
- Exportación de eventos en formato `.ics` (compatible con Calendario de Apple y Google Calendar)

### 👥 Gestión de equipo
- Ficha de cada miembro con semáforo de 1:1, PDI y etiquetas
- **Tablero Kanban** por persona
- TB (Team Builder) sessions
- Reconocimientos y **Scoreboard** del equipo

### 💬 Feedback SBI
- Registro de feedback estructurado con el modelo **Situación-Comportamiento-Impacto**
- Historial completo por persona

### 🌟 Voz del Cliente y Wow Moments
- Registro de verbatims y momentos destacados
- Vínculo con los valores de Apple

### 📝 Actas de reuniones
- Generación de actas con asistentes, puntos tratados y acciones
- Envío por email con `mailto:` precompletado
- Exportación en formato `.ics`

### 🌅 Smart Briefing matutino
- Resumen diario automático con KPIs, tareas pendientes y agenda del día
- Frases de motivación

### 🎯 Modo Focus y timer Pomodoro
- Bloqueo de navegación para concentrarse en una sola sección
- Timer Pomodoro integrado (25/5 min)

### 🔍 Spotlight Search
- Búsqueda global en tareas, reuniones, notas y equipo

### 📊 Weekly Routine
- Flujo guiado de 5 pasos para preparar y cerrar la semana

### 📆 Leadership Schedule
- **Vacaciones**: tabla visual con datos 2025 y 2026 de todos los managers/leads
- **Devolución de Festivos**: estado de devolución de festivos por persona con barra de progreso
- **Peticiones & Tareas**: tablero para gestionar solicitudes de los managers

### 🎨 Personalización
- Tema **claro / oscuro**
- Colores de acento personalizables
- Modo snapshot para compartir vistas

### 💾 Persistencia
- **100% localStorage**: todos los datos se guardan en el navegador, sin servidor ni backend
- Funciones de **export/import JSON** para hacer backups manuales
- Snapshots compartibles via URL

### 📱 PWA instalable
- Funciona **offline** gracias al Service Worker
- Instalable en macOS, iOS, Android y Windows desde el navegador

---

## 📁 Estructura de archivos

```
Dashboard-Personal/
├── index.html          # Página de entrada / menú principal
├── dashboard.html      # Aplicación principal (estructura HTML completa)
├── dashboard.js        # Toda la lógica de la aplicación
├── dashboard.css       # Estilos completos
├── sw.js               # Service Worker (caché offline)
├── manifest.json       # Configuración PWA
├── icon.svg            # Icono de la app
├── commitments-data.js # Datos de Commitments Q
├── config.example.js   # Plantilla de configuración (copiar a config.js)
└── config.js           # Configuración local con datos del equipo (NO se sube al repo)
```

---

## 🚀 Instalación y uso

La aplicación es completamente estática — no necesita ningún servidor ni instalación de dependencias.

### Opción 1 — Abrir directamente
Abre `index.html` directamente en el navegador. (Algunas funciones pueden requerir servidor local por restricciones de seguridad del navegador.)

### Opción 2 — Servidor local simple
Sirve los archivos desde un servidor HTTP local (recomendado):
```bash
# Con Python
python3 -m http.server 8080
# O con Node.js
npx serve .
```
Luego abre `http://localhost:8080` en el navegador.

### Opción 3 — PWA instalable
1. Sirve el proyecto desde `localhost` o un servidor HTTPS.
2. En el navegador, busca el icono de instalación en la barra de direcciones.
3. Instala la app — funcionará como una aplicación nativa con soporte offline.

### Configuración del equipo
1. Copia `config.example.js` a `config.js` y edítalo con los datos reales del equipo (nombres, emails).
2. El archivo `config.js` está en `.gitignore` y **no se sube al repositorio**.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la aplicación |
| CSS3 | Estilos, temas y animaciones |
| JavaScript (ES6+) | Lógica completa de la app |
| Service Worker | Caché offline y PWA |
| localStorage | Persistencia de datos |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | OCR para importar KPIs desde imagen |
| Web App Manifest | Configuración PWA instalable |

---

## ⚠️ Notas sobre los datos

- Todos los datos se guardan en **`localStorage`** del navegador.
- Limpiar el caché del navegador puede suponer pérdida de datos — **usa la función de exportar JSON periódicamente** para hacer backups.
- Si cambias de navegador o de dispositivo, importa el backup en el nuevo entorno.
- Los backups se guardan como un archivo `.json` que puedes reimportar en cualquier momento.

---

## 👤 Autor

**Diego Rivero**  
Store Leader — Apple Passeig de Gràcia
