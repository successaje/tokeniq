'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function Toaster({ position = 'top-right' }: ToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Toast>) => {
      const toast = event.detail;
      setToasts((prev) => [...prev, toast]);

      if (toast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration || 5000);
      }
    };

    window.addEventListener('toast' as any, handleToast as any);
    return () => {
      window.removeEventListener('toast' as any, handleToast as any);
    };
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed ${positionClasses[position]} z-50 space-y-4`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg shadow-lg ${typeClasses[toast.type]} transition-all duration-300 ease-in-out`}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

// Helper function to show a toast
export function showToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(7);
  const event = new CustomEvent('toast', {
    detail: { ...toast, id },
  });
  window.dispatchEvent(event);
} 