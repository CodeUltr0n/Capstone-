import React, { useState, useRef, useEffect } from 'react';
import { Shield, ChevronDown, Settings, Hexagon, Brain, History, Server, Activity } from 'lucide-react';

export default function StatusPanel({
  servers = {},
  onOpenSettings,
  onOpenServers,
  onOpenContext,
  onOpenHistory,
  historyCount = 0,
  activeGoal = 'General Routing'
}) {
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const mcpDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mcpDropdownRef.current && !mcpDropdownRef.current.contains(e.target)) {
        setIsMcpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'connected') return 'connected';
    if (status === 'pending' || status === 'connecting') return 'pending';
    return 'disconnected';
  };

  const getStatusString = (status) => {
    if (status === 'connected') return 'Online';
    if (status === 'pending' || status === 'connecting') return 'Connecting';
    return 'Offline';
  };

  const serverCount = Object.keys(servers).length;
  const connectedCount = Object.values(servers).filter(v => v === 'connected').length;

  const getOverallStatus = () => {
    const vals = Object.values(servers);
    if (vals.length === 0) return 'disconnected';
    if (vals.every(v => v === 'connected')) return 'connected';
    if (vals.some(v => v === 'connected')) return 'pending';
    return 'disconnected';
  };

  return (
    <header className="header-panel collapsed-header" role="banner">
      {/* Brand & Title */}
      <div className="header-left">
        <div className="header-logo" title="MCP Orchestrator Control Plane">
          <Hexagon size={17} color="#ff5555" strokeWidth={2.4} className="header-logo-icon" />
        </div>
        <div className="header-brand-wrap">
          <span className="header-brand">MCP Orchestrator</span>
          <span className="header-brand-sub">Control Plane</span>
        </div>
      </div>

      {/* Middle Context & Latency Ambient Badges */}
      <div className="header-center-ambient">
        <button
          type="button"
          className="ambient-pill-btn context-pill"
          onClick={onOpenContext}
          title="Inspect session context & memory"
        >
          <Brain size={12} color="var(--accent-primary)" />
          <span className="ambient-pill-text">{activeGoal}</span>
        </button>

        <div className="ambient-pill-btn latency-pill" title="Gateway routing latency">
          <Activity size={12} color="#4ade80" />
          <span>14ms</span>
        </div>
      </div>

      {/* Right Actions Cluster */}
      <div className="header-actions-cluster">
        {/* Context Button */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenContext}
          title="Context & Memory Buffer"
          aria-label="Open Context & Memory"
        >
          <Brain size={15} />
        </button>

        {/* History Button */}
        <button
          type="button"
          className="header-icon-btn history-btn-wrap"
          onClick={onOpenHistory}
          title="Execution Task History"
          aria-label="Open Task History"
        >
          <History size={15} />
          {historyCount > 0 && <span className="history-count-badge">{historyCount}</span>}
        </button>

        {/* MCP Status Indicator Dropdown */}
        <div className="mcp-dropdown-container" ref={mcpDropdownRef}>
          <button
            type="button"
            className={`mcp-compact-badge ${isMcpOpen ? 'active' : ''}`}
            onClick={() => setIsMcpOpen(prev => !prev)}
            title="MCP Server Network Status"
            aria-label="MCP Server Status"
            aria-expanded={isMcpOpen}
          >
            <div className={`status-dot ${getOverallStatus()}`} />
            <span className="mcp-badge-label">
              {connectedCount}/{serverCount} MCP
            </span>
            <ChevronDown size={12} className={`mcp-chevron ${isMcpOpen ? 'rotated' : ''}`} />
          </button>

          {isMcpOpen && (
            <div className="mcp-popover-menu">
              <div className="mcp-popover-header">
                <Shield size={13} color="var(--accent-primary)" />
                <span>REGISTERED MCP SERVERS</span>
              </div>

              <div className="mcp-popover-list">
                {Object.entries(servers).length === 0 ? (
                  <div className="mcp-empty-dropdown">
                    No servers configured
                  </div>
                ) : (
                  Object.entries(servers).map(([name, status]) => (
                    <div key={name} className="mcp-popover-item">
                      <div className={`status-dot ${getStatusClass(status)}`} />
                      <div className="popover-server-meta">
                        <span className="popover-server-name">{name}</span>
                        <span className="popover-server-sub">
                          {status === 'connected' ? '12ms • 8 tools' : 'Unreachable'}
                        </span>
                      </div>
                      <span className={`popover-server-status ${getStatusClass(status)}`}>
                        {getStatusString(status)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mcp-popover-footer">
                <button
                  type="button"
                  className="popover-action-btn"
                  onClick={() => {
                    setIsMcpOpen(false);
                    onOpenServers?.();
                  }}
                >
                  <Server size={12} />
                  <span>Configure Servers</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="Settings & Config"
          aria-label="Open Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
