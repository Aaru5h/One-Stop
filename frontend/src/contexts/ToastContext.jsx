'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWatchlistAdded: () => {},
  showWatchlistRemoved: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, title, type = 'success', posterPath = null, duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, title, type, posterPath, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((message, title, posterPath) => {
    addToast({ message, title, type: 'success', posterPath });
  }, [addToast]);

  const showError = useCallback((message, title) => {
    addToast({ message, title, type: 'error' });
  }, [addToast]);

  const showInfo = useCallback((message, title) => {
    addToast({ message, title, type: 'info' });
  }, [addToast]);

  const showWatchlistAdded = useCallback((itemTitle, posterPath) => {
    addToast({
      message: 'Added to Watchlist',
      title: itemTitle,
      type: 'success',
      posterPath,
    });
  }, [addToast]);

  const showWatchlistRemoved = useCallback((itemTitle, posterPath) => {
    addToast({
      message: 'Removed from Watchlist',
      title: itemTitle,
      type: 'info',
      posterPath,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast: addToast,
        showSuccess,
        showError,
        showInfo,
        showWatchlistAdded,
        showWatchlistRemoved,
      }}
    >
      {children}

      {/* Floating Toast Notification Portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 35, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white overflow-hidden relative group"
              style={{
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.05)',
              }}
            >
              {/* Poster Thumbnail or Status Icon */}
              {toast.posterPath ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={toast.posterPath}
                    alt=""
                    className="w-10 h-14 object-cover rounded-lg shadow-md border border-white/10"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-zinc-900 text-white ${
                      toast.type === 'success'
                        ? 'bg-red-600'
                        : toast.type === 'error'
                        ? 'bg-rose-600'
                        : 'bg-zinc-700'
                    }`}
                  >
                    {toast.type === 'success' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {toast.type === 'info' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    toast.type === 'success'
                      ? 'bg-red-600/20 text-red-500 border-red-500/30'
                      : toast.type === 'error'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {toast.type === 'success' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {toast.type === 'error' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {toast.type === 'info' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wider uppercase text-red-500">
                    ONE STOP
                  </span>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400">Notification</span>
                </div>
                <p className="text-sm font-semibold tracking-wide text-white leading-snug truncate mt-0.5">
                  {toast.message}
                </p>
                {toast.title && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{toast.title}</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Progress Bar Animation */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 3500) / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 origin-left"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
