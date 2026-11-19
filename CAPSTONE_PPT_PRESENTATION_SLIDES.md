# CAPSTONE FINAL REVIEW — COMPLETE SLIDE DECK (SLIDES 1 TO 15)
**Project Title:** MCP-Orchestrator — A Pluggable, Context-Aware Orchestration Framework for Prioritizing Real-World Agent Tasks Across Heterogeneous Model Context Protocol Servers  
**Institution:** School of Computer Science and Engineering (SCOPE), VIT-AP University, Amaravati  
**SDP ID:** AP2026272000419 | **Slot:** D2 + TD2 | **Review Date:** 20th November 2026  
**Supervised By:** Prof. Prachi Jain (Assistant Professor Grade-1, SAS, VIT-AP University)

---

### SLIDE 1 — Title Slide

```text
                          CAPSTONE FINAL REVIEW
                            PROJECT VIVA-VOCE

                           MCP - ORCHESTRATOR
         A Pluggable, Context-Aware Orchestration Framework for
        Prioritizing Real-World Agent Tasks Across Heterogeneous
                     Model Context Protocol Servers

                   Supervised By: Prof. Prachi Jain
                        SDP Id: AP2026272000419

                    Name of the Student(s) with Regd. No.:
              • Ketan Chokkara      — 23BCE8685  (Team Lead)
              • M Sharveesh         — 23BCE8052
              • A Puviyarasan       — 23BCE8696
              • Supratim Ghosh      — 23BCE8428

                    School of Computer Science and Engineering
                             VIT-AP University
                             Amaravati, India
```

---

### SLIDE 2 — Presentation Outline

1. **Introduction & Motivation**
   - Project Vision & Background
   - Problem Statement: Context Silos, Token Bloat & Static Routing
   - Objectives & Measurable Engineering KPIs
2. **Background & Literature Review**
   - Existing Multi-Agent Frameworks vs. Open MCP Specification
   - Architectural Deficiencies in Current Systems
   - Key Innovations & Research Contribution
3. **Proposed Solution & System Architecture**
   - 4-Tier Hybrid Architecture (Client Interface, Ingress & Routing, MCP Mesh, QA Suite)
   - Dynamic Context-Aware Utility Scoring Heuristic
   - Top-K Candidate Tool Pruning & 3-Tier Graceful Degradation FSM
4. **Implementation and Results**
   - Core Stack (FastAPI, Python 3.11, Anthropic MCP SDK, SQLite/PostgreSQL, React 18)
   - Benchmark Dataset (200 Curated Real-World Queries across 3 Domains)
   - Experimental Validation: 44.6% Token Reduction, 17 ms Latency, 91.5% Accuracy
5. **Summary & Future Directions**
   - Findings vs. Original KPIs
   - System Boundaries & Limitations
   - Future Horizons & Academic Roadmap
6. **Bibliography**

---

### SLIDE 3 — Introduction: Project Overview

- **Core Vision:** MCP-Orchestrator is an open, centralized, lightweight orchestration middleware built directly on the Anthropic Model Context Protocol (MCP) standard (Nov 2024 / updated to stateless 2026-07-28 specification).
- **The Core Paradigm Shift:** Replaces brittle single-purpose agent silos (separate isolated chatbots for delivery, booking, ride-hailing) with a single, context-aware control plane:
  1. **Captures Multi-Modal Context:** User natural-language intent + real-time environmental vector (temporal slot, GPS coordinates, urgency index, past affinity).
  2. **Deterministic Pre-Scoring:** Computes a transparent Context-Aware Utility Score for every registered MCP server/tool.
  3. **Top-K Pruning:** Eliminates irrelevant tool schemas, assembling an ultra-compact prompt for the reasoning engine.
  4. **Multi-Transport Execution:** Dispatches selected tasks across heterogeneous MCP server nodes via Stdio, Server-Sent Events (SSE), or HTTP JSON-RPC.
- **Enterprise Storage Evolution:** Features a resilient dual-engine persistence layer—supporting local zero-configuration SQLite (WAL mode) and managed cloud PostgreSQL (via Supabase or standard PostgreSQL connection strings), backed by local in-memory fallback.

---

### SLIDE 4 — Introduction: Problem Statement & Motivations

#### The Problem
Contemporary multi-agent LLM systems suffer from three critical architectural deficiencies when interfacing with real-world microservices:
1. **Context Siloing & Zero Shared Memory:** Service agents operate as isolated silos. A flight booking agent cannot share temporal or financial context with a hotel or ride-hailing agent without costly, fragile prompt synchronization.
2. **Combinatorial Token Bloat:** Naively dumping every available OpenAPI/MCP tool schema into the system prompt exhausts context windows quadratically ($O(N)$ prompt growth), causing massive latency and runaway API bills.
3. **Absence of Real-World Environmental Awareness:** Conversational agents lack awareness of physical constraints—such as ordering dinner after restaurant closing times, picking high-latency distant stores, or prioritizing trivial tasks over urgent emergencies.

#### Motivations
- **Industry Standardization:** By late 2026, MCP has become the de-facto open standard adopted by major AI coding assistants, enterprise gateways (AWS MCP Gateway, Cloudflare MCP v2), and chat clients.
- **Cost & Latency Mandate:** Enterprises require deterministic token reduction ($\ge 40\%$) and sub-25 ms routing overhead.
- **Reliability Pressure:** Production agent systems cannot experience catastrophic failures when third-party cloud LLMs or databases drop; deterministic fallback is an enterprise requirement.

---

### SLIDE 5 — Introduction: Objectives & Expected Impact

#### Key Objectives
1. **Architect a Decoupled Orchestrator:** Clean separation of intent parsing, heuristic context prioritization, transport dispatch, and state storage.
2. **Formulate a Multi-Factor Utility Scoring Heuristic:** Mathematical formula balancing Urgency, Spatial Proximity, Temporal Relevance, and User Affinity.
3. **Build an Open/Closed Plugin Registry:** Connect new MCP services with $<15$ lines of declarative configuration and zero router modifications.
4. **Implement 3-Tier Graceful Degradation:** Seamless transition: `FULL` (LLM + Cloud DB) $\rightarrow$ `DEGRADED` (Deterministic Heuristic + Cloud DB) $\rightarrow$ `SURVIVAL` (Local In-Memory Edge Scoring).
5. **Surpass Rigorous Engineering KPIs:**
   - Prompt token reduction $\ge 40\%$
   - Prioritization overhead $\le 25\text{ ms}$
   - Routing decision accuracy $\ge 90\%$
   - Test statement coverage $\ge 80\%$

#### Expected Impact
- **Immediate Cost Optimization:** Cuts API inference bills by up to 50% through schema pruning.
- **Microsecond Edge Responsiveness:** Pre-routing decisions occur in under 20 ms before invoking costly models.
- **Future-Proof Pluggability:** Drop-in compatibility with the wider Anthropic MCP server ecosystem.

---

### SLIDE 6 — Background & Related Work: Existing Solutions & Limitations

| Approach | Architecture Style | Context Awareness | Token Efficiency | Failure Resilience | Vendor Independence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenAI Assistants / Actions** | Proprietary Cloud Loop | ❌ Purely conversational | ❌ Low (Schemas permanently bound) | ❌ Zero (Fails if OpenAI API drops) | ❌ Hard vendor lock-in |
| **LangChain / LangGraph** | Heavy Code Abstractions | ⚠️ Manual state passing | ❌ Low (Full tool dictionary loaded) | ⚠️ Partial (Custom exception blocks) | ⚠️ Framework lock-in |
| **CrewAI / AutoGen** | Multi-Agent Chat Threads | ❌ Fragmented per agent | ❌ Extremely Low (Token explosion) | ❌ Fragile (Agent hallucination loops) | ⚠️ Python ecosystem only |
| **Raw MCP Clients (Claude Desktop)** | Point-to-Point Transport | ❌ No signal prioritization | ❌ Brute-force tool loading | ❌ Unhandled node drops | ⚠️ Desktop client-bound |
| **MCP-Orchestrator (Ours)** | **Centralized Modular Control Plane** | **✅ 4-Axis Real-World Vector** | **✅ Top-K Pruned ($\ge 44\%$ token cut)** | **✅ 3-Tier Deterministic Degradation** | **✅ 100% Open Protocol Compliant** |

---

### SLIDE 7 — Background & Related Work: Improvements Over Existing Solutions

| Limitation in Existing Work | MCP-Orchestrator Improvement |
| :--- | :--- |
| **Vendor / Framework Lock-in** | Built on the open Anthropic MCP 2026-07-28 specification; works with any compliant server. |
| **Token Bloat (All Tools in Prompt)** | Top-K pruning based on deterministic utility scoring $\rightarrow \ge 44.6\%$ prompt token reduction. |
| **No Environmental Awareness** | Four-axis heuristic: $\text{Urgency} \times \text{Distance} \times \text{Time-of-day} \times \text{User Affinity}$. |
| **No Cross-Session Memory** | Resilient persistent store with conversation checkpoints, entity memory, and learned preferences. |
| **Black-Box Routing** | Transparent polynomial scoring formula with weights externalized in YAML config. |
| **Catastrophic Failure on Outages** | Three-tier degradation: Full LLM $\rightarrow$ Deterministic Degraded $\rightarrow$ Time-layer Survival mode. |
| **Closed Extension** | Open/Closed plugin registry: new service = new registration config, zero router code edits. |

**Novelty Position:** MCP-Orchestrator sits between raw MCP clients (which only transport) and heavyweight agent frameworks (which add bloat). It is the first academic prototype to combine MCP-native transport, deterministic context prioritization, and tiered graceful degradation in a single middleware.

---

### SLIDE 8 — Proposed Solution: System Architecture (4-Layer Mesh)

- **LAYER 1: Client & Sensory Interface (Lead: A Puviyarasan)**
  - Vite + React 18 Universal Control Plane dashboard (Neural Slate dark mode).
  - Floating command palette dock with quick-intent chips and interactive sensory mutation drawer.
- **LAYER 2: Core Orchestration & Hybrid State Plane (Lead: Ketan Chokkara)**
  - API Ingress Gateway $\rightarrow$ Context Prioritization Engine (computes utility scores).
  - Top-K Candidate Tool Pruner $\rightarrow$ JSON-RPC Execution Dispatcher.
  - Dual-Engine Storage Plane: SQLite WAL mode + PostgreSQL cloud mesh, backed by local in-memory fallback.
- **LAYER 3: MCP Protocol Mesh & Domain Adapters (Lead: M Sharveesh)**
  - MCP Transport Client Pool supporting asynchronous Stdio and SSE transports.
  - Decoupled mock domain nodes: Node A (Rapid Delivery), Node B (Scheduled Booking), Node C (Catalog & Cart).
- **LAYER 4: QA, Telemetry & Resilience Suite (Lead: Supratim Ghosh)**
  - Automated Pytest test harness with mock MCP fixtures.
  - Token and latency profiler, 3-tier Graceful Degradation FSM.

---

### SLIDE 9 — Proposed Solution: Key Components / Modules

1. **Context Prioritization Engine (Lead: Ketan Chokkara)**
   - Formulates real-time urgency, spatial distance, operating hour suitability, and historical user affinity.
   - Externalized scoring weights in configuration.
2. **Dynamic Plugin Registry & Top-K Dispatcher (Lead: Ketan Chokkara)**
   - Open/Closed registry: new MCP service added via declarative JSON/YAML.
   - Top-K pruning algorithm eliminates low-scoring tools before prompt assembly.
3. **Dual-Engine Persistent State Store (Lead: Ketan & Sharveesh)**
   - Local SQLite WAL mode by default; cloud PostgreSQL via connection string.
   - Zero-downtime in-memory fallback if database connectivity drops.
4. **MCP Client Transport Layer & Mock Adapters (Lead: M Sharveesh)**
   - Stdio and SSE transports compliant with MCP 2026-07-28 JSON-RPC 2.0.
   - Async connection pooling, exponential backoff, and subprocess isolation.
   - Three mock domain servers: Delivery Node A, Booking Node B, Catalog Node C.
5. **Reactive Telemetry Dashboard (Lead: A Puviyarasan)**
   - Real-time priority queue inspector, round-trip latency timers, server status indicators.
   - Context mutation panel for examiners (urgency slider, clock, location coordinates).
6. **Automated QA & Benchmarking Suite (Lead: Supratim Ghosh)**
   - Pytest harness with 14 unit test cases.
   - Token-reduction, latency, and decision-accuracy benchmarks across 200 real-world queries.

---

### SLIDE 10 — Proposed Solution: Algorithms & Technologies

#### Core Algorithm — Context-Aware Utility Score
$$\text{Score}(T) = w_1 \cdot \mathcal{U}(T) + w_2 \cdot \mathcal{S}(T) + w_3 \cdot \mathcal{T}(T) + w_4 \cdot \mathcal{A}(T)$$

- **Default Weights:** $w_1 = 0.35$ (Urgency), $w_2 = 0.25$ (Spatial Proximity), $w_3 = 0.20$ (Temporal Relevance), $w_4 = 0.20$ (User Affinity).
- **Top-K Pruning:** Sort candidate tools descending by score, retain top $K$ (default $K=3$), drop remaining schemas from prompt.

#### 3-Tier Graceful Degradation FSM
- **State 1 (FULL):** LLM Available, DB Available $\rightarrow$ Full generative LLM function calling.
- **State 2 (DEGRADED):** LLM Timeout/Outage, DB Available $\rightarrow$ Deterministic dispatch of top-ranked tool. 100% request survival.
- **State 3 (SURVIVAL):** LLM Unavailable, DB Unavailable $\rightarrow$ Time-layer heuristic dispatch from local in-memory seed cache.

#### Technologies & Frameworks
- **Backend:** Python 3.11, FastAPI, asyncio, Anthropic `mcp` SDK, SQLite 3, PostgreSQL (`psycopg`).
- **Frontend:** Vite, React 18, Neural Slate Glassmorphic CSS, PWA.
- **Testing & Benchmarking:** Pytest, `unittest`, TestClient (`httpx`), Coverage.py.
- **Protocol:** Anthropic MCP Specification (2026-07-28), JSON-RPC 2.0, Stdio + SSE.

---

### SLIDE 11 — Implementation and Results: Datasets & Input-Output Descriptions

#### Benchmark Dataset (200 Curated Queries across 3 Domains)
- **70 Delivery Tasks:** (e.g., *"Order paracetamol urgently to Block 3"*, *"Track my dinner delivery"*).
- **70 Booking Tasks:** (e.g., *"Book a table for 4 at Mainland China tonight at 8 PM"*).
- **60 Catalog & Cart Tasks:** (e.g., *"Find noise-canceling headphones under ₹2,000 with 1-day delivery"*).

#### Synthetic Environmental Context Vectors
- Local timestamp (`06:00` to `23:59`).
- GPS coordinates (`lat, long` within metropolitan grid).
- Urgency flag (`Low`, `Medium`, `High`).
- User history profile (preferred stores, past order frequency).

#### Sample Input / Output
- **Input:** *"I'm starving, get me food fast, I'm at G03 block"*
- **Context:** Time = 21:40, Urgency = High, Location = (16.51, 80.52)
- **Output:** Dispatched tool = `delivery_nodeA.express_dispatch`, Utility Score = 0.91, Latency = 18 ms, Tokens Saved = 47%.

---

### SLIDE 12 — Implementation and Results: Parameters Description

#### Heuristic Parameters (externalized in heuristics configuration)

| Parameter | Symbol | Default | Exploration Range | Role / Impact |
| :--- | :---: | :---: | :---: | :--- |
| **Urgency Weight** | $w_1$ | `0.35` | `0.0 – 1.0` | How strongly real-time urgency dominates |
| **Distance Weight** | $w_2$ | `0.25` | `0.0 – 1.0` | Spatial proximity penalty for distant nodes |
| **Time-of-Day Weight** | $w_3$ | `0.20` | `0.0 – 1.0` | Temporal suitability (operating hours alignment) |
| **Affinity Weight** | $w_4$ | `0.20` | `0.0 – 1.0` | Learned user preference strength |
| **Top-K Value** | $K$ | `3` | `1 – 10` | Number of tool schemas retained in prompt |
| **LLM Timeout** | $T_{\text{LLM}}$ | `5,000 ms` | `1,000 – 10,000 ms` | Triggers deterministic DEGRADED mode |
| **DB Timeout** | $T_{\text{DB}}$ | `2,000 ms` | `500 – 5,000 ms` | Triggers local SURVIVAL edge mode |

#### Benchmark Parameters
- Test queries: 200
- Runs per query: 5 repeated trials (averaged)
- Hardware: Standard evaluation machine (Intel i5-12400 / 16 GB RAM)
- Baseline Comparisons: Random Router, Keyword Router, Brute-Force LLM-Only Router.

---

### SLIDE 13 — Implementation and Results: Experimental Outcomes

#### Table 1: Prompt Token Reduction (vs. Brute-Force LLM Baseline)

| Dispatch Router | Average Tokens / Prompt | Token Reduction (%) | Estimated Cost / 10k Req ($0.003/1k) |
| :--- | :---: | :---: | :---: |
| **LLM-Only (All Schemas in Context)** | 1,840 | — | $55.20 |
| **Keyword Match Router** | 1,420 | 22.8% | $42.60 |
| **Random Router** | 1,810 | 1.6% | $54.30 |
| **MCP-Orchestrator (Ours)** | **1,020** | **44.6%** | **$30.60 (Direct 44.6% Savings)** |

#### Table 2: Prioritization & Scheduling Overhead (Prioritization Step Only)

| Router Model | Median Latency (p50) | 95th Percentile Latency (p95) | Relative Speedup |
| :--- | :---: | :---: | :---: |
| **LLM-Only Router** | 680 ms | 1,250 ms | 1.0x (Baseline) |
| **Keyword Router** | 4 ms | 9 ms | 170x faster |
| **Random Router** | 1 ms | 2 ms | 680x faster |
| **MCP-Orchestrator (Heuristic + Prune)** | **17 ms** | **23 ms** | **40x faster than LLM pre-routing** |

#### Table 3: Decision Routing Accuracy (200-Query Gold Benchmark)

| Router Candidate | Correct Dispatches | Decision Accuracy (%) | Accuracy Gap vs. LLM |
| :--- | :---: | :---: | :---: |
| **Random Dispatch** | 41 / 200 | 20.5% | -73.0% |
| **Keyword Search** | 138 / 200 | 69.0% | -24.5% |
| **LLM-Only Full Prompt** | 187 / 200 | 93.5% | 0.0% (Target Ceiling) |
| **MCP-Orchestrator (Ours)** | **183 / 200** | **91.5%** | **-2.0% (Near-identical accuracy at half cost)** |

#### Table 4: Fault-Injection & Graceful Degradation Testing

| Injected Failure Condition | FSM State Transition | System Behavior Observed | Uptime / Success Rate |
| :--- | :---: | :--- | :---: |
| **LLM API Timeout / Rate Limit** | `DEGRADED` | Deterministic heuristic dispatches top-scored tool | **100% (Zero dropped calls)** |
| **Database / Cloud Storage Unreachable** | `SURVIVAL` | Seamlessly reads from local in-memory server cache | **100% (Instant fallback)** |
| **Simultaneous LLM + DB Outage** | `SURVIVAL` | Time-slot emergency heuristic dispatches request | **100% (Safe degradation)** |
| **Single MCP Node Down (Node B)** | Dynamic Retry | Automatically falls back to secondary ranked node | **96% Recovery Rate** |

- **Code Verification:** **83.4% statement coverage**, **78.1% branch coverage** (target met).

---

### SLIDE 14 — Summary: Key Findings, Limitations, Future Directions

#### Key Findings
- **Token Reduction Exceeded Target:** Achieved **44.6% token reduction** over LLM-only baseline (exceeding the $\ge 40\%$ KPI target).
- **Sub-25 ms Latency:** Prioritization completes in **17 ms** on average (well under 25 ms ceiling).
- **High Accuracy Maintained:** **91.5% decision accuracy**—within 2% of brute-force LLM inference at 1/40th the pre-routing latency.
- **100% Uptime Under Failures:** Three-tier degradation FSM validated across simulated LLM and database outages.
- **Open/Closed Plugin Extensibility:** New server modules plug in with $<15$ lines of declarative configuration.

#### System Boundaries & Limitations
- **Synthetic Context Constraints:** Current context signals are test vectors; commercial deployment requires hardware sensor SDK integration.
- **Static Heuristic Weights:** Weights are currently set empirically in configuration; dynamic self-tuning via reinforcement learning is open for future work.
- **Single-Node Orchestration:** Distributed cross-orchestrator consensus has not yet been evaluated.

#### Future Horizons
- Federated discovery integration with the **Official Anthropic MCP Registry** & AWS MCP Gateway.
- Dynamic weight adaptation via Multi-Armed Bandits (MAB) or online RLHF.
- Extension to Agent-to-Agent (A2A) protocol for decentralized autonomous swarms.
- Publication of reference implementation at a national AI/cloud systems conference.

---

### SLIDE 15 — Bibliography & Citations

1. Anthropic, *"Model Context Protocol Specification & Architecture Guidelines,"* San Francisco, CA, 2024–2026. Available: `https://modelcontextprotocol.io`
2. Anthropic, *"Model Context Protocol: Stateless HTTP/SSE Spec Release 2026-07-28,"* July 2026.
3. Cloudflare Research, *"The Next Generation of Model Context Protocol: Edge Worker Orchestration,"* Aug 2026. Available: `https://blog.cloudflare.com/mcp-v2`
4. AWS Open Source Architecture Blog, *"Governing Multi-Agent AI Tool Registries at Scale with MCP Gateway,"* 2026.
5. Kong Developer Documentation, *"What is an MCP Registry? Governing Agentic Tools,"* May 2026.
6. M. Yaroshefsky, *"Why the Model Context Protocol Became the Open Standard for AI Tooling,"* The New Stack, Dec 2025.
7. Redis Engineering, *"Context Pruning Strategies: Mitigating LLM Token Degradation in Production,"* May 2026.
8. Atlan Research, *"Algorithmic Context Pruning and Prompt Optimization for Enterprise Agents,"* June 2026.
9. OpenAI, *"Function Calling and Structured Outputs with GPT-4o,"* OpenAI Developer Guides, 2024–2025.
10. VIT-AP University, *"Capstone Project Framework & Engineering Rubrics — Final Review Phase,"* SCOPE, Amaravati, 2026.
