export class EventCache {
  private eventCache: Map<any, any> = new Map()

  async init<T>(key: string, callback: () => Promise<T>): Promise<T> {
    if (this.eventCache.get(key)) {
      console.log(`Cache hit for ${key}`)
      return this.eventCache.get(key)
    } else {
      console.log(`no cache hit for ${key}`)
      const result = await callback()
      this.eventCache.set(key, result)
      return result
    }
  }

  async set<T>(key: string, callback: () => Promise<T>): Promise<T> {
    if (this.eventCache.get(key)) {
      console.log(`cache set for ${key}`)
      const result = await callback()
      this.eventCache.set(key, result)
      return result
    } else {
      throw new Error('Cache key not found')
    }
  }

  get<T>(key: string): T {
    if (this.eventCache.get(key)) {
      return this.eventCache.get(key)
    } else {
      throw new Error('Cache key not found')
    }
  }

  delete(key?: string | string[]): void {
    if (!key) {
      this.eventCache.clear()
    } else if (this.eventCache.get(key)) {
      if (Array.isArray(key)) {
        key.forEach((k) => this.eventCache.delete(k))
      } else {
        this.eventCache.delete(key)
      }
    } else {
      throw new Error('Cache key not found')
    }
  }
}
