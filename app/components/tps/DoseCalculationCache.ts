export class DoseCalculationCache<T> {
  private cache: Map<string, T>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map<string, T>();
    this.maxSize = maxSize;
    if (maxSize <= 0) {
      console.warn("DoseCalculationCache maxSize should be positive. Defaulting to 1000.");
      this.maxSize = 1000;
    }
  }

  get(key: string): T | null {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!; // Value is guaranteed to be there
      // LRU: Move to end by deleting and re-setting
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key: string, value: T): void {
    // If key already exists, re-setting it will move it to the end (good for LRU)
    if (this.cache.has(key)) {
        this.cache.delete(key);
    } 
    // If cache is full and we are adding a new key, remove the oldest (first) item
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) { // Should always be defined if size >= 1
          this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
} 