'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  ToastViewport,
  ToastProvider as RadixToastProvider,
  ToastWithIcon,
} from '@/components/ui/Toast';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastData[];
  toast: (toast: Omit<ToastData, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      duration: 5000,
      ...toastData,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, newToast.duration);
    }
  }, []);

  const success = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'success' });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'error' });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'info' });
  }, [toast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll,
      }}
    >
      <RadixToastProvider>
        {children}
        {toasts.map((toastData) => (
          <ToastWithIcon
            key={toastData.id}
            title={toastData.title}
            description={toastData.description}
            variant={toastData.variant}
            duration={toastData.duration}
            onOpenChange={(open) => {
              if (!open) {
                dismiss(toastData.id);
              }
            }}
          />
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
