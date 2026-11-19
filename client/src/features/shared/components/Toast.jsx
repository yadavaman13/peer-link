import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import '../styles/shared.css';

export function ToastItem({ toast, onDismiss }) {
  const { id, message, type } = toast;

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`toast-item toast-${type}`} role="alert">
      <Icon size={16} />
      <span>{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
