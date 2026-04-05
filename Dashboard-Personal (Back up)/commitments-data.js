/**
 * COMMITMENTS DATA — Plan de Negocio Q3 FY26
 *
 * Cómo usar este archivo:
 * - valorAnterior: rellena con el dato real del quarter anterior (fuente: reporting Apple)
 * - valorActual:   actualiza cada semana con el dato real del quarter en curso
 * - target:        objetivo del quarter marcado en el plan de negocio
 *
 * Para añadir un nuevo quarter (ej: Q4-FY26):
 * 1. Copia el bloque "Q3-FY26" completo
 * 2. Cambia la clave, titulo, periodo y semanas
 * 3. Actualiza periodoAnterior/periodoActual en cada KPI
 * 4. Pon activo: false en el quarter anterior y activo: true en el nuevo
 * 5. Añade una nueva entrada en QUARTERS_CONFIG (más abajo en este archivo)
 */

// Guía de campos de cada KPI:
// valorAnterior: valor del periodo comparativo (ej: Q2 26 o Q3 25) — benchmark de referencia
// valorActual:   valor real del periodo actual (Q3 26) — actualizar durante el quarter
// target:        objetivo del quarter (si lo hay); null si no hay objetivo definido
// unidad:        "%" para porcentajes, "" para valores absolutos

const QUARTERS_CONFIG = [
  {
    key:     'Q3-FY26',
    label:   'Q3 FY26',
    titulo:  'EMEIA Q3 FY26 Overview',
    periodo: 'Marzo – Junio 2026',
    semanas: 13,
    activo:  true
  },
  {
    key:     'Q4-FY26',
    label:   'Q4 FY26',
    titulo:  'EMEIA Q4 FY26 Overview',
    periodo: 'Julio – Septiembre 2026',
    semanas: 13,
    activo:  false
  },
  {
    key:     'Q1-FY27',
    label:   'Q1 FY27',
    titulo:  'EMEIA Q1 FY27 Overview',
    periodo: 'Octubre – Diciembre 2026',
    semanas: 13,
    activo:  false
  }
];

const COMMITMENTS_DATA = {
  "Q3-FY26": {
    titulo: "Plan de Negocio Q3 FY26",
    periodo: "Marzo - Junio 2026",
    semanas: 13,
    activo: true, // quarter en curso
    areas: [
      {
        id: "impulsar-crecimiento",
        titulo: "Impulsar el crecimiento",
        descripcion: "Planificando el crecimiento, creando propietarios y entablando relaciones.",
        color: "#4a9d6f",
        subcategorias: [
          { nombre: "Planificar el crecimiento", descripcion: "Los Managers se aseguran de que haya suficiente personal en todas las zonas para satisfacer la demanda de los clientes y fomentar el desarrollo del equipo." },
          { nombre: "Crear propietarios", descripcion: "Los equipos se acercan activamente a todos los clientes, utilizan Conectar y Personalizar al principio de la conversación y les presentan soluciones adaptadas a sus necesidades." },
          { nombre: "Entablar relaciones", descripcion: "Todo el equipo de la tienda pone de su parte para aumentar el número de Introducciones de Business y crear vínculos entre los clientes de empresa y Apple." }
        ],
        kpis: [
          // periodoAnterior: "Q2 26" → comparativo secuencial (quarter anterior)
          { id: "customer-impacting", nombre: "Customer-Impacting Actual % to Guidance", subcategoria: "Planificar el crecimiento", periodoAnterior: "Q2 26", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          // periodoAnterior: "Q3 25" → comparativo YoY (mismo quarter año anterior)
          { id: "timely-assistance", nombre: "Timely Assistance", subcategoria: "Crear propietarios", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "", target: null },
          { id: "dropin-conversion", nombre: "Drop-In Conversion YoY %", subcategoria: "Crear propietarios", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          { id: "geniusbar-conversion", nombre: "Genius Bar: Conversion %", subcategoria: "Crear propietarios", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          { id: "first-account", nombre: "First Account Purchase / Day", subcategoria: "Entablar relaciones", periodoAnterior: "Q2 26", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "", target: null }
        ],
        otrosIndicadores: [
          "NPS: Solution Recommended %",
          "Connect and Personalize Usage %",
          "AppleCare and Accessory Attach %",
          "Genius Bar y Product Zone: Intros per 1k",
          "Empresas: Pipeline Creation / Conversion, Account Bookings YoY"
        ],
        acciones: []
      },
      {
        id: "experiencias-apple",
        titulo: "Ofrecer experiencias que solo se dan en Apple",
        descripcion: "Haciendo demos en cualquier momento y recomendando lo mejor de Apple.",
        color: "#4a9d6f",
        subcategorias: [
          { nombre: "Demos", descripcion: "Todos los puestos ofrecen activamente demos personalizadas a todos los clientes y les dan más motivos para comprar." },
          { nombre: "Genius Bar", descripcion: "Los equipos de Genius hacen las reparaciones más cerca de los clientes para agilizar el proceso y reducir el impacto medioambiental." },
          { nombre: "Today at Apple", descripcion: "Todos los puestos dan a conocer las sesiones de Today at Apple del día para ayudar a los clientes a descubrir, comprar y disfrutar la oferta de Apple." }
        ],
        kpis: [
          // periodoAnterior: "Q3 25" → comparativo YoY (mismo quarter año anterior)
          { id: "nps-shared-feature", nombre: "NPS: Shared a Feature %", subcategoria: "Demos", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          { id: "nps-interactive-demo", nombre: "NPS: Interactive Demo %", subcategoria: "Demos", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          // periodoAnterior: "Q2 26" → comparativo secuencial (quarter anterior)
          { id: "mac-instore-repair", nombre: "Mac: In-Store Repair %", subcategoria: "Genius Bar", periodoAnterior: "Q2 26", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          { id: "delivered-dropin", nombre: "Delivered % (Drop-In)", subcategoria: "Today at Apple", periodoAnterior: "Q3 25", periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null }
        ],
        otrosIndicadores: [
          "NPS: Product Comparison %",
          "Discussed Apple Intelligence %",
          "Store Presentation Review % Completion",
          "Genius Bar: Likelihood to Recommend",
          "Mac Next Day %",
          "NPS: Discussed Today at Apple %",
          "Delivered % (Bookable)"
        ],
        acciones: []
      },
      {
        id: "equipos-formacion",
        titulo: "Dar a los equipos lo que necesitan",
        descripcion: "Mediante la formación, la activación del rendimiento y Pulse.",
        color: "#4a9d6f",
        subcategorias: [
          { nombre: "Training", descripcion: "Los Managers se encargan de que se completen las formaciones para que los equipos puedan alcanzar la excelencia." },
          { nombre: "Activación del rendimiento", descripcion: "Los Managers usan activamente los comportamientos de Fundamentos de Leadership para tener conexiones más relevantes." },
          { nombre: "Pulse", descripcion: "Los Managers inculcan una mentalidad de equipo mediante la colaboración y la comunicación de los planes de acción a todos los puestos." }
        ],
        kpis: [
          // periodoAnterior: null → sin comparativo definido para este KPI
          { id: "training-completion", nombre: "New Required (<30 Days) Training Completion Rate %", subcategoria: "Training", periodoAnterior: null, periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null },
          { id: "coach-connections", nombre: "Coach Connections por persona del equipo cada 31 días", subcategoria: "Activación del rendimiento", periodoAnterior: null, periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "", target: null },
          { id: "pulse-action-plan", nombre: "Stores Pulse Action Plan Completion %", subcategoria: "Pulse", periodoAnterior: null, periodoActual: "Q3 26", valorAnterior: null, valorActual: null, unidad: "%", target: null }
        ],
        otrosIndicadores: [
          "Required (>30 Days) Training Completion Rate %",
          "Conversation Value %",
          "Feedback Impact %",
          "Recognition % según Pulse",
          "Planes de acción de Pulse responden al feedback de la encuesta y demuestran el progreso"
        ],
        acciones: []
      }
    ]
  }
};
