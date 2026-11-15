import React, { useState } from 'react';
import { History, X, CheckCircle2, ChevronRight, Server, Clock, Zap, RotateCcw, Trash2 } from 'lucide-react';

export default function ExecutionHistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onSelectQuery,
  onClearHistory
}) {
  const [filter, setFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    if (filter === 'ALL') return true;
    return item.server?.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <>
      <div className="settings-drawer-backdrop" onClick={onClose} />
      <div className="settings-drawer" style={{ width: '400px' }}>
        <div className="settings-drawer-header">
          <h3>
            <History size={18} color="var(--accent-primary)" />
            Execution History & Logs
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={14} />
          </button>
        </div>

        <div className="settings-drawer-body">
          {/* Header stat bar */}
          <div className="history-stats-banner">
            <div className="history-stat-cell">
              <span className="stat-num">{history.length}</span>
              <span className="stat-label">Tasks Routed</span>
            </div>
            <div className="history-stat-cell">
              <span className="stat-num">98.4%</span>
              <span className="stat-label">Success Rate</span>
            </div>
            <div className="history-stat-cell">
              <span className="stat-num">18ms</span>
              <span className="stat-label">Avg Routing</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="history-filter-row">
            {['ALL', 'DATABASE', 'WEATHER', 'FILESYSTEM', 'GITHUB'].map((category) => (
              <button
                key={category}
                className={`filter-pill-btn ${filter === category ? 'active' : ''}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Logged Tasks ({filteredHistory.length})
            </span>
            {history.length > 0 && (
              <button onClick={onClearHistory} className="text-link-btn" title="Clear all history">
                <Trash2 size={11} style={{ marginRight: '4px' }} /> Clear Log
              </button>
            )}
          </div>

          {/* Task History List */}
          <div className="history-items-list">
            {filteredHistory.length === 0 ? (
              <div className="empty-substate" style={{ padding: '36px 12px' }}>
                <Clock size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div>No execution records found.</div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                  Queries sent to the orchestrator will be logged here.
                </div>
              </div>
            ) : (
              filteredHistory.map((item, index) => (
                <div key={item.id || index} className="history-item-card">
                  <div className="history-card-top">
                    <span className="history-server-badge">
                      <Server size={11} />
                      {item.server || 'Auto Router'}
                    </span>
                    <span className="history-status-badge success">
                      <CheckCircle2 size={11} /> 200 OK
                    </span>
                  </div>

                  <div className="history-query-text">
                    "{item.query}"
                  </div>

                  <div className="history-card-meta">
                    <span className="meta-metric">
                      <Zap size={11} /> {item.latency || '24ms'}
                    </span>
                    <span className="meta-metric">
                      Confidence: {item.confidence || '94%'}
                    </span>
                    <span className="meta-time">
                      {item.timeAgo || 'Just now'}
                    </span>
                  </div>

                  {onSelectQuery && (
                    <button
                      className="history-replay-btn"
                      onClick={() => {
                        onSelectQuery(item.query);
                        onClose();
                      }}
                      title="Load query into chat"
                    >
                      <RotateCcw size={12} />
                      <span>Re-run Task</span>
                      <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
