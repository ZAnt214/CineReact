import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
          >
            <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <motion.div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${danger ? 'bg-red-500/15 text-red-400' : 'bg-cine-accent/15 text-cine-accent-light'}`}>
              <AlertTriangle className="w-6 h-6" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white">
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-cine-accent hover:bg-cine-accent-dark'}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
