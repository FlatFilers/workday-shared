export class CrossEnvConfig {
  private static _overrides = new Map<string, string>()

  /**
   * This is a key/value object of config values that can be used to look up values.
   * Set with attachConfigRegistry
   */
  private static _registry?: Record<string, string>

  /**
   * A function that can be used to dynamically look up config values.
   * Set with attachConfigFactory
   */
  private static _factory?: (key: string) => string

  /**
   * A map of aliases that can be used to look up config values.
   *
   * @private
   */
  private static readonly _aliases = new Map<string, string>()

  /**
   * Get a config value from either the environment or any registry overrides
   * @param prop
   */
  public static get(prop: string) {
    return this.safeEnvLookup(prop)
  }

  /**
   * Set a value explicitly
   *
   * @param key
   * @param value
   */
  public static set(key: string, value: string) {
    return this._overrides.set(key, value)
  }

  /**
   * Alias a key to another key if helpful. This is useful if you have different naming
   * constructs for different environments.
   *
   * @param from
   * @param to
   */
  public static alias(from: string, to: string) {
    return this._aliases.set(from, to)
  }

  /**
   * Helpful if you've decided to store settings in another object and want to
   * make that available here. For example in client-side implementations you may reserve
   * a window.FLATFILE_CONFIG object to store settings.
   *
   * @param obj
   */
  public static attachConfigRegistry(obj: any) {
    this._registry = obj
  }

  /**
   * Use this to provide an override getter for config values. This is useful
   * if you need to dynamically look up values. Overrides will still take precedence.
   *
   * @param cb
   */
  public static attachConfigFactory(cb?: (key: string) => string) {
    this._factory = cb
  }

  public static reset() {
    this._overrides = new Map<string, string>()
    this._registry = undefined
    this._factory = undefined
  }

  /**
   * Internal function for traversing the possible environment sources for a value
   *
   * @param prop
   * @private
   */
  private static safeEnvLookup(prop: string): string | undefined {
    // look at registered overrides
    let values = []
    if (this._overrides.get(prop)) {
      values.push(this._overrides.get(prop))
    }

    // look at any attached config registry
    if (typeof this._registry === 'object') {
      values.push(this._registry[prop])
    }

    // look at registered config factories
    if (typeof this._factory === 'function') {
      values.push(this._factory(prop))
    }

    // look at node env variables
    if (typeof process === 'object' && typeof process.env === 'object') {
      values.push(process.env[prop])
    }

    // return the first value found
    const foundValue = values.find((v) => v !== undefined)
    if (foundValue !== undefined) {
      return foundValue
    }

    // fallback to any aliases found
    const alias = this._aliases.get(prop)
    if (alias) {
      return this.safeEnvLookup(alias)
    }

    return undefined
  }
}
