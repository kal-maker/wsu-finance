'use client';

import { useEffect } from 'react';

export default function BackgroundMonitor() {
  useEffect(() => {
    // Only run on client side
    const startMonitor = async () => {
      try {
        const { backgroundMonitor } = await import('@/lib/backgroundMonitor');
        backgroundMonitor.start();
        
        // Cleanup on unmount
        return () => {
          backgroundMonitor.stop();
        };
      } catch (error) {
        console.error('Failed to start background monitor:', error);
      }
    };

    startMonitor();
  }, []);

  return null; // This component doesn't render anything
}