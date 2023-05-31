import { CrossEnvConfig } from './' // Import the module

describe('CrossEnvConfig', () => {
  beforeEach(() => {
    // Clear all registries and factories before each test
    CrossEnvConfig.reset()
  })

  it('gets a value from the environment', () => {
    process.env.TEST_ENV_VAR = 'test value'
    expect(CrossEnvConfig.get('TEST_ENV_VAR')).toBe('test value')
  })

  it('gets a value from overrides', () => {
    CrossEnvConfig.set('TEST_VAR', 'test value')
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test value')
  })

  it('prefers a value from overrides over the environment', () => {
    process.env.TEST_VAR = 'test env value'
    CrossEnvConfig.set('TEST_VAR', 'test override value')
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test override value')
  })

  it('gets a value from an attached config registry', () => {
    CrossEnvConfig.attachConfigRegistry({ TEST_VAR: 'test value' })
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test value')
  })

  it('prefers a value from overrides over the attached config registry', () => {
    CrossEnvConfig.attachConfigRegistry({ TEST_VAR: 'test registry value' })
    CrossEnvConfig.set('TEST_VAR', 'test override value')
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test override value')
  })

  it('gets a value from an attached config factory', () => {
    CrossEnvConfig.attachConfigFactory((key) => `test value for ${key}`)
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test value for TEST_VAR')
  })

  it('prefers a value from overrides over the attached config factory', () => {
    CrossEnvConfig.attachConfigFactory((key) => `test factory value for ${key}`)
    CrossEnvConfig.set('TEST_VAR', 'test override value')
    expect(CrossEnvConfig.get('TEST_VAR')).toBe('test override value')
  })

  it('returns undefined if no value found', () => {
    expect(CrossEnvConfig.get('NON_EXISTENT_VAR')).toBeUndefined()
  })

  it('gets a value from an alias if no value found', () => {
    CrossEnvConfig.alias('ALIAS_VAR', 'TEST_VAR')
    CrossEnvConfig.set('TEST_VAR', 'test value')
    expect(CrossEnvConfig.get('ALIAS_VAR')).toBe('test value')
  })

  it('prefers a value from overrides over an alias', () => {
    CrossEnvConfig.alias('ALIAS_VAR', 'TEST_VAR')
    CrossEnvConfig.set('ALIAS_VAR', 'test alias override value')
    CrossEnvConfig.set('TEST_VAR', 'test value')
    expect(CrossEnvConfig.get('ALIAS_VAR')).toBe('test alias override value')
  })
})
