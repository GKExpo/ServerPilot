import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, ...toast }].slice(-5));
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  }, []);

  useEffect(() => api.on('toast', push), [push]);

  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto rounded-lg border border-neon/30 bg-panel2/95 p-4 shadow-glow backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-100">{toast.title}</div>
                <div className="mt-1 text-sm text-zinc-400">{toast.body}</div>
              </div>
              <button className="text-zinc-500 hover:text-zinc-100" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
