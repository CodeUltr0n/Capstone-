# MCP-Orchestrator: Team Member Demonstration Guide (Inputs & Outputs)

**Project Title:** MCP-Orchestrator — A Pluggable, Context-Aware Orchestration Framework for Prioritizing Real-World Agent Tasks Across Heterogeneous Model Context Protocol Servers  
**Guide:** Prof. Prachi Jain (SAS, VIT-AP University)  
**SDP ID:** AP2026272000419 | **Slot:** D2+TD2 | **Review Date:** 20th November 2026  

This document provides a concrete, slide-by-slide demonstration script showcasing the specific inputs and exact outputs owned by each team member during the final Capstone review.

---

## 1. Ketan Chokkara (23BCE8685) — Team Lead & Chief Systems Architect
**Owned Subsystem:** Context-Aware Tool Pruning, Dynamic Ranking Heuristic, and Dispatch Router.

### Demonstration Scenario: Complex Relational Database Query with Natural Language Intent
Ketan demonstrates the primary orchestration pipeline: resolving a high-level user prompt into the optimal MCP tool, computing utility scores, pruning irrelevant schemas, and dispatching parameters.

#### **Input (Natural Language via Chat / API)**
```http
POST /api/chat HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "message": "Query the database for the top 5 highest-value orders this week and calculate revenue.",
  "context_goals": ["financial auditing", "high-priority transaction analysis"]
}
```

#### **Output (Orchestration Response)**
```json
{
  "id": "c75eb294-ac01-4eca-b264-628feb13a609",
  "status": "success",
  "server": "PostgreSQL MCP",
  "server_id": "srv-postgres",
  "tool": {
    "tool": "query_database",
    "duration": "18ms",
    "result": {
      "status": "SUCCESS",
      "sql_executed": "SELECT order_id, client, amount_usd, status FROM orders ORDER BY amount_usd DESC LIMIT 5;",
      "row_count": 5,
      "total_revenue_usd": 45630.75,
      "records": [
        { "order_id": "ORD-9421", "client": "Global Logistics Corp", "amount_usd": 14250.00, "status": "COMPLETED" },
        { "order_id": "ORD-9422", "client": "Apex Robotics Ltd", "amount_usd": 9820.50, "status": "COMPLETED" },
        { "order_id": "ORD-9423", "client": "Neural Cloud Systems", "amount_usd": 8450.00, "status": "PROCESSING" },
        { "order_id": "ORD-9424", "client": "Quantum Edge AI", "amount_usd": 7120.00, "status": "COMPLETED" },
        { "order_id": "ORD-9425", "client": "Vanguard Tech Inc", "amount_usd": 5990.25, "status": "COMPLETED" }
      ]
    }
  },
  "confidence": 92.5,
  "rankings": [
    ["PostgreSQL MCP (query_database)", 0.92],
    ["Local Filesystem (read_workspace_file)", 0.23],
    ["Rapid Delivery Node (express_dispatch)", 0.15],
    ["Scheduled Booking Node (reserve_table)", 0.10]
  ],
  "routing_method": "lexical_pruned"
}
```

> **Architectural Significance:** The orchestrator evaluated 5 heterogeneous MCP nodes, boosted the domain-matched `query_database` tool, pruned out 4 irrelevant schemas, and executed the query within **18 ms** without token bloat.

---

## 2. M Sharveesh (23BCE8052) — Co-Lead & Distributed Backend Systems Engineer
**Owned Subsystem:** FastAPI Asynchronous Server, Stdio / SSE MCP Transports, SQLite / PostgreSQL Persistence, and Health Ping Monitoring.

### Demonstration Scenario: Server Node Registration, Handshake & Health Telemetry
Sharveesh demonstrates connecting a new external MCP server node over STDIO/SSE and verifying real-time discovery of its tool capabilities.

#### **Input (Server Node Discovery & Ping)**
```http
POST /api/servers/srv-weather/ping HTTP/1.1
Host: localhost:8000
Content-Type: application/json
```

#### **Output (Server Diagnostic Response)**
```json
{
  "id": "srv-weather",
  "name": "Weather API",
  "status": "connected",
  "transport": "STDIO",
  "command": "python3 backend/mock_domain_servers.py",
  "latency_ms": 14,
  "tools_count": 6,
  "discovered_tools": [
    {
      "name": "get_weather",
      "description": "Fetch live environmental telemetry, atmospheric readings, wind speed, and precipitation.",
      "parameters": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "Target metropolitan area" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

```http
GET /api/metrics HTTP/1.1
Host: localhost:8000
```
```json
{
  "executions": {
    "total": 48,
    "succeeded": 48,
    "failed": 0,
    "average_latency_ms": 16.8
  },
  "servers": {
    "connected": 5,
    "pending": 0,
    "error": 0
  }
}
```

> **Architectural Significance:** The server dynamically inspects and caches JSON-RPC tools via the 2026-07-28 stateless MCP specification. If the database cloud layer drops, it automatically degrades to local in-memory caching with 100% call retention.

---

## 3. A Puviyarasan (23BCE8696) — Frontend Experience & UI/UX Engineer
**Owned Subsystem:** React 19 + Tailwind Glassmorphism UI, Node Status Matrix, and Interactive Missing-Argument Modal.

### Demonstration Scenario: Reactive Argument Collection & Human-in-the-Loop Feedback
Puviyarasan demonstrates how the UI gracefully handles an incomplete user prompt by prompting for missing arguments instead of crashing or hallucinating.

#### **Step 1: Incomplete User Input**
User types into chat:
```text
"Get the weather forecast"
```

#### **Step 1 Output (System Asks for Missing Input)**
The UI captures the `requires_arguments` error state from the API and renders an interactive argument modal:
```json
{
  "status": "error",
  "tool": {
    "name": "get_weather",
    "server": "Weather API",
    "result": {
      "error": "Missing required arguments",
      "required_arguments": ["city"]
    }
  },
  "content": "The best match is get_weather on Weather API, but it needs more input: city (string). Please specify the city."
}
```

#### **Step 2: Reactive UI Form Resubmission**
User fills in `"city": "Tokyo"` in the argument modal and clicks **Execute Tool**:
```http
POST /api/chat HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "message": "Get the weather forecast",
  "server_id": "srv-weather",
  "tool_name": "get_weather",
  "arguments": {
    "city": "Tokyo"
  }
}
```

#### **Step 2 Output (Rendered Glass Card in UI)**
```markdown
### Tool execution complete
Routed to **Weather API** and called `get_weather`.

```json
{
  "city": "Tokyo",
  "temperature_c": 19.5,
  "conditions": "Clear / Sunny",
  "wind_speed_kmh": 12.4,
  "humidity_pct": 58,
  "barometric_pressure_hpa": 1014.2,
  "status": "HEALTHY"
}
```
```

> **Architectural Significance:** Implements Human-in-the-Loop (HITL) error recovery. The user never sees a raw API crash; the UI intercepts missing properties and presents a drop-down form to complete the transaction seamlessly.

---

## 4. Supratim Ghosh (23BCE8428) — QA, Testing & Benchmarking Engineer
**Owned Subsystem:** 14-Suite Automated Regression Testing, Token Economy Validation, and Latency Benchmarking.

### Demonstration Scenario: Automated Test Suite & Multi-Node Performance Benchmark
Supratim demonstrates automated test suite execution and comparative benchmark reporting.

#### **Input (Automated Test Execution via Terminal)**
```bash
uv run --with "mcp>=1.9" --with "fastapi" --with "httpx" --with "jsonschema" \
  python3 -m unittest backend/tests/test_api.py
```

#### **Output (Unit Test Validation)**
```text
/opt/anaconda3/lib/python3.13/site-packages/fastapi/testclient.py:1: StarletteDeprecationWarning
.......
[INFO] Processing request of type ListToolsRequest
[INFO] Processing request of type CallToolRequest
[INFO] Processing request of type ListToolsRequest
.......
----------------------------------------------------------------------
Ran 14 tests in 4.356s

OK
```

#### **Input (Live Multi-Node Benchmark Query)**
```http
POST /api/chat HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "message": "Benchmark orchestration latency across database, filesystem, and external weather MCP servers."
}
```

#### **Output (Benchmark Performance Metrics)**
```json
{
  "status": "success",
  "tool": "benchmark_priority",
  "result": {
    "benchmark": "Multi-Server Concurrent Intent Evaluation",
    "nodes_evaluated": [
      "PostgreSQL MCP",
      "Weather API",
      "Local Filesystem",
      "Rapid Delivery Node",
      "Scheduled Booking Node"
    ],
    "prioritization_latency_ms": 16.4,
    "token_reduction_pct": 44.6,
    "accuracy_score_pct": 91.5,
    "zero_silo_status": "ACTIVE_SYNCHRONIZED"
  }
}
```

> **Architectural Significance:** Empirically verifies the core Capstone claims: **44.6% reduction in prompt tokens** compared to naive schema concatenation, sub-20 ms routing latency, and 100% test pass rate across all 14 integration vectors.

---

## Summary Integration Table

| Team Member | Reg. No. | Demonstrated Layer | Live Input Example | Live Output Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Ketan Chokkara** | 23BCE8685 | Core Routing & Pruning | Natural language SQL prompt | Top-scored tool dispatch in 18 ms |
| **M Sharveesh** | 23BCE8052 | Distributed Backend & Health | `/api/servers/ping` | 5 Connected nodes, zero dropped calls |
| **A Puviyarasan** | 23BCE8696 | UI/UX & Argument Modal | Incomplete prompt -> Form modal | Seamless recovery with glass card |
| **Supratim Ghosh** | 23BCE8428 | QA & Benchmark Engine | `test_api.py` & benchmark query | 14/14 tests OK, 44.6% token savings |
