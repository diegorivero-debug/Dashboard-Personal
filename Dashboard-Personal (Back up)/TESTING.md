# 🧪 Smoke Tests — Dashboard Personal

> **Objetivo:** Verificar que las funciones críticas siguen funcionando antes de mergear cualquier PR.
> **Tiempo estimado:** 10-15 minutos. Ejecutar en un navegador moderno (Chrome o Safari).

---

## ⚙️ Cómo ejecutar los tests

1. Abrir `index.html` en Chrome o Safari
2. Abrir **DevTools → Console** (F12) — asegurarse de que **no hay errores rojos**
3. Seguir el checklist sección por sección
4. Para el test offline: DevTools → Application → Service Workers → activar checkbox **"Offline"**

---

## ✅ Checklist de smoke tests

### 🏠 Carga y navegación

- [ ] `index.html` carga sin errores en consola
- [ ] Las 5 tarjetas de navegación abren su sección correctamente
- [ ] El modal de **Ajustes** abre y cierra
- [ ] El **tema claro/oscuro** se aplica y persiste al recargar (F5)

---

### 📊 Negocio & Resultados (`?seccion=negocio`)

- [ ] Los KPIs se pueden introducir y guardar
- [ ] El historial de KPIs muestra las semanas anteriores
- [ ] El gráfico de comparativa renderiza sin errores
- [ ] La **Weekly Routine** carga y permite avanzar pasos

---

### 👥 Equipo & Desarrollo (`?seccion=equipo`)

- [ ] La lista del equipo de liderazgo se muestra
- [ ] Se puede crear/editar un **feedback SBI**
- [ ] Las conversaciones **TB/1:1** cargan
- [ ] El **Pulse Check** funciona
- [ ] El **Leadership Index** carga y permite evaluar métricamente al equipo

---

### 🛍️ Cliente & Experiencia (`?seccion=cliente`)

- [ ] Los verbatims / **Voz del Cliente** cargan
- [ ] Se puede añadir un nuevo verbatim

---

### 🗂️ Operativa & Gestión (`?seccion=operativa`)

> ⚠️ Esta sección se perdió en los PRs #85/#86 y hubo que restaurarla dos veces (#88, #95). Verificar con especial atención.

- [ ] Las **Reuniones** cargan correctamente
- [ ] Las **Actas** cargan correctamente
- [ ] Se puede crear una **tarea nueva**
- [ ] La **Agenda** muestra la semana actual
- [ ] Las **Notas** se pueden guardar

---

### 📅 Leadership Schedule (`?seccion=leadership`)

- [ ] La sección carga sin errores
- [ ] Se pueden ver/añadir entradas de **vacaciones y festivos**

---

### 💾 Persistencia y PWA

- [ ] Los datos guardados **persisten tras recargar la página** (F5)
- [ ] La app **funciona offline** (desconectar red → recargar)
- [ ] El indicador de almacenamiento en Ajustes muestra datos reales (no "Calculando...")
- [ ] El **export de backup** genera un archivo JSON válido
- [ ] El **import de backup** restaura los datos correctamente

---

## 🔍 Checklist pre-merge

Antes de abrir un PR, responde estas preguntas:

- [ ] ¿El PR toca una sola área funcional? *(si toca más de 3 archivos no relacionados, considera dividirlo)*
- [ ] ¿Has ejecutado los smoke tests de las secciones afectadas?
- [ ] ¿Has comprobado que **no hay errores en la consola** del navegador?
- [ ] ¿Necesita actualizarse `CACHE_NAME` en `sw.js`? *(cualquier cambio en JS/CSS/HTML requiere bump de versión)*

---

## 📋 Historial de regresiones conocidas

| PR | Problema | Causa raíz |
|----|----------|------------|
| #72 → revertido en #77 | Megacommit con múltiples áreas rompió funcionalidad | PR demasiado grande |
| #85 / #86 | Split en ES modules eliminó las tabs de Reuniones y Actas | Refactoring sin verificar todas las tabs |
| #88, #95 | Restauración repetida de Reuniones & Actas | Falta de smoke test post-merge |
