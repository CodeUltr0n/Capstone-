import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast-notification ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      {isSuccess
        ? <CheckCircle2 size={15} color="#4ade80" />
        : <AlertCircle size={15} color="#ff6b6b" />
      }
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <X size={12} />
      </button>
    </div>
  );
}

