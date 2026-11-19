import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Terminal, ChevronDown, ChevronUp, Server, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import OrchestrationTimeline from './OrchestrationTimeline';
import ToolArgumentsForm from './ToolArgumentsForm';

export default function Message({ msg, onSubmitToolArguments, _isLatestAgentMsg, _isThinking }) {
  const [copied, setCopied] = useState(false);
  const [isToolResultOpen, setIsToolResultOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isUser = msg.role === 'user';

  const handleCopy = () => {
    if (msg.content) {
      navigator.clipboard?.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'agent'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'agent'}`}>
        {isUser ? (
          <div className="user-message-content">
            {msg.content}
          </div>
        ) : (
          <div className="agent-message-content">
            {/* Agent Message Header Badge */}
            <div className="agent-bubble-header">
              <span className="agent-source-badge">
                <Server size={11} />
                {msg.orchestration?.activeServer ? (
                  <span>Routed: <strong>{msg.orchestration.activeServer}</strong></span>
                ) : (
                  <span>Universal Orchestrator</span>
                )}
              </span>
              <span className="agent-timestamp">
                {msg.time || 'Just now'}
              </span>
            </div>

            {/* Orchestration timeline if present */}
            {msg.orchestration && (
              <OrchestrationTimeline
                activeServer={msg.orchestration.activeServer}
                rankings={msg.orchestration.rankings}
                query={msg.orchestration.query}
                toolExecution={msg.toolExecution}
              />
            )}

            {/* Tool Execution Card if present */}
            {msg.toolExecution && (
              <div className="tool-execution-card">
                <div
                  className="tool-execution-header"
                  onClick={() => setIsToolResultOpen(!isToolResultOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={13} color="var(--accent-primary)" />
                    <span className="tool-name-badge">{msg.toolExecution.tool}</span>
                    <span className="tool-duration">
                      <Zap size={10} style={{ display: 'inline' }} /> {msg.toolExecution.duration || '24ms'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`tool-status-badge ${msg.toolExecution.status === 'error' ? 'error' : 'success'}`}>
                      {msg.toolExecution.status === 'error' ? 'Failed' : 'Complete'}
                    </span>
                    {isToolResultOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                </div>

                {isToolResultOpen && msg.toolExecution.result && msg.toolExecution.showPayload !== false && (
                  <div className="tool-execution-body">
                    <div className="tool-payload-title">OUTPUT PAYLOAD:</div>
                    <pre className="tool-payload-pre">
                      {typeof msg.toolExecution.result === 'object'
                        ? JSON.stringify(msg.toolExecution.result, null, 2)
                        : msg.toolExecution.result}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {msg.toolExecution?.result?.required_arguments && (
              <ToolArgumentsForm result={msg.toolExecution.result} onSubmit={onSubmitToolArguments} />
            )}

            {/* Render Markdown Content */}
            <div className="markdown-body">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>

            {/* Message Action Toolbar */}
            <div className="message-action-toolbar">
              <button
                type="button"
                className="msg-action-btn"
                onClick={handleCopy}
                title="Copy response"
              >
                {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  className={`msg-action-btn icon-only ${feedback === 'up' ? 'active' : ''}`}
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  title="Helpful routing"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  type="button"
                  className={`msg-action-btn icon-only ${feedback === 'down' ? 'active' : ''}`}
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  title="Incorrect route"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
