import React, { useState } from 'react';
import { Settings, X, Hexagon, Sliders, Shield, Palette, Database, Trash2, RotateCcw, Sparkles } from 'lucide-react';

export default function SettingsDrawer({
  isOpen,
  onClose,
  settings = {},
  onToggleSetting,
  onClearChat,
  onResetSettings,
  onOpenTour
}) {
  const [apiToken, setApiToken] = useState(() => {
    try { return window.sessionStorage.getItem('orchestrator_api_token') || ''; } catch { return ''; }
  });
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
                <div className="settings-toggle-desc">Display the server and tool match scores for each request</div>
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
              FastAPI Backend
            </div>

            <div className="config-input-group" style={{ marginTop: '10px' }}>
              <label htmlFor="backend-api-token">Backend access token (optional)</label>
              <input
                id="backend-api-token"
                className="config-input"
                type="password"
                autoComplete="off"
                placeholder="Required only when backend auth is enabled"
                value={apiToken}
                onChange={(event) => {
                  const value = event.target.value;
                  setApiToken(value);
                  try {
                    if (value) window.sessionStorage.setItem('orchestrator_api_token', value);
                    else window.sessionStorage.removeItem('orchestrator_api_token');
                  } catch { /* Keep current-session app usable if storage is unavailable. */ }
                }}
              />
              <div className="settings-toggle-desc">Kept in this browser tab’s session storage. Configure the same value as ORCHESTRATOR_API_KEY on the backend.</div>
            </div>

            <div className="backend-bridge-card">
              <div className="bridge-status-row">
                <span className="bridge-status-pill ready">Frontend Ready</span>
                <span className="bridge-port-badge">PORT 8000</span>
              </div>
              <div className="bridge-desc">
                Start it with <code>cd backend && uvicorn app:app --reload --port 8000</code>. Vite proxies <code>/api</code> to <code>http://127.0.0.1:8000</code>.
              </div>
              <div className="bridge-proxy-list">
                <span>API endpoints:</span>
                <code>/api/chat</code> &bull; <code>/api/servers</code> &bull; <code>/api/history</code> &bull; <code>/api/health</code>
              </div>
            </div>
          </div>

          {/* Appearance & Tone */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Palette size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Theme Appearance
            </div>
            <div className="theme-palette-row">
              <div className="palette-chip active">
                <span className="palette-dot" style={{ background: '#3b82f6' }} />
                <span>Neural Slate</span>
              </div>
              <div className="palette-chip">
                <span className="palette-dot" style={{ background: '#6366f1' }} />
                <span>Indigo Dusk</span>
              </div>
              <div className="palette-chip">
                <span className="palette-dot" style={{ background: '#71717a' }} />
                <span>Zinc Minimal</span>
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
                <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>
                  MCP Orchestrator v2.0
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Universal Model Context Protocol orchestrator frontend. Built with React + Vite and neural slate styling.
              </p>
              <button
                type="button"
                className="drawer-action-row-btn"
                style={{ marginTop: '10px' }}
                onClick={() => {
                  onClose?.();
                  onOpenTour?.();
                }}
              >
                <Sparkles size={13} color="var(--accent-primary)" />
                <span>View Architecture Spec & Tour</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
