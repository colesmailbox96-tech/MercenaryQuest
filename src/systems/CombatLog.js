export class CombatLog {
  constructor(maxEntries = 100) {
    this.entries = [];
    this.maxEntries = maxEntries;
    this.listeners = [];
    this.startTime = Date.now();
  }

  addEntry(entry) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      ...entry,
    };

    this.entries.push(logEntry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    for (const listener of this.listeners) {
      listener(logEntry);
    }
  }

  getRecent(count = 20) {
    return this.entries.slice(-count);
  }

  onNewEntry(callback) {
    this.listeners.push(callback);
  }
}
