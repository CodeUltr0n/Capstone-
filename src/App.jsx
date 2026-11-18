import React, { useState, useRef, useEffect } from 'react';
import { Send, Hexagon, Sparkles, ArrowRight, Zap, Network, Brain, Database, CloudRain, FolderGit2 } from 'lucide-react';
import AnimatedGlassBackground from './components/AnimatedGlassBackground';
import StatusPanel from './components/StatusPanel';
import Message from './components/Message';
import BottomNav from './components/BottomNav';
import ServerConfigModal from './components/ServerConfigModal';
import SettingsDrawer from './components/SettingsDrawer';
import ContextMemoryDrawer from './components/ContextMemoryDrawer';
import ExecutionHistoryDrawer from './components/ExecutionHistoryDrawer';
import { supabase } from './lib/supabase';

// ──── Initial Seed Data ────
const INITIAL_SERVERS = {
  'PostgreSQL MCP': 'connected',
  'Local Filesystem': 'connected',
  'Weather API': 'connected',
  'GitHub MCP': 'connected',
  'Brave Search': 'pending',
};

const STARTER_PROMPTS = [
  {
    icon: Database,
    title: 'Query Database Records',
    desc: 'Filter customer transactions & compute order totals',
    query: 'Query the database for the top 5 highest-value orders this week and calculate revenue.'
  },
  {
    icon: CloudRain,
    title: 'Live Weather Telemetry',
    desc: 'Fetch multi-city forecast & barometric conditions',
    query: 'Get the current weather forecast, wind speed, and precipitation for Tokyo and New York.'
  },
  {
    icon: FolderGit2,
    title: 'Scan Local Repository',
    desc: 'Inspect project directory structure & dependencies',
    query: 'Inspect our workspace directory for package.json and list all declared dependencies.'
  },
  {
    icon: Network,
    title: 'Multi-Server Priority Test',
    desc: 'Benchmark concurrent routing across all MCP servers',
    query: 'Benchmark orchestration latency across database, filesystem, and external weather MCP servers.'
  }
];

const INITIAL_HISTORY = [
  {
    id: 1,
    query: 'Inspect repository configuration and list production scripts',
    server: 'Local Filesystem',
    latency: '18ms',
    confidence: '97%',
    timeAgo: '10 mins ago'
  },
  {
    id: 2,
    query: 'Query active database connection pool status',
    server: 'PostgreSQL MCP',
    latency: '14ms',
    confidence: '95%',
    timeAgo: '25 mins ago'
  }
];

export default function App() {
  const [isLaunched, setIsLaunched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState(INITIAL_SERVERS);
  const [serverDetails, setServerDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');

  // Modals & Drawers state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Context & Execution History state
  const [contextState, setContextState] = useState({
    activeGoals: ['Full-stack App Development', 'Database Queries'],
    memorySlots: [
      { key: 'Default Environment', value: 'Production Linux Cluster' },
      { key: 'Preferred Output', value: 'Structured Markdown Tables' },
      { key: 'Data Policy', value: 'Zero PII Retention' }
    ],
    urgencyWeight: 0.85
  });
  const [executionHistory, setExecutionHistory] = useState(INITIAL_HISTORY);

  // Settings
  const [settings, setSettings] = useState({
    showControlPlane: true,
    autoRoute: true,
    persistentMemory: true,
    showToolPayloads: true,
    streamResponses: false,
  });

  const messagesListRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTo({
        top: messagesListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase env vars missing, using local data');
      return;
    }

    const loadServers = async () => {
      try {
        const { data, error } = await supabase.from('mcp_servers').select('*');

        if (error) {
          console.error('[supabase-debug] Failed to load MCP servers; using fallback data.', error);
          setServers(INITIAL_SERVERS);
          setServerDetails([]);
          return;
        }

        if (!data?.length) {
          console.warn('[supabase-debug] Supabase returned no MCP servers; using fallback data. Check table contents and read access (including RLS policies).');
          setServers(INITIAL_SERVERS);
          setServerDetails([]);
          return;
        }

        setServerDetails(data);
        setServers(Object.fromEntries(data.map(server => [server.name, server.status])));
      } catch (error) {
        console.error('[supabase-debug] Supabase request threw; using fallback data.', error);
        setServers(INITIAL_SERVERS);
        setServerDetails([]);
      }
    };

    loadServers();
  }, []);

  const handleAddServer = async (server) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('mcp_servers')
      .insert({
        name: server.name,
        url: server.url,
        transport: server.transport,
        status: server.status,
        last_latency_ms: Number.parseInt(server.latency, 10) || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Unable to add MCP server to Supabase.', error);
      return;
    }

    setServers(prev => ({ ...prev, [data.name]: data.status }));
  };

  // Handle BottomNav tab switching
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'chat') {
      setIsContextDrawerOpen(false);
      setIsHistoryDrawerOpen(false);
      setIsServerModalOpen(false);
    } else if (tabId === 'context') {
      setIsContextDrawerOpen(true);
      setIsHistoryDrawerOpen(false);
      setIsServerModalOpen(false);
    } else if (tabId === 'servers') {
      setIsServerModalOpen(true);
      setIsContextDrawerOpen(false);
      setIsHistoryDrawerOpen(false);
    } else if (tabId === 'history') {
      setIsHistoryDrawerOpen(true);
      setIsContextDrawerOpen(false);
      setIsServerModalOpen(false);
    }
  };

  // Dynamic Intent & Routing Generator for realistic interactive experience
  const generateSimulatedResponse = (query) => {
    const q = query.toLowerCase();
    const getRegisteredServerName = (expectedName) => {
      const searchName = expectedName.replace(/\s*MCP$/i, '').toLowerCase();
      return Object.keys(servers).find(name => name.toLowerCase().includes(searchName)) || expectedName;
    };
    const databaseServer = getRegisteredServerName('PostgreSQL MCP');
    const filesystemServer = getRegisteredServerName('Local Filesystem');
    const weatherServer = getRegisteredServerName('Weather API');
    const githubServer = getRegisteredServerName('GitHub MCP');
    const braveServer = getRegisteredServerName('Brave Search');

    // 1. Database Intent
    if (q.includes('data') || q.includes('sql') || q.includes('order') || q.includes('table') || q.includes('revenue') || q.includes('db')) {
      return {
        server: databaseServer,
        rankings: [
          [databaseServer, 1.94],
          [filesystemServer, 0.58],
          [weatherServer, 0.22]
        ],
        tool: {
          tool: 'postgres.query_read_only',
          duration: '22ms',
          result: {
            status: 'success',
            rows_returned: 4,
            execution_time: '0.0021s',
            columns: ['order_id', 'client', 'amount_usd', 'status'],
            data: [
              ['#9401', 'Acme Corp', '$14,250.00', 'COMPLETED'],
              ['#9402', 'Starlight Labs', '$8,920.00', 'COMPLETED'],
              ['#9403', 'Nordic Systems', '$6,450.00', 'PROCESSING'],
              ['#9404', 'Vertex AI', '$19,800.00', 'COMPLETED']
            ]
          }
        },
        content: [
          '### Database Query Execution',
          '',
          `The Prioritization Engine identified **relational database query intent** and routed this request directly to the **${databaseServer}** server with a **97% confidence score**.`,
          '',
          '#### Order Summary',
          '',
          '| Order ID | Client | Amount (USD) | Status |',
          '| :--- | :--- | :--- | :--- |',
          '| **#9404** | Vertex AI | **$19,800.00** | Completed |',
          '| **#9401** | Acme Corp | **$14,250.00** | Completed |',
          '| **#9402** | Starlight Labs | **$8,920.00** | Completed |',
          '| **#9403** | Nordic Systems | **$6,450.00** | Processing |',
          '',
          '> **Aggregated Revenue:** **$49,420.00** across 4 transaction records.',
          '',
          '*Zero token overhead was spent on filesystem or weather tools.*'
        ].join('\n')
      };
    }

    // 2. Weather Intent
    if (q.includes('weather') || q.includes('temp') || q.includes('rain') || q.includes('climate') || q.includes('wind') || q.includes('forecast') || q.includes('tokyo')) {
      return {
        server: weatherServer,
        rankings: [
          [weatherServer, 1.96],
          [braveServer, 0.74],
          [databaseServer, 0.25]
        ],
        tool: {
          tool: 'weather.get_current_and_forecast',
          duration: '31ms',
          result: {
            locations: [
              { city: 'Tokyo, JP', temp_c: 19.4, condition: 'Clear', humidity: '52%', wind_kmh: 12 },
              { city: 'New York, US', temp_c: 14.8, condition: 'Partly Cloudy', humidity: '64%', wind_kmh: 18 }
            ]
          }
        },
        content: [
          `### Telemetry Dispatch: ${weatherServer}`,
          '',
          `Context evaluation prioritized **real-time meteorological telemetry** over internal data stores. Selected **${weatherServer}** with **98% confidence**.`,
          '',
          '#### Current Environmental Conditions',
          '',
          '- **Tokyo, Japan**: **19.4°C** • Clear skies • 52% Humidity • Wind: 12 km/h NE',
          '- **New York, USA**: **14.8°C** • Partly Cloudy • 64% Humidity • Wind: 18 km/h W',
          '',
          'Both endpoints responded in under **32ms** via HTTP SSE streaming.'
        ].join('\n')
      };
    }

    // 3. Filesystem / Code Intent
    if (q.includes('file') || q.includes('dir') || q.includes('folder') || q.includes('package') || q.includes('repo') || q.includes('inspect') || q.includes('git')) {
      return {
        server: filesystemServer,
        rankings: [
          [filesystemServer, 1.91],
          [githubServer, 1.34],
          [databaseServer, 0.42]
        ],
        tool: {
          tool: 'filesystem.read_file',
          duration: '16ms',
          result: {
            filepath: '/Users/chokkaraketankumar/Desktop/Capstone/package.json',
            bytes: 523,
            dependencies: {
              'lucide-react': '^1.52.0',
              'react': '^19.2.8',
              'react-dom': '^19.2.8',
              'react-markdown': '^10.1.0'
            }
          }
        },
        content: [
          `### Workspace Inspection: ${filesystemServer}`,
          '',
          `Routed directly to **${filesystemServer}** (transport: \`stdio\`). Identified target configuration file and extracted root dependencies:`,
          '',
          '```json',
          '{',
          '  "dependencies": {',
          '    "lucide-react": "^1.52.0",',
          '    "react": "^19.2.8",',
          '    "react-dom": "^19.2.8",',
          '    "react-markdown": "^10.1.0"',
          '  },',
          '  "devDependencies": {',
          '    "@vitejs/plugin-react": "^6.1.1",',
          '    "vite": "^8.3.0"',
          '  }',
          '}',
          '```',
          '',
          'All modules are verified and compiled. Zero unnecessary agent loops required.'
        ].join('\n')
      };
    }

    // 4. Multi-Server Benchmark / General Fallback
    return {
      server: databaseServer,
      rankings: [
        [databaseServer, 1.82],
        [filesystemServer, 1.45],
        [weatherServer, 0.88],
        [githubServer, 0.72]
      ],
      tool: {
        tool: 'orchestrator.benchmark_dispatch',
        duration: '28ms',
        result: {
          total_servers_polled: 4,
          avg_latency: '18.4ms',
          silo_token_savings: '86.2%',
          active_memory_slots_used: 3
        }
      },
      content: [
        '### Prioritized Multi-Server Task Complete',
        '',
        `Your query was evaluated across all **${Object.keys(servers).length} registered MCP servers** using the **Context-Aware Prioritization Engine**:`,
        '',
        '1. **Intent Scoring:** Query matched high-priority domain intent',
        `2. **Context Weighing:** Factored in session goals: \`${contextState.activeGoals.join(', ')}\``,
        '3. **Optimal Route:** Selected primary server with zero token loss',
        '4. **Memory Retention:** Stored key metrics in session buffer',
        '',
        '> The orchestrator operates as a single unified control plane — you get seamless multi-server capabilities without managing multiple agents.'
      ].join('\n')
    };
  };

  const handleSend = (text) => {
    const msgText = typeof text === 'string' ? text : inputValue;
    if (!msgText.trim() || isLoading) return;

    const trimmed = msgText.trim();

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInputValue('');
    setIsLoading(true);

    // Simulate orchestrated execution
    setTimeout(() => {
      const generated = generateSimulatedResponse(trimmed);

      // Record to execution history
      const newHistoryItem = {
        id: Date.now(),
        query: trimmed,
        server: generated.server,
        latency: generated.tool?.duration || '24ms',
        confidence: '96%',
        timeAgo: 'Just now'
      };
      setExecutionHistory(prev => [newHistoryItem, ...prev]);

      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          content: generated.content,
          orchestration: settings.showControlPlane ? {
            activeServer: generated.server,
            rankings: generated.rankings,
            query: trimmed,
          } : null,
          toolExecution: settings.showToolPayloads ? generated.tool : null,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setIsLoading(false);
    }, 1400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsSettingsOpen(false);
  };

  const handleResetSettings = () => {
    setSettings({
      showControlPlane: true,
      autoRoute: true,
      persistentMemory: true,
      showToolPayloads: true,
      streamResponses: false,
    });
  };

  // ─── Landing / Auth Screen ───
  if (!isLaunched) {
    return (
      <div className="auth-card-container">
        <AnimatedGlassBackground />
        <div className="auth-glass-card">
          <div className="auth-icon-wrap">
            <Hexagon size={34} color="#ff4444" strokeWidth={2.2} />
          </div>
          <div className="auth-badge">
            <Sparkles size={13} color="#ff6b6b" />
            <span>General-Purpose MCP Orchestrator</span>
          </div>
          <h1 className="auth-title">Universal Control Plane</h1>
          <p className="auth-desc">
            One intelligent orchestration layer sitting across multiple Model Context Protocol servers. Prioritizes real-world tasks using context signals with zero token silos.
          </p>

          <div className="auth-features-grid">
            <div className="auth-feature-chip">
              <Zap size={18} className="feature-chip-icon" />
              <span className="feature-chip-name">Prioritizer</span>
              <span className="feature-chip-desc">Context-Aware</span>
            </div>
            <div className="auth-feature-chip">
              <Network size={18} className="feature-chip-icon" />
              <span className="feature-chip-name">Multi-Server</span>
              <span className="feature-chip-desc">Pluggable</span>
            </div>
            <div className="auth-feature-chip">
              <Brain size={18} className="feature-chip-icon" />
              <span className="feature-chip-name">Memory</span>
              <span className="feature-chip-desc">Zero Silos</span>
            </div>
          </div>

          <button className="auth-connect-btn" onClick={() => setIsLaunched(true)}>
            <span>Launch Orchestrator</span>
            <ArrowRight size={17} />
          </button>

          <div className="auth-footer-credits">
            Powered by <span style={{ color: '#ff6b6b', fontWeight: 600 }}>Model Context Protocol</span> &bull; Red Glass Edition
          </div>
        </div>
      </div>
    );
  }

  // ─── Main App ───
  return (
    <div className="app-container">
      <AnimatedGlassBackground />

      {/* Top Status Header */}
      <StatusPanel
        servers={servers}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenServers={() => setIsServerModalOpen(true)}
        onOpenContext={() => setIsContextDrawerOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={executionHistory.length}
        activeGoal={contextState.activeGoals?.[0] || 'Universal Routing'}
      />

      {/* Main Chat Stream */}
      <main className="main-content">
        <div className="chat-container">
          <div className="messages-list" ref={messagesListRef}>
            {/* Empty State with Starter Prompts */}
            {messages.length === 0 && (
              <div className="empty-state-container">
                <div className="empty-state-icon-wrap">
                  <Hexagon size={34} color="#ff4444" strokeWidth={2.2} />
                </div>
                <h2 className="empty-state-title">Orchestrator Ready</h2>
                <p className="empty-state-subtitle">
                  Select a starter scenario or ask any task. The prioritization engine will rank and route across your registered MCP servers.
                </p>

                {/* Starter Prompts Grid */}
                <div className="starter-prompts-grid">
                  {STARTER_PROMPTS.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        className="starter-prompt-card"
                        onClick={() => handleSend(p.query)}
                      >
                        <div className="prompt-card-icon-wrap">
                          <Icon size={16} color="var(--accent-primary)" />
                        </div>
                        <div className="prompt-card-text">
                          <div className="prompt-card-title">{p.title}</div>
                          <div className="prompt-card-desc">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Stream */}
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                msg={msg}
                isLatestAgentMsg={msg.role === 'agent' && idx === messages.length - 1}
                isThinking={isLoading && idx === messages.length - 1}
              />
            ))}

            {/* Active Loading / Processing Indicator */}
            {isLoading && (
              <div className="activity-indicator">
                <div className="spinner" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>Scoring context & dispatching to MCP servers...</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Evaluating intent &bull; Temporal weighting &bull; Execution handshake
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Dock */}
      <div className="bottom-dock">
        <div className="input-container">
          <div className="input-box">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask anything (e.g. 'Query database orders', 'Scan local files', 'Check Tokyo weather')..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setTimeout(scrollToBottom, 150)}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send query to orchestrator"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="footer-credits">
            Powered by <span className="credit-highlight">Model Context Protocol</span> &bull; General-Purpose Orchestrator
          </div>
        </div>

        {/* 4-Tab Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Context & Memory Drawer */}
      <ContextMemoryDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => {
          setIsContextDrawerOpen(false);
          setActiveTab('chat');
        }}
        contextState={contextState}
        onUpdateContext={setContextState}
      />

      {/* Execution History & Task Log Drawer */}
      <ExecutionHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          setActiveTab('chat');
        }}
        history={executionHistory}
        onSelectQuery={(q) => handleSend(q)}
        onClearHistory={() => setExecutionHistory([])}
      />

      {/* Server Config Modal */}
      <ServerConfigModal
        key={serverDetails.length}
        isOpen={isServerModalOpen}
        onClose={() => {
          setIsServerModalOpen(false);
          setActiveTab('chat');
        }}
        servers={servers}
        serverDetails={serverDetails}
        onAddServer={handleAddServer}
        onSaveServers={setServers}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onToggleSetting={handleToggleSetting}
        onClearChat={handleClearChat}
        onResetSettings={handleResetSettings}
      />
    </div>
  );
}
