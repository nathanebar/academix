// src/loading/LoadingService.ts
import { EventEmitter } from 'events';

class LoadingService extends EventEmitter {
  private pending = 0;

  startRequest() {
    if (this.pending === 0) this.emit('show');
    this.pending += 1;
  }

  endRequest() {
    if (this.pending <= 0) return;
    this.pending -= 1;
    if (this.pending === 0) this.emit('hide');
  }

  // Helper shortcuts for UI code (optional)
  onShow(cb: () => void) { this.on('show', cb); }
  onHide(cb: () => void) { this.on('hide', cb); }
}

export const loadingService = new LoadingService();