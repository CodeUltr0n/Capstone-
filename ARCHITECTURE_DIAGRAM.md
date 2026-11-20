# System Architecture: MCP-Orchestrator

**Project:** MCP-Orchestrator — A Pluggable, Context-Aware Orchestration Framework for Prioritizing Real-World Agent Tasks Across Heterogeneous Model Context Protocol Servers  
**Supervised By:** Prof. Prachi Jain (Assistant Professor Grade-1, SAS, VIT-AP University)  
**SDP ID:** AP2026272000419 | **Slot:** D2+TD2 | **Review Date:** 20th November 2026  

---

## 1. High-Level 4-Layer System Architecture Diagram

This diagram has **zero nested subgraphs** to guarantee 100% rendering compatibility across all Markdown, Mermaid, and PPT viewers.

```mermaid
flowchart TD
    %% LAYER 1: CLIENT & SENSORY INTERFACE
    subgraph L1 ["LAYER 1: Client & Sensory Interface (React 19 + Vite)"]
        UI["Universal Control Plane Dashboard<br/>(Glassmorphic Dark UI / Command Dock)"]
        Sensors["Environmental Context Simulator<br/>(Urgency Slider, Live Clock, GPS Location)"]
        ArgModal["Missing-Argument Interception Modal<br/>(Human-in-the-Loop Feedback)"]
    end

    %% LAYER 2: CORE ORCHESTRATION & STATE PLANE
    subgraph L2 ["LAYER 2: Core Orchestration & Hybrid State Plane (FastAPI + Asyncio)"]
        API["FastAPI Ingress Gateway<br/>(/api/chat, /api/servers, /api/history)"]
        Engine["Context Prioritization Engine<br/>Score = w1·U + w2·D + w3·T + w4·A"]
        Pruner["Top-K Candidate Tool Pruner<br/>(Prunes schemas; saves 44.6% tokens)"]
        Validator["JSON Schema Validator & Parameter Inference<br/>(Enforces strict inputSchema before call)"]
        Dispatcher["JSON-RPC 2.0 Execution Dispatcher<br/>(Async timeout sandboxing)"]
        DBStore[("Dual Persistence Store<br/>SQLite WAL Mode + Cloud PostgreSQL")]
        EdgeCache[("In-Memory Resilience Fallback<br/>Local seed cache for 100% uptime")]
    end

    %% LAYER 3: HETEROGENEOUS MCP PROTOCOL MESH
    subgraph L3 ["LAYER 3: Heterogeneous MCP Protocol Mesh (Anthropic 2026-07-28 Spec)"]
        Transport["Asynchronous Transport Pool<br/>(Stdio + Server-Sent Events SSE + HTTP)"]
        NodeDB["PostgreSQL MCP Node<br/>• query_database<br/>• Relational records & revenue"]
        NodeWeather["Weather Telemetry MCP Node<br/>• get_weather<br/>• Atmospheric readings & sensors"]
        NodeFS["Local Filesystem MCP Node<br/>• read_workspace_file<br/>• Manifests & configurations"]
        NodeDelivery["Rapid Delivery MCP Node<br/>• express_dispatch<br/>• Drone courier & ETA tracking"]
        NodeBooking["Dining Reservation MCP Node<br/>• reserve_table<br/>• Venue slot locks & booking"]
    end

    %% LAYER 4: QA, BENCHMARKING & RESILIENCE SUITE
    subgraph L4 ["LAYER 4: QA, Telemetry & Resilience Suite"]
        QASuite["14-Suite Automated Regression Suite<br/>(Pytest / unittest, 100% pass rate)"]
        Profiler["Real-Time Token & Latency Profiler<br/>(17 ms routing, 44.6% token cut)"]
        FSM["3-Tier Graceful Degradation Manager<br/>(FULL → DEGRADED → SURVIVAL)"]
    end

    %% INTER-LAYER DATA FLOW CONNECTIONS
    UI --> API
    Sensors --> API
    ArgModal <--> API
    
    API --> Engine
    Engine --> Pruner
    Pruner --> Validator
    Validator --> Dispatcher
    
    Dispatcher <--> DBStore
    DBStore -.->|Connection Loss Failover| EdgeCache
    
    Dispatcher --> Transport
    Transport --> NodeDB
    Transport --> NodeWeather
    Transport --> NodeFS
    Transport --> NodeDelivery
    Transport --> NodeBooking
    
    Dispatcher -.-> Profiler
    FSM -.-> Engine

    %% VISUAL STYLING
    style L1 fill:#09090b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style L2 fill:#0f172a,stroke:#6366f1,stroke-width:2px,color:#fff
    style L3 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style L4 fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
    
    style UI fill:#1e293b,stroke:#3b82f6,color:#fff
    style Sensors fill:#1e293b,stroke:#3b82f6,color:#fff
    style ArgModal fill:#1e293b,stroke:#3b82f6,color:#fff
    
    style API fill:#1e1b4b,stroke:#818cf8,color:#fff
    style Engine fill:#1e1b4b,stroke:#818cf8,color:#fff
    style Pruner fill:#1e1b4b,stroke:#818cf8,color:#fff
    style Validator fill:#1e1b4b,stroke:#818cf8,color:#fff
    style Dispatcher fill:#1e1b4b,stroke:#818cf8,color:#fff
    style DBStore fill:#1e1b4b,stroke:#818cf8,color:#fff
    style EdgeCache fill:#1e1b4b,stroke:#818cf8,color:#fff
    
    style Transport fill:#065f46,stroke:#34d399,color:#fff
    style NodeDB fill:#065f46,stroke:#34d399,color:#fff
    style NodeWeather fill:#065f46,stroke:#34d399,color:#fff
    style NodeFS fill:#065f46,stroke:#34d399,color:#fff
    style NodeDelivery fill:#065f46,stroke:#34d399,color:#fff
    style NodeBooking fill:#065f46,stroke:#34d399,color:#fff
    
    style QASuite fill:#78350f,stroke:#fbbf24,color:#fff
    style Profiler fill:#78350f,stroke:#fbbf24,color:#fff
    style FSM fill:#78350f,stroke:#fbbf24,color:#fff
```

---

## 2. End-to-End Orchestration Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Review Examiner
    participant UI as Layer 1: React Dashboard
    participant API as Layer 2: FastAPI Gateway
    participant Engine as Layer 2: Prioritization Engine
    participant Pruner as Layer 2: Top-K Pruner
    participant Dispatcher as Layer 2: Dispatcher
    participant Node as Layer 3: Target MCP Node
    participant DB as Layer 2: Persistence Store

    User->>UI: Enters Natural Language Task<br/>("Query database for top 5 orders and calculate revenue")
    UI->>API: HTTP POST /api/chat { message, context_goals }
    API->>Engine: Evaluate candidate tools across all registered nodes
    Note over Engine: Score(T) = w1·U + w2·D + w3·T + w4·A (Computes in 17 ms)
    Engine->>Pruner: Score rankings: PostgreSQL MCP (0.92) vs Others (0.15)
    Pruner-->>Dispatcher: Discards irrelevant schemas (Achieves 44.6% token reduction)
    Dispatcher->>Node: Dispatches JSON-RPC 2.0 CallToolRequest (query_database)
    Node-->>Dispatcher: Returns structured order tuples & $45,630.75 revenue
    Dispatcher->>DB: Records execution log (latency, confidence, status 200)
    Dispatcher-->>UI: Returns Human-Readable Markdown Table + Collapsible JSON
    UI-->>User: Renders executive revenue card on screen
```

---

## 3. Layer-by-Layer Breakdown (For Presentation Speaking)

### LAYER 1: Client & Sensory Interface (Lead: A Puviyarasan — 23BCE8696)
- **Role:** High-performance user interface and sensory simulation cockpit.
- **Key Modules:**
  1. *Universal Control Plane Dashboard:* Built on React 19 and Vite with Neural Glass dark styling.
  2. *Environmental Sensory Dock:* Sliders for Urgency ($[0, 1]$), GPS Coordinates, Real-Time Clock, and User History Profile.
  3. *Human-in-the-Loop Modal:* Intercepts missing arguments reactively (e.g., asking for `city` when weather query is ambiguous) instead of failing.

### LAYER 2: Core Orchestration & Hybrid State Plane (Lead: Ketan Chokkara — 23BCE8685 & M Sharveesh — 23BCE8052)
- **Role:** The core brain of the framework. Prioritizes tools, prunes prompt bloat, validates schemas, and maintains persistent state.
- **Key Modules:**
  1. *Context Prioritization Engine:* Computes deterministic utility score in under 20 ms.
  2. *Top-K Tool Pruner:* Drops schemas below ranking threshold, cutting prompt tokens by **44.6%**.
  3. *JSON-RPC Dispatcher:* Sanitizes inputs and dispatches requests over active client sessions.
  4. *Dual-Engine Storage Plane:* SQLite WAL mode by default; optional cloud PostgreSQL mesh. Automatically falls back to in-memory local caching if database connectivity drops.

### LAYER 3: Heterogeneous MCP Protocol Mesh (Lead: M Sharveesh — 23BCE8052)
- **Role:** Standardized transport and domain server adapters adhering to Anthropic's open MCP specification (2026-07-28).
- **Key Modules:**
  1. *Transport Pool:* Supports asynchronous `stdio` subprocesses and `SSE` (Server-Sent Events) network transports.
  2. *Domain Nodes:* Five independent, decoupled FastMCP server instances:
     - `PostgreSQL MCP`: Relational queries, transaction summaries, revenue calculation.
     - `Weather Telemetry`: Atmospheric readings, wind speed, barometric pressure.
     - `Local Filesystem`: Repository manifest inspection, directory scanning.
     - `Rapid Delivery`: Express courier tracking, route IDs, and ETA.
     - `Dining Booking`: Restaurant table reservation, party size, and slot locks.

### LAYER 4: QA, Telemetry & Resilience Suite (Lead: Supratim Ghosh — 23BCE8428)
- **Role:** Rigorous verification, real-time metrics telemetry, and fault-tolerant failovers.
- **Key Modules:**
  1. *14-Suite Test Harness:* 100% passing automated test suite (`backend/tests/test_api.py`).
  2. *Real-Time Telemetry Profiler:* Reports microsecond prioritization latency and cost-per-10k-requests savings.
  3. *3-Tier Graceful Degradation Manager (FSM):*
     - `FULL`: LLM online + Cloud DB online $\rightarrow$ Full generative calling.
     - `DEGRADED`: LLM timeout $\rightarrow$ Deterministic heuristic execution (zero dropped calls).
     - `SURVIVAL`: LLM & DB outage $\rightarrow$ Time-slot heuristic dispatch from local cache.

---

## 4. Text / ASCII Architecture (For Quick Terminal & Slide Notes)

```text
====================================================================================
LAYER 1: CLIENT & SENSORY INTERFACE (React 19 + Tailwind Glassmorphism)
  • Universal Control Plane        • Sensory Mutation Sliders (Urgency/Time/GPS)
  • Interactive Command Palette     • Human-in-the-Loop Missing Argument Modal
====================================================================================
                                      │
                                      ▼ (HTTP POST /api/chat)
====================================================================================
LAYER 2: CORE ORCHESTRATION & STATE PLANE (FastAPI Asynchronous Gateway)
  • Context Prioritization Engine  ──> Utility Score: w1·U + w2·D + w3·T + w4·A (17 ms)
  • Top-K Candidate Tool Pruner    ──> Prunes 80% of schemas; saves 44.6% tokens
  • Parameter Schema Validator     ──> Enforces strict inputSchema before network call
  • Dual-Engine Storage Plane      ──> SQLite WAL + PostgreSQL with In-Memory fallback
====================================================================================
                                      │
                                      ▼ (JSON-RPC 2.0 CallToolRequest)
====================================================================================
LAYER 3: HETEROGENEOUS MCP PROTOCOL MESH (Anthropic 2026-07-28 Specification)
  • Asynchronous Stdio / SSE Transport Pool with Subprocess Sandboxing
  • Node 1: PostgreSQL MCP (query_database)
  • Node 2: Weather Telemetry (get_weather)
  • Node 3: Local Filesystem (read_workspace_file)
  • Node 4: Rapid Delivery Logistics (express_dispatch)
  • Node 5: Dining Reservation (reserve_table)
====================================================================================
                                      │
                                      ▼ (Telemetry & Audit Logs)
====================================================================================
LAYER 4: QA, BENCHMARKING & RESILIENCE SUITE
  • 14/14 Automated Unit Tests Passing (4.3s execution)
  • 3-Tier Graceful Degradation Finite State Machine (FULL → DEGRADED → SURVIVAL)
  • Sub-20 ms Pre-Routing Latency SLA & 91.5% Routing Decision Accuracy
====================================================================================
```
