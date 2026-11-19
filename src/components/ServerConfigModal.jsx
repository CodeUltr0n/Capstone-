import React, { useState, useMemo } from 'react';
import { Server, Plus, Trash2, X, Zap, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';

const PRESET_SERVERS = [
  { name: 'PostgreSQL MCP', url: 'stdio: python3 backend/mock_domain_servers.py', transport: 'STDIO' },
  { name: 'Local Filesystem', url: 'stdio: python3 backend/mock_domain_servers.py', transport: 'STDIO' },
  { name: 'Weather API', url: 'stdio: python3 backend/mock_domain_servers.py', transport: 'STDIO' },
  { name: 'Rapid Delivery Node', url: 'stdio: python3 backend/mock_domain_servers.py', transport: 'STDIO' },
  { name: 'Scheduled Booking Node', url: 'stdio: python3 backend/mock_domain_servers.py', transport: 'STDIO' }
];

export default function ServerConfigModal({
  isOpen,
  onClose,
  servers = {},
  serverDetails = [],
  serversLoading = false,
  onAddServer,
  onDeleteServer,
  onPingServer,
}) {
  // Build the display list from the backend registry, with a status-only fallback.
  const serverList = useMemo(() => {
    if (serverDetails.length > 0) {
      return serverDetails.map(server => ({
        ...server,
        latency: server.last_latency_ms ? `${server.last_latency_ms}ms` : null,
      }));
    }
    return Object.entries(servers).map(([name, status]) => ({
      name,
      status,
      transport: 'HTTP',
    }));
  }, [serverDetails, servers]);

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTransport, setNewTransport] = useState('SSE');
  const [showAddForm, setShowAddForm] = useState(false);
  const [pingingIndex, setPingingIndex] = useState(null);
  const [addingServer, setAddingServer] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);

  if (!isOpen) return null;

  const handleAddServer = async () => {
    if (!newName.trim() || addingServer) return;

    const server = {
      name: newName.trim(),
      url: newUrl.trim() || 'http://localhost:8080/mcp',
      transport: newTransport,
      status: 'pending',
    };

    setAddingServer(true);
    const result = await onAddServer?.(server);
    setAddingServer(false);

    if (result?.success !== false) {
      setNewName('');
      setNewUrl('');
      setShowAddForm(false);
    }
  };

  const handleAddPreset = async (preset) => {
    if (serverList.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) return;

    const server = {
      ...preset,
      status: 'pending',
    };

    await onAddServer?.(server);
  };

  const handleRemoveServer = async (idx) => {
    const server = serverList[idx];
    if (!server || deletingIndex !== null) return;

    setDeletingIndex(idx);
    await onDeleteServer?.(server);
    setDeletingIndex(null);
  };

  const handlePingServer = async (idx) => {
    setPingingIndex(idx);
    try {
      await onPingServer?.(serverList[idx]);
    } finally {
      setPingingIndex(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>
            <Server size={18} color="var(--accent-primary)" />
            MCP Server Registrations
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Add Presets */}
          <div className="preset-chips-section">
            <span className="preset-label">1-Click Presets:</span>
            <div className="preset-chips-wrap">
              {PRESET_SERVERS.map(p => {
                const isAdded = serverList.some(s => s.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    className={`preset-chip-btn ${isAdded ? 'added' : ''}`}
                    onClick={() => !isAdded && handleAddPreset(p)}
                    disabled={isAdded}
                  >
                    {isAdded ? <CheckCircle2 size={11} color="var(--status-success)" /> : <Plus size={11} />}
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configured Servers List */}
          <div className="server-list-heading">
            <span>REGISTERED SERVERS ({serverList.length})</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Auto-scored by Priority Engine</span>
          </div>

          {serversLoading ? (
            <div className="empty-substate">
              <Loader2 size={28} className="spin-icon" style={{ marginBottom: '10px', opacity: 0.6 }} />
              <p style={{ fontSize: '13px', marginBottom: '4px' }}>Loading servers…</p>
            </div>
          ) : serverList.length === 0 && !showAddForm ? (
            <div className="empty-substate">
              <Zap size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', marginBottom: '4px' }}>No MCP servers configured</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Add servers or click presets above to enable orchestration</p>
            </div>
          ) : (
            serverList.map((server, idx) => (
              <div key={server.id || server.name} className="server-card-item">
                <div className={`status-dot ${server.status === 'connected' ? 'connected' : server.status === 'error' ? 'disconnected' : 'pending'}`} />
                <div className="server-card-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="server-card-name">{server.name}</span>
                    <span className="server-transport-badge">{server.transport || 'SSE'}</span>
                    {server.latency && (
                      <span className="server-latency-tag">{server.latency}</span>
                    )}
                  </div>
                  {server.url && <div className="server-card-url">{server.url}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="server-ping-btn"
                    onClick={() => handlePingServer(idx)}
                    disabled={pingingIndex === idx}
                    title="Test server handshake"
                  >
                    <RefreshCw size={12} className={pingingIndex === idx ? 'spin-icon' : ''} />
                    <span>Ping</span>
                  </button>

                  <button
                    className="server-remove-btn"
                    onClick={() => handleRemoveServer(idx)}
                    disabled={deletingIndex !== null}
                    title="Remove server"
                  >
                    {deletingIndex === idx
                      ? <Loader2 size={13} className="spin-icon" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add Custom Server Form */}
          {showAddForm ? (
            <div className="add-server-form-card">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                Add Custom MCP Server
              </div>
              <div className="config-input-group">
                <label>Server Identifier</label>
                <input
                  className="config-input"
                  placeholder="e.g. Analytics MCP, Slack Gateway..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="config-input-group">
                <label>Transport Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['SSE', 'STDIO', 'HTTP'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`transport-select-btn ${newTransport === t ? 'active' : ''}`}
                      onClick={() => setNewTransport(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-input-group">
                <label>Endpoint / Executable Command</label>
                <input
                  className="config-input"
                  placeholder={newTransport === 'STDIO' ? 'stdio: npx -y @modelcontextprotocol/...' : 'http://localhost:8080/mcp'}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddServer()}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="modal-btn secondary" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  style={{ flex: 1 }}
                  onClick={handleAddServer}
                  disabled={!newName.trim() || addingServer}
                >
                  {addingServer
                    ? <><Loader2 size={14} className="spin-icon" /> Saving…</>
                    : <><Plus size={14} /> Add Server</>
                  }
                </button>
              </div>
            </div>
          ) : (
            <button className="add-server-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={15} />
              Add Custom Server
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
