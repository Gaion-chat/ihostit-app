export class InitService {
  private initialized = false;

  async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`Status failed: ${res.status}`);
      const status = await res.json();
      this.initialized = !!status.initialized;
      if (!this.initialized) {
        const syncRes = await fetch('/api/sync', { method: 'POST' });
        if (!syncRes.ok) throw new Error(`Sync failed: ${syncRes.status}`);
        const sync = await syncRes.json();
        if (!sync.success) throw new Error(sync.message || 'Sync failed');
        this.initialized = true;
      }
      return { success: true, message: 'Initialized via server' };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Initialization failed' };
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

const initService = new InitService();
export default initService;
