import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 300);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toastMethods = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  const config = {
    success: { bg: '#10b981', icon: 'M5 13l4 4L19 7' },
    error: { bg: '#ef4444', icon: 'M6 18L18 6M6 6l12 12' },
    info: { bg: '#3b82f6', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { bg: '#f59e0b', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: '360px' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`${t.exiting ? 'anim-slide-out' : 'toast-enter'} pointer-events-auto flex items-start gap-3 pl-4 pr-3 py-3 rounded-2xl text-white shadow-2xl cursor-pointer relative overflow-hidden`}
            style={{ background: config[t.type].bg }}
          >
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={config[t.type].icon} />
            </svg>
            <span className="text-sm font-medium leading-snug flex-1">{t.message}</span>
            <svg className="w-4 h-4 mt-0.5 opacity-60 hover:opacity-100 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-[3px] bg-white/30 toast-progress" style={{ animationDuration: `${t.duration}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
