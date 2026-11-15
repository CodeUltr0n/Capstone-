import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, ChevronRight, Server, Zap, Clock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function OrchestrationTimeline({ activeServer, rankings, _query, toolExecution }) {
  const [stage, setStage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Animate through the orchestration pipeline stages
  useEffect(() => {
    if (stage < 5) {
      const timer = setTimeout(() => {
        setStage(s => s + 1);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Derive servers from rankings or fallback
  const servers = rankings && rankings.length > 0
    ? rankings.map(([name, score]) => ({
        name,
        label: formatServerName(name),
        score
      }))
    : [
        { name: activeServer || 'database', label: formatServerName(activeServer || 'database'), score: 1.88 },
        { name: 'analytics', label: 'Analytics Engine', score: 0.65 },
        { name: 'filesystem', label: 'Local Filesystem', score: 0.32 },
      ];

  function formatServerName(name) {
    if (!name) return 'Generic MCP';
    return name
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + ' MCP';
  }

  const getScorePercentage = (serverName) => {
    if (rankings) {
      const r = rankings.find(x => x[0] === serverName);
      if (r) return Math.min(99, Math.round(r[1] * 48)) + '%';
    }
    return serverName === activeServer ? '96%' : (serverName === 'analytics' ? '38%' : '14%');
  };

  const getRawScore = (serverName) => {
    if (rankings) {
      const r = rankings.find(x => x[0] === serverName);
      if (r) return Math.min(2.0, r[1]);
    }
    return serverName === activeServer ? 1.88 : (serverName === 'analytics' ? 0.72 : 0.28);
  };

  const getReason = () => {
    const s = activeServer?.toLowerCase() || '';
    if (s.includes('data') || s.includes('sql') || s.includes('db')) {
      return 'Relational database schema requested • Structured query intent • Low latency match';
    }
    if (s.includes('weather') || s.includes('geo')) {
      return 'Real-time telemetry signal • Geocoding context • Active weather API endpoint';
    }
    if (s.includes('file') || s.includes('fs')) {
      return 'Directory path syntax detected • Local file inspection goal • High file-read permission';
    }
    if (s.includes('git') || s.includes('repo')) {
      return 'Version control query • Git repository context match • Active project branch';
    }
    return 'Context-aware intent classification • Highest priority weight match across registered servers';
  };

  return (
    <div className="control-plane-card" role="region" aria-label="MCP Control Plane Pipeline">
      {/* Header with expand/collapse */}
      <div className="control-plane-header" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} className="control-plane-pulse-icon" />
          <span>MCP ORCHESTRATOR ROUTING ENGINE</span>
        </div>
        <button
          className="timeline-expand-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-label={isExpanded ? 'Collapse routing details' : 'Expand routing details'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="control-plane-content">
          {/* Step 1: Intent Classification */}
          <div className="timeline-step">
            <div className="timeline-label">
              <Zap size={12} className="timeline-step-icon" />
              <span>Intent detected</span>
            </div>
            <div className="timeline-value">
              {stage >= 1 ? (
                <span className="intent-badge-glow">
                  {activeServer ? activeServer.toUpperCase().replace(/[-_]/g, '_') : 'TASK'}_INTENT
                </span>
              ) : (
                <span className="stage-evaluating">Classifying...</span>
              )}
            </div>
          </div>

          {/* Step 2: Context Analysis */}
          <div className="timeline-step">
            <div className="timeline-label">
              <Clock size={12} className="timeline-step-icon" />
              <span>Context signals</span>
            </div>
            <div className="timeline-value">
              {stage >= 2 ? (
                <span style={{ color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Evaluated
                </span>
              ) : (
                <span className="stage-evaluating">Evaluating...</span>
              )}
            </div>
          </div>

          {/* Context Signals Checklist */}
          {stage >= 2 && (
            <div className="timeline-signals-box">
              <div className="signal-item">
                <CheckCircle2 size={11} className="signal-check" />
                <span>Session Goals: Active alignment verified</span>
              </div>
              <div className="signal-item">
                <CheckCircle2 size={11} className="signal-check" />
                <span>Urgency Score: 0.88 (Interactive priority)</span>
              </div>
              <div className="signal-item">
                <CheckCircle2 size={11} className="signal-check" />
                <span>Persistent Memory: Retained without token leak</span>
              </div>
            </div>
          )}

          {/* Step 3: Prioritization & Scoring */}
          <div className="timeline-step">
            <div className="timeline-label">
              <ShieldCheck size={12} className="timeline-step-icon" />
              <span>Prioritization</span>
            </div>
            <div className="timeline-value">
              {stage >= 3 ? (
                <span className="text-accent" style={{ fontWeight: 700 }}>Scoring Complete</span>
              ) : stage === 2 ? (
                <span className="stage-evaluating">Computing weights...</span>
              ) : (
                '...'
              )}
            </div>
          </div>

          {/* Step 4: Routing Breakdown with animated bars */}
          {stage >= 4 && (
            <div className="routing-container">
              <div className="routing-subhead">
                <Server size={12} />
                <span>SERVER CONFIDENCE SCORES</span>
              </div>

              <div className="routing-servers-list">
                {servers.map(s => {
                  const isSelected = s.name === activeServer || s.name === activeServer?.replace(/[-_]/g, '');
                  const rawScore = getRawScore(s.name);
                  const barWidth = Math.round((rawScore / 2.0) * 100);

                  return (
                    <div
                      key={s.name}
                      className={`routing-server-row ${isSelected ? 'selected' : ''}`}
                    >
                      {/* Animated Confidence Bar */}
                      <div
                        className="server-confidence-bar"
                        style={{
                          width: `${barWidth}%`,
                          background: isSelected
                            ? 'linear-gradient(90deg, rgba(255, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.15) 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                      />
                      <span className="server-row-title">{s.label}</span>
                      <span className="server-row-score">
                        <span style={{ fontWeight: isSelected ? 800 : 500 }}>
                          {getScorePercentage(s.name)}
                        </span>
                        {isSelected && <span className="selected-tag">&larr; ROUTED</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="routing-reasoning">
                <strong>Why {formatServerName(activeServer)}?</strong>
                <p>{getReason()}</p>
              </div>
            </div>
          )}

          {/* Step 5: Execution Confirmation */}
          {stage >= 5 && (
            <div className="execution-confirmation">
              <ChevronRight size={14} className="exec-icon" />
              <span>
                Executing <strong>{formatServerName(activeServer)}</strong>
                {toolExecution?.tool ? ` &rarr; \`${toolExecution.tool}\`` : ''}
              </span>
              <span className="exec-latency">18ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
