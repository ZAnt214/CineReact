import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type AdminToastType = 'success' | 'error';

export interface AdminToast {
  type: AdminToastType;
  message: string;
}

interface AdminToastContextValue {
  toast: AdminToast | null;
  showToast: (type: AdminToastType, message: string) => void;
  clearToast: () => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<AdminToast | null>(null);

  const showToast = useCallback((type: AdminToastType, message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return (
    <AdminToastContext.Provider value={{ toast, showToast, clearToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="fixed bottom-6 right-4 left-4 md:left-auto md:w-[420px] z-[400]"
          >
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-green-950/90 border-green-500/30 text-green-100'
                  : 'bg-red-950/90 border-red-500/30 text-red-100'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-semibold leading-relaxed flex-1">{toast.message}</p>
              <button type="button" onClick={clearToast} className="text-current/70 hover:text-current">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error('useAdminToast must be used within AdminToastProvider');
  return ctx;
}
