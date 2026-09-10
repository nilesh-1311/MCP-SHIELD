'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newToast: ToastItem = { id, type, title, message, timestamp };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Floating Container with AnimatePresence */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl ${
                toast.type === 'danger'
                  ? 'bg-[#150a12]/95 border-rose-500/50 text-rose-200 shadow-rose-950/40'
                  : toast.type === 'warning'
                  ? 'bg-[#181206]/95 border-amber-500/50 text-amber-200 shadow-amber-950/40'
                  : toast.type === 'success'
                  ? 'bg-[#081710]/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40'
                  : 'bg-[#0b1324]/95 border-sky-500/50 text-sky-200 shadow-sky-950/40'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === 'danger' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white tracking-wide truncate">
                    {toast.title}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 opacity-80 flex-shrink-0">
                    {toast.timestamp}
                  </span>
                </div>
                {toast.message && (
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
