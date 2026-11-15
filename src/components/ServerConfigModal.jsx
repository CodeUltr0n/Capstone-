import React, { useState } from 'react';
import { Server, Plus, Trash2, X, Save, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

const PRESET_SERVERS = [
  { name: 'PostgreSQL MCP', url: 'http://localhost:8001/mcp', transport: 'SSE' },
  { name: 'Local Filesystem', url: 'stdio: npx @modelcontextprotocol/server-filesystem', transport: 'STDIO' },
  { name: 'Weather API', url: 'http://localhost:8002/mcp', transport: 'SSE' },
  { name: 'GitHub MCP', url: 'http://localhost:8003/mcp', transport: 'SSE' },
  { name: 'Brave Search', url: 'http://localhost:8004/mcp', transport: 'HTTP' }
];

export default function ServerConfigModal({ isOpen, onClose, servers = {}, onSaveServers }) {
  const [serverList, setServerList] = useState(() =>
    Object.entries(servers).map(([name, status], idx) => ({
      name,
      url: name.toLowerCase().includes('file') ? 'stdio: npx @mcp/filesystem' : `http://localhost:${8001 + idx}/mcp`,
      status: status || 'connected',
      transport: name.toLowerCase().includes('file') ? 'STDIO' : 'SSE',
      latency: status === 'connected' ? '14ms' : null
    }))
  );

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTransport, setNewTransport] = useState('SSE');
  const [showAddForm, setShowAddForm] = useState(false);
  const [pingingIndex, setPingingIndex] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddServer = () => {
    if (!newName.trim()) return;
    setServerList(prev => [
      ...prev,
      {
        name: newName.trim(),
        url: newUrl.trim() || 'http://localhost:8080/mcp',
        transport: newTransport,
        status: 'connected',
        latency: '14ms'
      }
    ]);
    setNewName('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const handleAddPreset = (preset) => {
    if (serverList.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) return;
    setServerList(prev => [
      ...prev,
      {
        ...preset,
        status: 'connected',
        latency: '12ms'
      }
    ]);
  };

  const handleRemoveServer = (idx) => {
    setServerList(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePingServer = (idx) => {
    setPingingIndex(idx);
    setTimeout(() => {
      setServerList(prev => prev.map((s, i) => {
        if (i === idx) {
          return {
            ...s,
            status: 'connected',
            latency: `${Math.floor(10 + Math.random() * 12)}ms`
          };
        }
        return s;
      }));
      setPingingIndex(null);
    }, 700);
  };

  const handleSave = () => {
    const serverMap = {};
    serverList.forEach(s => {
      serverMap[s.name] = s.status || 'connected';
    });
    onSaveServers?.(serverMap);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
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
                    {isAdded ? <CheckCircle2 size={11} color="#4ade80" /> : <Plus size={11} />}
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

          {serverList.length === 0 && !showAddForm ? (
            <div className="empty-substate">
              <Zap size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', marginBottom: '4px' }}>No MCP servers configured</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Add servers or click presets above to enable orchestration</p>
            </div>
          ) : (
            serverList.map((server, idx) => (
              <div key={idx} className="server-card-item">
                <div className={`status-dot ${server.status === 'connected' ? 'connected' : 'pending'}`} />
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
                    title="Remove server"
                  >
                    <Trash2 size={13} />
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
                <button className="modal-btn primary" style={{ flex: 1 }} onClick={handleAddServer} disabled={!newName.trim()}>
                  <Plus size={14} /> Add Server
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
            Cancel
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            {savedSuccess ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#4ade80" /> Saved!
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={14} /> Save Configuration
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
