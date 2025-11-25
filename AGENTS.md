# AGENTS

1. Python: use `uv run` (or `pip install -e .[dev,test]` then `pytest`). Run all tests with `uv run pytest` and a single test with `uv run pytest tests/unit/test_pdf_router.py -k test_name`.
2. Backend app: start with `uv run uvicorn pdf_reader.backend.app:app --reload` from `src/` parent.
3. Linting: always run `uv run ruff check .` for Python files you touch; fix issues with `uv run ruff check . --fix` when safe.
4. Node/React frontend: install in `src/pdf_reader/frontend` using `npm install` and run `npm run dev` / `npm run build` / `npm test` as defined there.
5. Pyproject: respect `tool.ruff` (line length 120, target-version py39, rules E,F,I,N,W); keep imports sorted and unused imports removed.
6. Python types: use modern Python 3 syntax (`list`, `dict`, `str`, `float` etc.), and define optionals as `name: type | None = None`.
7. Python style: prefer explicit, typed function signatures; avoid one-letter variable names except for obvious indexes.
8. Error handling: catch only specific exceptions where possible; log with `logging` (using existing module loggers) and return FastAPI `HTTPException` with clear `detail` for API errors.
9. Logging: keep `logging.basicConfig` consistent with existing configuration and avoid changing global logging behavior unless explicitly requested.
10. FastAPI: follow existing router patterns (APIRouter, dependency injection in `dependencies.py`, schemas in `schemas/*`); keep request/response models in `schemas`.
11. File layout: keep backend Python inside `src/pdf_reader/backend` and frontend TS/TSX inside `src/pdf_reader/frontend/src`; do not create new top-level packages without need.
12. Testing: place new tests under `tests/unit`; use `pytest` markers (`unit`, `integration`, `slow`) consistently with `pytest.ini`.
13. Test style: favor clear, small tests; access the FastAPI app via existing fixtures in `tests/conftest.py`.
14. CLAUDE.md: never use any kind of emoji in code, docs, or messages.
15. External libraries: when adding a non-standard dependency, look up the latest stable version and skim its latest docs before use; prefer editing `pyproject.toml` / frontend `package.json` accordingly.
16. For every Python file you add or modify, run ruff and fix reported issues before finishing.
17. TypeScript/React: use functional components with hooks and existing store patterns (e.g. `useAppStore`); prefer named exports where consistent, and keep JSX and CSS class names aligned with current files.
18. Formatting: keep indentation and quoting style consistent with nearby code (Python uses 4 spaces, TS/TSX generally uses double quotes and semicolons where present).
19. Do not add license or copyright headers.
20. Prefer minimal, focused changes aligned with existing patterns; avoid large refactors unless explicitly requested.