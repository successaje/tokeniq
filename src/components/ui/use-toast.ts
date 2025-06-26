'use client';

import * as React from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

type ToastData = ToastProps & { id: string };

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const [open, setOpen] = React.useState(false);
  const [currentToast, setCurrentToast] = React.useState<ToastData | null>(null);

  const toast = React.useCallback(({ title, description, variant = 'default', action }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, action };
    
    setToasts((prev) => [...prev, newToast]);
    setCurrentToast(newToast);
    setOpen(true);

    return id;
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    } else {
      setToasts([]);
    }
    setOpen(false);
  }, []);

  const ToastContainer = React.useCallback(() => {
    return React.createElement(RadixToast.Provider, null,
      toasts.map(toast =>
        React.createElement(
          RadixToast.Root,
          {
            key: toast.id,
            open: open && currentToast?.id === toast.id,
            onOpenChange: setOpen,
            className: `relative flex items-center justify-between p-4 rounded-md border ${toast.variant === 'destructive' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-white border-gray-200'}`
          },
          [
            React.createElement(
              'div',
              { key: 'content', className: 'grid gap-1' },
              [
                toast.title && React.createElement(
                  RadixToast.Title,
                  { key: 'title', className: 'font-medium' },
                  toast.title
                ),
                toast.description && React.createElement(
                  RadixToast.Description,
                  { key: 'description', className: 'text-sm opacity-90' },
                  toast.description
                ),
                toast.action
              ].filter(Boolean)
            ),
            React.createElement(
              RadixToast.Close,
              { 
                key: 'close',
                className: 'absolute right-2 top-2 p-1 rounded-md opacity-70 hover:opacity-100'
              },
              React.createElement(X, { className: 'h-4 w-4' })
            )
          ].filter(Boolean)
        )
      ),
      React.createElement(
        RadixToast.Viewport,
        { 
          key: 'viewport',
          className: 'fixed top-0 right-0 flex flex-col p-4 gap-2 w-full max-w-sm m-0 list-none z-[2147483647] outline-none' 
        }
      )
    );
  }, [toasts, open, currentToast, setOpen]);

  return {
    toast,
    dismiss,
    ToastContainer,
  };
}

export const Toast = {
  Provider: RadixToast.Provider,
  Viewport: RadixToast.Viewport,
  Root: RadixToast.Root,
  Title: RadixToast.Title,
  Description: RadixToast.Description,
  Close: RadixToast.Close,
  Action: RadixToast.Action,
};
