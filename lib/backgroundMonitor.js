import { RealNotificationService } from './realNotificationService';

class BackgroundMonitor {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting background monitor for real notifications...');
    
    // Check every 60 seconds for new events (less frequent for client-side)
    this.interval = setInterval(async () => {
      try {
        // Only run if the tab is visible (save resources)
        if (document.visibilityState === 'visible') {
          await RealNotificationService.checkAllEvents();
        }
      } catch (error) {
        console.error('Background monitor error:', error);
      }
    }, 60 * 1000); // 60 seconds
    
    // Initial check after 5 seconds
    setTimeout(() => {
      RealNotificationService.checkAllEvents();
    }, 5000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Background monitor stopped');
  }
}

// Create global instance
export const backgroundMonitor = new BackgroundMonitor();