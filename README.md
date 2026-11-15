# Model Context Protocol (MCP) Orchestrator — Frontend

A general-purpose **Model Context Protocol (MCP) Orchestrator** web client featuring a crimson silk dark-red glassmorphism interface.

Inspired by the multi-server routing concept of the MCP Orchestrator, this frontend operates as a unified control plane across multiple MCP servers, visualizing real-time intent classification, context signals, scoring weights, and server execution pipelines.

---

## 🎨 Visual Aesthetics & Theme

- **Theme**: Dark Crimson Glass / Ruby Silk Glassmorphism (`#0a0404` deep obsidian base with translucent crimson glass panels)
- **Canvas Waves**: Dynamic interactive glass silk wave background in `AnimatedGlassBackground.jsx`
- **Specular Highlights**: Crisp inset borders (`inset 0 1px 0 rgba(255, 255, 255, 0.25)`) and multi-layer shadows
- **Typography**: Inter & JetBrains Mono via Google Fonts

---

## ✨ Features

- **Universal Control Plane**: Single orchestration layer across multiple MCP servers (Database, Local Filesystem, Weather API, GitHub, Search, Custom Tools).
- **Interactive Routing Engine**: Visualizes the 5-stage orchestration pipeline:
  1. *Intent Detection* (e.g. `DATABASE_QUERY_TASK`, `FILESYSTEM_TASK`)
  2. *Context Signals* (Temporal slot, Active session goals, Memory buffer)
  3. *Prioritization & Scoring* (Animated confidence progress bars)
  4. *Dynamic Server Selection* (Domain reasoning & score breakdown)
  5. *Execution Confirmation* (Tool name, status 200, duration in ms)
- **Tool Execution Payloads**: Collapsible tool cards with execution latency, status codes, and formatted JSON output payloads.
- **Context & Memory Drawer**:
  - Live session context signals & urgency bias slider
  - Active session goals management
  - Persistent context memory slots across tasks (eliminating token silos)
- **Execution History & Task Logs Drawer**:
  - Filterable audit log of orchestrated queries
  - Latency, confidence percentage, and server routed to
  - 1-click query re-run into chat
- **MCP Server Registrations**:
  - 1-click popular presets (PostgreSQL, Filesystem, Weather, GitHub, Brave Search)
  - Live server ping latency handshake test
  - Support for `SSE`, `STDIO`, and `HTTP` transports
- **Python Backend Bridge**:
  - Vite dev server is pre-configured with proxy rules for `http://127.0.0.1:8000`:
  - Automatically proxies `/mcp`, `/chat`, `/servers`, and `/health` to your Python backend once you start it.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🔌 Connecting Your Python Backend

When you build your Python backend (using FastAPI, Quart, or standard Python):
1. Run your Python server on `http://127.0.0.1:8000`.
2. The Vite dev server will seamlessly forward all API calls through the configured proxy routes (`/chat`, `/mcp`, `/servers`, `/health`).
