import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Hexagon, Sparkles, ArrowRight, Zap, Network, Brain } from 'lucide-react';
import AnimatedGlassBackground from './components/AnimatedGlassBackground';
import StatusPanel from './components/StatusPanel';
import Message from './components/Message';
import BottomNav from './components/BottomNav';
import ServerConfigModal from './components/ServerConfigModal';
import SettingsDrawer from './components/SettingsDrawer';
import ContextMemoryDrawer from './components/ContextMemoryDrawer';
import ExecutionHistoryDrawer from './components/ExecutionHistoryDrawer';
import Toast from './components/Toast';
import { supabase } from './lib/supabase';

// ──── Initial Seed Data ────
const INITIAL_SERVERS = {
  'PostgreSQL MCP': 'connected',
  'Local Filesystem': 'connected',
  'Weather API': 'connected',
  'GitHub MCP': 'connected',
  'Brave Search': 'pending',
};

const QUICK_INTENT_CHIPS = [
  { label: '🗄️ Query Orders', query: 'Query the database for the top 5 highest-value orders this week and calculate revenue.' },
  { label: '⛅ Tokyo Weather', query: 'Get the current weather forecast, wind speed, and precipitation for Tokyo and New York.' },
  { label: '📁 package.json', query: 'Inspect our workspace directory for package.json and list all declared dependencies.' },
  { label: '⚡ Priority Test', query: 'Benchmark orchestration latency across database, filesystem, and external weather MCP servers.' },
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
  const [serverDetails, setServerDetails] = useState([]);
  const [serversLoading, setServersLoading] = useState(!!supabase);
  const [activeTab, setActiveTab] = useState('chat');
  const [toast, setToast] = useState(null);

  // Derive the servers status map from serverDetails (single source of truth)
  const servers = useMemo(() => {
    if (serverDetails.length > 0) {
      return Object.fromEntries(serverDetails.map(s => [s.name, s.status]));
    }
    return INITIAL_SERVERS;
  }, [serverDetails]);

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

  // Helper to show a toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const loadServers = async () => {
      setServersLoading(true);
      try {
        const { data, error } = await supabase
          .from('mcp_servers')
          .select('id, name, url, transport, status, last_latency_ms');

        if (error) {
          console.error('Failed to load MCP servers:', error);
          setServerDetails([]);
          showToast('Failed to load servers from database');
          return;
        }

        if (!data?.length) {
          console.warn('No MCP servers found in Supabase, using fallback data.');
          setServerDetails([]);
          return;
        }

        setServerDetails(data);
      } catch (err) {
        console.error('Supabase request threw:', err);
        setServerDetails([]);
        showToast('Connection to database failed');
      } finally {
        setServersLoading(false);
      }
    };

    loadServers();
  }, [showToast]);

  const handleAddServer = async (server) => {
    if (!supabase) return { success: false };

    // Check for duplicate name
    if (serverDetails.some(s => s.name.toLowerCase() === server.name.toLowerCase())) {
      showToast(`Server "${server.name}" already exists`);
      return { success: false };
    }

    const { data, error } = await supabase
      .from('mcp_servers')
      .insert({
        name: server.name,
        url: server.url,
        transport: server.transport,
        status: server.status,
        last_latency_ms: parseInt(server.latency, 10) || null,
      })
      .select('id, name, url, transport, status, last_latency_ms')
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        showToast(`Server "${server.name}" already exists`);
      } else {
        console.error('Unable to add MCP server:', error);
        showToast('Failed to save server to database');
      }
      return { success: false };
    }

    setServerDetails(prev => [...prev, data]);
    showToast('Server added successfully', 'success');
    return { success: true };
  };

  const handleDeleteServer = async (serverToDelete) => {
    if (!supabase) return { success: false };

    // If server has an id from Supabase, delete by id; otherwise by name
    const query = serverToDelete.id
      ? supabase.from('mcp_servers').delete().eq('id', serverToDelete.id)
      : supabase.from('mcp_servers').delete().eq('name', serverToDelete.name);

    const { error } = await query;

    if (error) {
      console.error('Unable to delete MCP server:', error);
      showToast('Failed to remove server from database');
      return { success: false };
    }

    setServerDetails(prev => prev.filter(s =>
      serverToDelete.id ? s.id !== serverToDelete.id : s.name !== serverToDelete.name
    ));
    showToast('Server removed', 'success');
    return { success: true };
  };

  const handleUpdateServer = async (serverToUpdate, updates) => {
    if (!supabase) return { success: false };

    const query = serverToUpdate.id
      ? supabase.from('mcp_servers').update(updates).eq('id', serverToUpdate.id)
      : supabase.from('mcp_servers').update(updates).eq('name', serverToUpdate.name);

    const { error } = await query.select('id, name, url, transport, status, last_latency_ms').single();

    if (error) {
      console.error('Unable to update MCP server:', error);
      showToast('Failed to update server in database');
      return { success: false };
    }

    setServerDetails(prev => prev.map(s => {
      const match = serverToUpdate.id ? s.id === serverToUpdate.id : s.name === serverToUpdate.name;
      return match ? { ...s, ...updates } : s;
    }));
    return { success: true };
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
            <Hexagon size={32} color="var(--accent-primary)" strokeWidth={2.2} />
          </div>
          <div className="auth-badge">
            <Sparkles size={13} color="var(--accent-primary)" />
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
            Powered by <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Model Context Protocol</span> &bull; Neural Control Plane
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
            {/* Minimalist Premium Hero */}
            {messages.length === 0 && (
              <div className="empty-state-container">
                <div className="empty-state-icon-wrap">
                  <Hexagon size={28} color="var(--accent-primary)" strokeWidth={2.2} />
                </div>
                <div className="bento-hero-badge">
                  <span className="bento-badge-dot" />
                  <span>UNIVERSAL CONTROL PLANE</span>
                </div>
                <h1 className="bento-hero-title">Where should we orchestrate?</h1>
                <p className="bento-hero-sub">
                  Ask any question or dispatch tasks. The prioritization engine scores intent and routes to your registered MCP servers with zero token overhead.
                </p>
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

      {/* Floating Command Dock */}
      <div className="floating-command-dock">
        {/* Quick Intent Chips */}
        <div className="quick-chips-row">
          <span className="quick-chips-label">QUICK ROUTE:</span>
          {QUICK_INTENT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="quick-chip-btn"
              onClick={() => handleSend(chip.query)}
              disabled={isLoading}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Command Input Island */}
        <div className="command-input-island">
          <div className="dock-mode-pill" title="Dynamic intent prioritization">
            <Zap size={11} />
            <span>Auto-Route</span>
          </div>

          <input
            type="text"
            className="chat-input"
            placeholder="Type a task or select a prompt above..."
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
            <Send size={13} />
            <kbd className="dock-kbd-badge">↵</kbd>
          </button>
        </div>

        {/* Dock Telemetry Bar */}
        <div className="dock-telemetry-bar">
          <div className="dock-telemetry-left">
            <span className="telemetry-live-dot" />
            <span>{Object.keys(servers).length} MCP NODES CONNECTED</span>
          </div>
          <div className="dock-telemetry-item">
            <span>LATENCY: <strong>14MS</strong></span>
          </div>
          <div className="dock-telemetry-item">
            <span>TOKEN SAVINGS: <strong>86.2%</strong></span>
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
        isOpen={isServerModalOpen}
        onClose={() => {
          setIsServerModalOpen(false);
          setActiveTab('chat');
        }}
        servers={servers}
        serverDetails={serverDetails}
        serversLoading={serversLoading}
        onAddServer={handleAddServer}
        onDeleteServer={handleDeleteServer}
        onUpdateServer={handleUpdateServer}
      />

      {/* Toast Notifications */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

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
