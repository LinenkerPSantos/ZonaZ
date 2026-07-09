# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web service for **Zona-Z**, a tabletop RPG (Portuguese-language content). The site presents the game's 7-page rulebook (world/lore, mechanics, backgrounds/talents, equipment, GM guide, creatures, complements) plus an interactive character builder. Source content lives in `.docx` files under `Database/`; the backend parses/serves them, the frontend renders them.

Two independent apps, run separately:
- `backend/` — Flask API (Python)
- `frontend/` — React 19 + Vite SPA

## Common Commands

### Backend (from `backend/`)
```
python -m venv venv && venv\Scripts\activate.bat   # first time only (Windows)
pip install -r requirements.txt
python run.py                                       # runs Flask dev server on :5000
python import_to_db.py                              # import all 7 pages' docx content into zona_z.db
python import_to_db.py 5                             # import only page 5
```
There is no test suite or linter configured for the backend.

### Frontend (from `frontend/`)
```
npm install
npm run dev        # Vite dev server on :3000, proxies /api to :5000 (see vite.config.js)
npm run build
npm run preview
```
There is no test suite or linter configured for the frontend.

### One-shot startup (Windows)
`_StartProject/start-all.bat` launches backend and frontend each in their own `cmd` window (calls `start-backend.bat` / `start-frontend.bat`, which create the venv / run `npm install` on first run).

## Architecture

### Content pipeline: docx → JSON → API → React

The rulebook content originates in `.docx` files in `Database/` (e.g. `Mecânica.docx`, `Antecentens.docx`, `Equipamentos.docx`, `Guia do Mestre.docx`, `Ameaças.docx`, `Complementos.docx`, `Talentos.docx`). Each page has a corresponding service in `backend/app/services/paginaN_service.py` (N=1-7) that either:
- returns hand-authored static JSON (page 1 — `pagina1_service.py`), or
- calls `docx_parser.parse_docx(filename)` to walk the document body and build a nested JSON tree, then wraps it with page metadata (title, subtitle, image paths, nav) — pages 2-7.

`docx_parser.py` is the core of the pipeline:
- Walks `doc.element.body` XML directly (not `doc.paragraphs`) so it can interleave tables in document order.
- Buckets paragraphs into a `Heading 2 → Heading 3 → Heading 4` tree (`capitulo → secao → subsecao`), each carrying a `conteudo` list of classified entries.
- `_classify_paragraph` recognizes a fixed set of inline tags from the source docs and turns each into a typed entry (`{'texto', 'estilo', 'tipo'}`). These tags are authored directly in the Word documents by the content writer and **must** be preserved when editing `Database/*.docx`:
  - `(Marcador)` → badge (`tipo: marcador`)
  - `(card)` … `(card-fim)`, or bracketed `[(card)` / `]` → card block
  - `(introdução)` → intro text with side bar
  - `(subtitulo)` / bracketed `[(subtitulo)` … `]` → section header / grouped items
  - `(Anotação)` → sticky-note style callout
  - `(importante destacar - I)` … `(I - fim)`, or inline `<strong>`/`<s trong>` typos → bold-red highlight (`<hl>` tags), handled by `_process_highlight_tags`
  - `(Titulo de Sobrevivência)` … `(Titulo de Sobrevivência - Fechamento)` → grouped "survival title" restriction blocks
  - `IMAGEM PARA FUNDO – nome` → background image reference
  - `[(Table)` … `]` → a docx table is parsed into `{headers, rows}` via `_parse_table_element`
  - Leading numeric prefixes on headings (e.g. `2.1.`) are stripped by `strip_numbering` — chapter numbering must never reach the frontend.
- `talentos_parser.py` is a second, more bespoke parser layered on top of `parse_docx` output specifically for `Talentos.docx` (talents have a denser, less tag-driven structure: name/type/effect lines inferred heuristically).
- `get_section_nav` / `slugify` build the sidebar navigation tree (used for scroll-to-anchor behavior on the frontend).

### API surface (`backend/app/api/`)

- `routes.py`: `GET /api/pagina/<1-7>` — tries SQLite (`db_service.get_pagina_from_db`) first, falls back to the live docx-parsing service if the DB has no row for that page. `GET /api/img/<path>` serves images from `Database/img/` (`config/settings.py: IMG_DIR`).
- `character_builder.py`: `GET /api/builder/data` — assembles character-creation reference data (backgrounds, talents, skill categories, survival titles, and fixed game-balance constants like starting attribute points/HP/AC) by reading from `pagina3_service`. This is where core character-creation rules constants live if they need tuning.
- Both blueprints are registered in `app/__init__.py` (`create_app`); `api_bp` under `/api`, `builder_bp` with routes already prefixed `/api/builder`.

### SQLite as a build cache, not a live database

`zona_z.db` (single table `paginas(numero, nome, dados JSON, atualizado_em)`) is a pre-rendered cache of each page service's JSON output, produced by running `import_to_db.py`. In dev, `routes.py` prefers the DB but silently regenerates from docx if a page is missing — so the DB can be stale without breaking anything locally. **After editing any `Database/*.docx` file, rerun `import_to_db.py`** so production (which is expected to ship only `zona_z.db`, not the docx sources) picks up the change.

### Frontend structure (`frontend/src/`)

- `App.jsx` wires up `react-router-dom` routes, one per rulebook page (`/`, `/mecanicas`, `/antecedentes`, `/equipamentos`, `/guia-mestre`, `/ameacas`, `/complementos`) plus `/ficha` and `/criar-personagem` for the character sheet/builder.
- Each `pages/PaginaNXxx.jsx` fetches its own data client-side via `fetch('/api/pagina/N')` on mount (no shared data layer/store) and renders it, paired with a co-located `.css` file (no CSS modules/styled-components — plain global-ish class names scoped by page prefix, e.g. `p3-*` for page 3).
- Page components branch rendering behavior on the `tipo` field emitted by the backend parser (`marcador`, `introducao`, `card`, etc.) — when adding a new docx tag, both `docx_parser.py`'s `_classify_paragraph` *and* the consuming page component's render switch need updating together.
- Images are always requested through the backend (`/api/img/<path>`), never bundled into the frontend.
- Vite dev server proxies `/api/*` to `http://localhost:5000` (`vite.config.js`) — the frontend must be run alongside the backend for data to load.

## Content rules (see `Instruções do Site.md` for the full page/section outline)

- Never render chapter/section numbering (e.g. `2.1.`, `3.2.1.`) in the UI — it's stripped server-side by `strip_numbering`, so if numbering leaks through, the bug is almost always a new heading style or tag pattern the parser doesn't recognize yet, not a frontend issue.
- Never render raw image-reference placeholders (e.g. `Img – pg01`) from the source docs.
- Items sharing the same `(Titulo de Sobrevivência)` value must be grouped under one shield-icon (🛡️) group header, not repeated per item.
- Sidebar section clicks scroll to the section's anchor, not to the top of the page.
