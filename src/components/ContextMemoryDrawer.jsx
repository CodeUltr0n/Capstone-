import React, { useState } from 'react';
import { Brain, X, Plus, Trash2, Zap, Shield, Sparkles, Sliders } from 'lucide-react';

export default function ContextMemoryDrawer({
  isOpen,
  onClose,
  contextState = {
    activeGoals: ['Full-stack Orchestration', 'Database Queries'],
    memorySlots: [
      { key: 'Default Environment', value: 'Production Linux Cluster' },
      { key: 'Preferred Output', value: 'Structured Markdown Tables' },
      { key: 'Data Policy', value: 'Zero PII Retention' }
    ],
    urgencyWeight: 0.85
  },
  onUpdateContext
}) {
  const [newGoal, setNewGoal] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [urgency, setUrgency] = useState(contextState.urgencyWeight || 0.85);

  if (!isOpen) return null;

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    const updated = {
      ...contextState,
      activeGoals: [...(contextState.activeGoals || []), newGoal.trim()]
    };
    onUpdateContext?.(updated);
    setNewGoal('');
  };

  const handleRemoveGoal = (index) => {
    const updated = {
      ...contextState,
      activeGoals: contextState.activeGoals.filter((_, i) => i !== index)
    };
    onUpdateContext?.(updated);
  };

  const handleAddMemory = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const updated = {
      ...contextState,
      memorySlots: [...(contextState.memorySlots || []), { key: newKey.trim(), value: newValue.trim() }]
    };
    onUpdateContext?.(updated);
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveMemory = (index) => {
    const updated = {
      ...contextState,
      memorySlots: contextState.memorySlots.filter((_, i) => i !== index)
    };
    onUpdateContext?.(updated);
  };

  const handleUrgencyChange = (val) => {
    setUrgency(val);
    onUpdateContext?.({
      ...contextState,
      urgencyWeight: val
    });
  };

  const handleClearMemory = () => {
    onUpdateContext?.({
      ...contextState,
      memorySlots: []
    });
  };

  return (
    <>
      <div className="settings-drawer-backdrop" onClick={onClose} />
      <div className="settings-drawer" style={{ width: '380px' }}>
        <div className="settings-drawer-header">
          <h3>
            <Brain size={18} color="var(--accent-primary)" />
            Context & Memory Buffer
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={14} />
          </button>
        </div>

        <div className="settings-drawer-body">
          {/* Token Overhead Callout */}
          <div className="context-efficiency-banner">
            <div className="efficiency-icon-wrap">
              <Zap size={16} color="var(--accent-primary)" />
            </div>
            <div>
              <div className="efficiency-title">Zero Token Silo Overhead</div>
              <div className="efficiency-desc">
                Context is scored client-side and persisted in orchestrator memory — 87% lower token usage than independent agent silos.
              </div>
            </div>
          </div>

          {/* Urgency & Prioritization Weights */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Sliders size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Prioritization Weights
            </div>

            <div className="context-slider-group">
              <div className="context-slider-label">
                <span>Urgency Bias</span>
                <span className="context-slider-val">{Math.round(urgency * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={urgency}
                onChange={(e) => handleUrgencyChange(parseFloat(e.target.value))}
                className="context-range-slider"
              />
              <div className="context-slider-sub">
                Higher values prioritize low-latency servers over deep analysis.
              </div>
            </div>

            <div className="signals-preview-grid">
              <div className="signal-pill">
                <span className="signal-dot live" />
                <span>Time: Active Slot</span>
              </div>
              <div className="signal-pill">
                <span className="signal-dot live" />
                <span>Context Match: 94%</span>
              </div>
              <div className="signal-pill">
                <span className="signal-dot live" />
                <span>Memory Cache: Warm</span>
              </div>
            </div>
          </div>

          {/* Active Goals */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Sparkles size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Active Session Goals
            </div>

            <div className="goals-tags-container">
              {contextState.activeGoals?.map((goal, idx) => (
                <div key={idx} className="goal-tag-chip">
                  <span>{goal}</span>
                  <button onClick={() => handleRemoveGoal(idx)} className="tag-remove-btn" title="Remove goal">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            <div className="add-tag-input-row">
              <input
                type="text"
                placeholder="Add session goal (e.g. Analytics, Testing)..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                className="config-input compact"
              />
              <button onClick={handleAddGoal} className="add-tag-submit-btn" disabled={!newGoal.trim()}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Persistent Memory Buffer */}
          <div className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="settings-section-title" style={{ margin: 0 }}>
                <Shield size={12} style={{ display: 'inline', marginRight: '6px' }} />
                Persistent Context Memory
              </div>
              {contextState.memorySlots?.length > 0 && (
                <button onClick={handleClearMemory} className="text-link-btn" title="Clear all memory">
                  Clear
                </button>
              )}
            </div>

            <div className="memory-slots-list">
              {contextState.memorySlots?.length === 0 ? (
                <div className="empty-substate">No memory slots saved. Context adapts dynamically.</div>
              ) : (
                contextState.memorySlots?.map((slot, idx) => (
                  <div key={idx} className="memory-slot-card">
                    <div className="slot-key">{slot.key}</div>
                    <div className="slot-val">{slot.value}</div>
                    <button onClick={() => handleRemoveMemory(idx)} className="slot-del-btn" title="Delete slot">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add memory item */}
            <div className="add-memory-form">
              <input
                type="text"
                placeholder="Key (e.g. Default DB)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="config-input compact"
                style={{ marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Value (e.g. PostgreSQL Main)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  className="config-input compact"
                />
                <button
                  onClick={handleAddMemory}
                  className="modal-btn primary compact"
                  disabled={!newKey.trim() || !newValue.trim()}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
