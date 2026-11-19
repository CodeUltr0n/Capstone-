import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Hexagon, ArrowRight, Zap, Network, Brain, Terminal, X } from 'lucide-react';
import AnimatedGlassBackground from './components/AnimatedGlassBackground';
import StatusPanel from './components/StatusPanel';
import Message from './components/Message';
import BottomNav from './components/BottomNav';
import ServerConfigModal from './components/ServerConfigModal';
import SettingsDrawer from './components/SettingsDrawer';
import ContextMemoryDrawer from './components/ContextMemoryDrawer';
import ExecutionHistoryDrawer from './components/ExecutionHistoryDrawer';
import Toast from './components/Toast';
import { api, formatHistoryItem } from './lib/api';

const QUICK_INTENT_CHIPS = [
  { label: '🗄️ Query Orders', query: 'Query the database for the top 5 highest-value orders this week and calculate revenue.' },
  { label: '⛅ Tokyo Weather', query: 'Get the current weather forecast, wind speed, and precipitation for Tokyo and New York.' },
  { label: '📁 package.json', query: 'Inspect our workspace directory for package.json and list all declared dependencies.' },
  { label: '⚡ Priority Test', query: 'Benchmark orchestration latency across database, filesystem, and external weather MCP servers.' },
];


export default function App() {
  const [isLaunched, setIsLaunched] = useState(false);

  const handleLaunch = useCallback(() => {
    setIsLaunched(true);
  }, []);

  useEffect(() => {
    // Clear any stale persistence flag so the launcher is always accessible
    try {
      localStorage.removeItem('mcp_orchestrator_launched');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLaunched) {
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          handleLaunch();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLaunched, handleLaunch]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverDetails, setServerDetails] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('chat');
  const [toast, setToast] = useState(null);

  // Derive the servers status map from serverDetails (single source of truth)
  const servers = useMemo(() => {
    if (serverDetails.length > 0) {
      return Object.fromEntries(serverDetails.map(s => [s.name, s.status]));
    }
    return {};
  }, [serverDetails]);

  // Modals & Drawers state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Context & Execution History state
  const [contextState, setContextState] = useState(() => {
    try {
      const saved = localStorage.getItem('mcp_orchestrator_context');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore malformed or unavailable browser storage.
    }
    return { activeGoals: [], memorySlots: [], urgencyWeight: 0.5 };
  });
  const [executionHistory, setExecutionHistory] = useState([]);

  // Settings
  const [settings, setSettings] = useState({
    showControlPlane: true,
    showToolPayloads: true,
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
    try {
      localStorage.setItem('mcp_orchestrator_context', JSON.stringify(contextState));
    } catch {
      // Context remains usable for the current page session if storage is unavailable.
    }
  }, [contextState]);

  // Helper to show a toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setServersLoading(true);
      try {
        const [health, serverRows, historyRows] = await Promise.all([api.health(), api.listServers(), api.listHistory()]);
        setBackendStatus(health.status === 'ok' ? 'online' : 'offline');
        setServerDetails(serverRows);
        setExecutionHistory(historyRows.map(formatHistoryItem));
      } catch (error) {
        setBackendStatus('offline');
        console.error('Unable to load orchestrator data.', error);
        showToast('Backend unavailable. Start the FastAPI service to load servers and history.');
      } finally {
        setServersLoading(false);
      }
    };
    loadData();
  }, [showToast]);

  const handleAddServer = async (server) => {
    try {
      const saved = await api.addServer({ name: server.name, url: server.url, transport: server.transport });
      setServerDetails(prev => [...prev, saved]);
      showToast('Server added. Ping it to verify the MCP connection.', 'success');
      return { success: true };
    } catch (error) {
      showToast(error.message);
      return { success: false };
    }
  };

  const handleDeleteServer = async (server) => {
    try {
      await api.deleteServer(server.id);
      setServerDetails(prev => prev.filter(item => item.id !== server.id));
      showToast('Server removed', 'success');
      return { success: true };
    } catch (error) {
      showToast(error.message);
      return { success: false };
    }
  };

  const handlePingServer = async (server) => {
    try {
      const result = await api.pingServer(server.id);
      setServerDetails(prev => prev.map(item => item.id === server.id
        ? { ...item, status: result.status, last_latency_ms: result.latency_ms }
        : item));
      if (result.status === 'connected') {
        showToast(`MCP handshake complete: ${result.tools_count} tools in ${result.latency_ms}ms`, 'success');
      } else {
        showToast(result.error || 'MCP server is unreachable');
      }
      return result;
    } catch (error) {
      showToast(error.message);
      return { status: 'error', error: error.message };
    }
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

  const handleSend = async (text, requestOptions = {}) => {
    const msgText = typeof text === 'string' ? text : inputValue;
    if (!msgText.trim() || isLoading) return;

    const trimmed = msgText.trim();
    if (!requestOptions.retry) {
      setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    }
    setInputValue('');
    setIsLoading(true);

    try {
      const chatOptions = { ...requestOptions };
      delete chatOptions.retry;
      chatOptions.context_goals = contextState.activeGoals || [];
      const result = await api.chat(trimmed, chatOptions);
      setBackendStatus('online');
      setMessages(prev => [...prev, {
        role: 'agent',
        content: result.content,
        orchestration: settings.showControlPlane && result.server !== 'No server' ? {
          activeServer: result.server,
          rankings: result.rankings,
          query: trimmed,
        } : null,
        toolExecution: result.tool ? {
          ...result.tool,
          server_id: result.server_id,
          query: trimmed,
          showPayload: settings.showToolPayloads,
        } : null,
        status: result.status,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      try {
        const historyRows = await api.listHistory();
        setExecutionHistory(historyRows.map(formatHistoryItem));
      } catch (error) {
        console.error('Unable to refresh execution history.', error);
      }
    } catch (error) {
      setBackendStatus('offline');
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `### Backend unavailable\n\n${error.message}\n\nStart the API with \`cd backend && uvicorn app:app --reload --port 8000\`.`,
        status: 'error',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
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
      showToolPayloads: true,
    });
  };

  // ─── Landing / Auth Screen ───
  if (!isLaunched) {
    return (
      <div className="auth-card-container">
        <AnimatedGlassBackground />
        <div className="studio-onboarding-card">
          {/* Top Bar: Eyebrow + Status + Dismiss */}
          <div className="onboarding-top-bar">
            <div className="onboarding-eyebrow">
              <div className="onboarding-icon-hex">
                <Hexagon size={13} color="var(--accent-primary)" />
              </div>
              <span className="onboarding-eyebrow-text">MCP CONTROL PLANE ARCHITECTURE</span>
            </div>
            <div className="onboarding-top-actions">
              <div className="onboarding-status-pill">
                <span className="onboarding-live-dot" />
                <span>{Object.values(servers).filter(status => status === 'connected').length} NODES ONLINE</span>
              </div>
              <button
                type="button"
                className="onboarding-close-btn"
                onClick={handleLaunch}
                title="Enter Workspace"
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Hero Heading */}
          <div className="onboarding-hero-text">
            <h1 className="studio-onboarding-title">Universal Control Plane</h1>
            <p className="studio-onboarding-desc">
              FastAPI orchestration layer that discovers tools across your registered Model Context Protocol servers and routes requests to real MCP tools.
            </p>
          </div>

          {/* 3 Architecture Pillars */}
          <div className="onboarding-pillars-grid">
            <div className="pillar-card">
              <div className="pillar-card-header">
                <div className="pillar-icon-box">
                  <Zap size={14} />
                </div>
                <span className="pillar-tag">// 01 • SCORING</span>
              </div>
              <h3 className="pillar-title">Dynamic Prioritizer</h3>
              <p className="pillar-desc">
                Query and tool-description matching to select a relevant MCP tool.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-card-header">
                <div className="pillar-icon-box">
                  <Network size={14} />
                </div>
                <span className="pillar-tag">// 02 • MESH</span>
              </div>
              <h3 className="pillar-title">Multi-Server Fabric</h3>
              <p className="pillar-desc">
                Register servers over STDIO, SSE, and Streamable HTTP, then ping to verify their MCP handshake.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-card-header">
                <div className="pillar-icon-box">
                  <Brain size={14} />
                </div>
                <span className="pillar-tag">// 03 • CONTEXT</span>
              </div>
              <h3 className="pillar-title">Session Context</h3>
              <p className="pillar-desc">
                Session goals and memory notes are available in the control panel.
              </p>
            </div>
          </div>

          {/* Live Handshake Telemetry Terminal */}
          <div className="onboarding-terminal-box">
            <div className="terminal-box-header">
              <div className="terminal-dots">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
              </div>
              <div className="terminal-box-title">
                <Terminal size={11} />
                <span>backend-health.log</span>
              </div>
              <span className="terminal-latency-badge">API {backendStatus}</span>
            </div>
            <div className="terminal-code-body">
              <div className="terminal-line">
                <span className="t-dim">[00:01.04]</span> <span className="t-accent">api.health()</span> &rarr; <span className={backendStatus === 'online' ? 't-success' : 't-dim'}>{backendStatus}</span>
              </div>
              <div className="terminal-line">
                <span className="t-dim">[00:01.12]</span> <span className="t-accent">server.registry:</span> {Object.keys(servers).length} registered MCP servers
              </div>
              <div className="terminal-line">
                <span className="t-dim">[00:01.18]</span> {backendStatus === 'online' ? 'ready for prompt dispatch' : 'start the FastAPI service to dispatch prompts'}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="onboarding-cta-wrap">
            <button className="studio-launch-btn" onClick={handleLaunch}>
              <span>Enter Orchestrator Workspace</span>
              <ArrowRight size={15} />
              <span className="studio-btn-kbd">↵</span>
            </button>
            <div className="onboarding-footer-credits">
              <span>Tip: Re-open this spec anytime in Settings &bull; Preference saved in local storage</span>
            </div>
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
        onOpenTour={() => setIsLaunched(false)}
        historyCount={executionHistory.length}
        backendStatus={backendStatus}
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
                  Ask a task. The backend matches it against discovered MCP tools and reports the result of the selected tool call.
                </p>
              </div>
            )}

            {/* Message Stream */}
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                msg={msg}
                onSubmitToolArguments={(arguments_) => handleSend(msg.toolExecution?.query, {
                  retry: true,
                  server_id: msg.toolExecution?.server_id,
                  tool_name: msg.toolExecution?.tool,
                  arguments: arguments_,
                })}
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
            <span>{Object.values(servers).filter(status => status === 'connected').length}/{Object.keys(servers).length} MCP NODES ONLINE</span>
          </div>
          <div className="dock-telemetry-item">
            <span>BACKEND: <strong>{backendStatus.toUpperCase()}</strong></span>
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
        onClearHistory={async () => {
          try { await api.clearHistory(); setExecutionHistory([]); }
          catch (error) { showToast(error.message); }
        }}
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
        onPingServer={handlePingServer}
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
        onOpenTour={() => setIsLaunched(false)}
      />
    </div>
  );
}
