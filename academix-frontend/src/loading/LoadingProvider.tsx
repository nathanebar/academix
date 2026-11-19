// src/loading/LoadingProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadingService } from './LoadingService';

type LoadingContextValue = {
  /** Number of pending requests (0 = idle) */
  pending: number;
};

const LoadingContext = createContext<LoadingContextValue>({ pending: 0 });

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const onShow = () => setPending(prev => prev + 1);
    const onHide = () => setPending(prev => Math.max(prev - 1, 0));

    loadingService.onShow(onShow);
    loadingService.onHide(onHide);

    // cleanup on unmount (should never happen, but safe)
    return () => {
      loadingService.off('show', onShow);
      loadingService.off('hide', onHide);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ pending }}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);