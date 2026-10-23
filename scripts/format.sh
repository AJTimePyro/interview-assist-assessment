cd backend && uv run ruff check --fix . && uv run ruff format .
cd ..
cd frontend && npm run lint:fix
cd ..
