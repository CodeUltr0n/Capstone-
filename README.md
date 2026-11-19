# Model Context Protocol (MCP) Orchestrator

A **Model Context Protocol (MCP) Orchestrator** with a React control panel and a FastAPI service for registering MCP servers, routing requests to their tools, and saving execution history.

The control panel shows registered MCP servers, tool matching, execution results, and saved request history.

---

## 🎨 Visual Aesthetics & Theme

- **Theme**: Dark Crimson Glass / Ruby Silk Glassmorphism (`#0a0404` deep obsidian base with translucent crimson glass panels)
- **Canvas Waves**: Dynamic interactive glass silk wave background in `AnimatedGlassBackground.jsx`
- **Specular Highlights**: Crisp inset borders (`inset 0 1px 0 rgba(255, 255, 255, 0.25)`) and multi-layer shadows
- **Typography**: Inter & JetBrains Mono via Google Fonts

---

## ✨ Features

- **Universal Control Plane**: Single orchestration layer across multiple MCP servers (Database, Local Filesystem, Weather API, GitHub, Search, Custom Tools).
- **Interactive Routing Engine**: Matches query terms against discovered MCP tool names and descriptions, ranks candidate servers, checks required inputs, and reports real execution status and duration.
- **Tool Execution Payloads**: Collapsible tool cards with execution duration, completion status, and formatted JSON results.
- **Context & Memory Drawer**: Active goals persist in browser storage and provide a small tie-breaker when ranking matching tools. Memory notes stay local and are not sent to MCP servers.
- **Execution History & Task Logs Drawer**:
  - Filterable audit log of orchestrated queries
  - Latency, lexical match score, status, and server routed to
  - 1-click query re-run into chat
- **MCP Server Registrations**:
  - 1-click popular presets (PostgreSQL, Filesystem, Weather, GitHub, Brave Search)
  - Live server ping latency handshake test
  - Support for `SSE`, `STDIO`, and `HTTP` transports
- **FastAPI Backend**: Server registrations and execution history are stored in a local SQLite database.
- **MCP Client**: Connects to configured Streamable HTTP, SSE, and STDIO MCP servers, discovers tools concurrently, caches tool lists briefly, ranks tools by query/name/description overlap, and calls the selected tool.
- **Schema-Guided Inputs**: The UI asks for required tool arguments it could not infer, and the backend validates them against the tool's JSON Schema before execution.

---

## 🚀 Getting Started

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install and Start the Backend
Use Python 3.11 or newer:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
cp .env.example .env  # Set real secrets and deployment values in this ignored file
uvicorn app:app --reload --port 8000 --env-file .env
```

The API is available at `http://127.0.0.1:8000`; interactive API docs are at `http://127.0.0.1:8000/docs`. The database is created at `backend/data/orchestrator.sqlite3` on first start. Set `ORCHESTRATOR_DB_PATH` to store it elsewhere.

To use PostgreSQL for a shared registry and execution log, set `ORCHESTRATOR_DATABASE_URL` in `backend/.env`; this selects PostgreSQL instead of SQLite. To copy existing local records, run from the `backend` directory after setting the URL: `python migrate_sqlite_to_postgres.py --source data/orchestrator.sqlite3`. The migration is additive and leaves the SQLite source untouched; conflicting server names with different IDs stop the migration rather than overwrite records.

### 3. Start the Development Server
In a second terminal, from the project root:

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔌 Backend API

The Vite development server proxies `/api` to `http://127.0.0.1:8000` (override with `VITE_API_BASE`). The backend provides:

- `GET /api/health`
- `GET`, `POST /api/servers`; `DELETE /api/servers/{id}`
- `POST /api/servers/{id}/ping` to initialize an MCP session and discover tools
- `POST /api/chat` to rank matching tools and call one when its required arguments can be inferred from the request
- `GET /api/history` (supports `limit`, `offset`, `status=success|error`, and `search` query parameters); `DELETE /api/history`
- `GET /api/metrics` for execution and registered-server totals

Add a server in the UI, then use **Ping** to verify that the backend can initialize it. The starter server values are examples; configure them with endpoints or commands that are available in your environment. By default, tool selection uses lexical matching and argument inference. To enable model-assisted routing, configure `ORCHESTRATOR_LLM_API_KEY` and `ORCHESTRATOR_LLM_MODEL` in `backend/.env`; `ORCHESTRATOR_LLM_BASE_URL` can point to an OpenAI Responses-compatible endpoint. The model may select only from discovered MCP tools, its arguments are checked against each tool's JSON Schema, and a provider outage falls back to lexical routing. Provider requests send the user task and up to 50 tool descriptions/schemas, so configure this only with a provider approved for that data. If required arguments cannot be inferred, the API returns the missing fields and schema without claiming the tool ran.

Server tool discovery runs with a configurable concurrency cap (`MCP_MAX_PARALLEL_DISCOVERY`, default `10`) so one chat request cannot fan out without limit when many MCP servers are registered. `MCP_REQUEST_TIMEOUT` controls the per-server discovery and tool-call timeout.

### API access protection

For a shared deployment, set a high-entropy `ORCHESTRATOR_API_KEY` in the backend environment. All `/api/*` routes except `/api/health` then require `Authorization: Bearer <key>`. Paste that key into **Settings → FastAPI Backend → Backend access token** in the UI; the browser holds it in tab-scoped session storage. Keep API traffic behind HTTPS and use a reverse proxy or identity provider for per-user accounts, authorization roles, and rate limiting. This shared-key gate is a deployment safeguard, not a replacement for user identity management.

Authenticated HTTP MCP endpoints can receive per-server headers from `MCP_SERVER_HEADERS_JSON`, keyed by registered server ID. The values stay in backend environment configuration and are never returned by the API. Example: `{"server-id":{"Authorization":"Bearer token"}}`. Store the real value in the ignored `backend/.env`; do not commit it or put credentials in endpoint URLs. This supports HTTP/SSE transports; STDIO server environment-based secret injection is not implemented.

The API also exposes `/api/metrics` as a lightweight operational snapshot. It does not replace production monitoring, alerting, or centralized structured logs.

Active session goals are stored in browser local storage and give a small ranking boost only among tools that already match the request. Memory notes remain in browser storage and are not sent to the backend or MCP servers.

## 🧪 Backend Checks

Install the optional test client, then run the local API and STDIO MCP integration tests from the repository root:

```bash
pip install -r backend/requirements-test.txt
.venv/bin/python -m unittest discover -s backend/tests -v
```
