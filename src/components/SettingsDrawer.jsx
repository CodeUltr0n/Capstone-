import React from 'react';
import { Settings, X, Hexagon, Sliders, Shield, Palette, Database, Trash2, RotateCcw } from 'lucide-react';

export default function SettingsDrawer({
  isOpen,
  onClose,
  settings = {},
  onToggleSetting,
  onClearChat,
  onResetSettings
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="settings-drawer-backdrop" onClick={onClose} />
      <div className="settings-drawer" role="dialog" aria-modal="true" aria-label="Settings Drawer">
        <div className="settings-drawer-header">
          <h3>
            <Settings size={17} color="var(--accent-primary)" />
            Control Plane Settings
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            <X size={14} />
          </button>
        </div>

        <div className="settings-drawer-body">
          {/* Orchestration Section */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Sliders size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Orchestration Engine
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Show Routing Timeline</div>
                <div className="settings-toggle-desc">Display intent classification & confidence scores</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showControlPlane ?? true}
                  onChange={() => onToggleSetting('showControlPlane')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Context-Aware Prioritizer</div>
                <div className="settings-toggle-desc">Rank servers by time, intent, and historical signals</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoRoute ?? true}
                  onChange={() => onToggleSetting('autoRoute')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Persistent Memory Buffer</div>
                <div className="settings-toggle-desc">Retain preferences across tasks without token silos</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.persistentMemory ?? true}
                  onChange={() => onToggleSetting('persistentMemory')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Show Tool Payloads</div>
                <div className="settings-toggle-desc">Render collapsible JSON tool execution results</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showToolPayloads ?? true}
                  onChange={() => onToggleSetting('showToolPayloads')}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Backend Proxy Bridge Info */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Database size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Python Backend Bridge
            </div>

            <div className="backend-bridge-card">
              <div className="bridge-status-row">
                <span className="bridge-status-pill ready">Frontend Ready</span>
                <span className="bridge-port-badge">PORT 8000</span>
              </div>
              <div className="bridge-desc">
                When you run your Python backend (<code>python server.py</code> or FastAPI), Vite automatically proxies <code>/mcp</code>, <code>/chat</code>, and <code>/servers</code> to <code>http://127.0.0.1:8000</code>.
              </div>
              <div className="bridge-proxy-list">
                <span>Proxy endpoints:</span>
                <code>/chat</code> &bull; <code>/mcp</code> &bull; <code>/servers</code> &bull; <code>/health</code>
              </div>
            </div>
          </div>

          {/* Appearance & Tone */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Palette size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Red Glass Tone
            </div>
            <div className="theme-palette-row">
              <div className="palette-chip active">
                <span className="palette-dot" style={{ background: '#ff4444' }} />
                <span>Crimson Red</span>
              </div>
              <div className="palette-chip">
                <span className="palette-dot" style={{ background: '#e11d48' }} />
                <span>Deep Wine</span>
              </div>
              <div className="palette-chip">
                <span className="palette-dot" style={{ background: '#f43f5e' }} />
                <span>Ruby Silk</span>
              </div>
            </div>
          </div>

          {/* Session Data Actions */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Shield size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Session Maintenance
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="drawer-action-row-btn"
                onClick={onClearChat}
              >
                <Trash2 size={13} color="var(--accent-primary)" />
                <span>Clear Chat History</span>
              </button>

              <button
                type="button"
                className="drawer-action-row-btn"
                onClick={onResetSettings}
              >
                <RotateCcw size={13} />
                <span>Reset to Default Settings</span>
              </button>
            </div>
          </div>

          {/* About */}
          <div className="settings-section" style={{ borderBottom: 'none' }}>
            <div className="settings-about-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Hexagon size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '13px' }}>
                  MCP Orchestrator v1.0
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Universal Model Context Protocol orchestrator frontend. Built with modern React + Vite and dark crimson glass styling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
