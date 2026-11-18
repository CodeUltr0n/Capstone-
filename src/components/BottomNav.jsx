import React from 'react';
import { MessageSquare, Brain, Server, History } from 'lucide-react';

export default function BottomNav({ activeTab = 'chat', onTabChange }) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'context', label: 'Context', icon: Brain },
    { id: 'servers', label: 'Servers', icon: Server },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <nav className="bottom-nav-bar" role="tablist" aria-label="Main Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            className={`bottom-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange?.(tab.id)}
            title={tab.label}
          >
            <div className="tab-icon-wrap">
              <Icon size={18} strokeWidth={isActive ? 2.1 : 1.6} />
              {isActive && <span className="tab-active-indicator" />}
            </div>
            <span className="tab-text-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
