# Oficinas & Arrendamientos

Dashboard interno para dar seguimiento a oficinas, arrendamientos, pagos, vigencias y tickets de servicios generales. Los datos se leen en vivo desde Google Sheets.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Google Sheets API (`googleapis`) como fuente de datos
- Vitest para pruebas de la capa de dominio

## Estructura

El proyecto sigue una separación por capas (Clean Architecture):

- `src/domain/entities` — modelos de negocio (`Office`, `Ticket`).
- `src/domain/usecases` — reglas de negocio puras, sin dependencias de framework (filtrado, agregaciones, matching oficina-ticket, formateo). Es la capa con cobertura de pruebas.
- `src/data` — acceso a datos (cliente de Google Sheets, repositorios, parsers).
- `src/app` — páginas (App Router) y rutas de API que orquestan usecases + repositorios.
- `src/components` — componentes de UI compartidos entre páginas.

## Páginas

- `/resumen` — panorama general de oficinas.
- `/tickets` — analítica de tickets de servicios generales.
- `/pagos` — calendario de pagos y estado de facturación.
- `/vigencias` — línea de tiempo (Gantt) de vigencias de contratos.
- `/contratos` — tabla completa de contratos con filtros, orden y paginación.
- `/ficha` — búsqueda y ficha detallada por oficina, incluyendo tickets asociados.

## Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `TICKET_ASIGNADO_FILTRO` — nombre exacto (columna "Asignado A") por el que se filtran los tickets mostrados en la app.
- `GEMINI_API_KEY` — API key gratuita de Google AI Studio, usada para sugerir la categoría de tickets marcados como "OTRO".
- `GEMINI_MODEL` — opcional, modelo de Gemini a usar (por defecto `gemini-2.0-flash`).

Ninguna de estas variables debe subirse al repositorio.

El service account de Google necesita permiso de **Editor** (no solo Viewer) sobre el spreadsheet, ya que la corrección de categoría escribe en la hoja "Datos Tickets". Esa hoja debe tener una columna con el encabezado exacto `Categoría Corregida`.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Pruebas

```bash
pnpm test
```
