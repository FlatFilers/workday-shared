import { objectMatches } from './glob.match'

describe('objectMatches', () => {
  test('matches a primitive anywhere in the object', () => {
    expect(objectMatches({ foo: 'bar' }, 'bar')).toBe(true)
    expect(objectMatches({ foo: 11 }, 11)).toBe(true)
    expect(objectMatches({ foo: 11 }, 13)).toBe(false)
    expect(objectMatches({ foo: 11, bar: 13 }, 13)).toBe(true)
    expect(objectMatches({ foo: { bar: 'blue' } }, 'blue')).toBe(true)
    expect(objectMatches({ foo: ['bar', 'baz'] }, 'baz')).toBe(true)
    expect(objectMatches({ foo: ['bar', 'baz'] }, 'qux')).toBe(false)
  })

  test('matches an object', () => {
    expect(objectMatches({ foo: 'bar' }, { foo: 'bar' })).toBe(true)
    expect(objectMatches({ foo: ['bar', 'baz'] }, { foo: 'bar' })).toBe(true)
  })

  test('denies an object with no exact match', () => {
    expect(objectMatches({ foo: 'bar' }, { foo: 'bar', baz: 'bar' })).toBe(
      false
    )
  })

  test('accepts an object with one of a match', () => {
    expect(objectMatches({ foo: 'bar' }, { foo: ['bar', 'baz'] })).toBe(true)
    expect(
      objectMatches({ foo: ['bar', 'crux'] }, { foo: ['bar', 'baz'] })
    ).toBe(true)
  })

  test('accepts an object with wildcard match', () => {
    expect(objectMatches({ foo: 'name:bar' }, { foo: 'name:*' })).toBe(true)
    expect(objectMatches({ foo: 'name:bar' }, { foo: '*:*' })).toBe(true)
    expect(objectMatches({ foo: 'name:bar' }, { foo: '*:bar' })).toBe(true)
    expect(objectMatches({ foo: 'name:bar' }, { foo: '**' })).toBe(true)

    expect(
      objectMatches({ foo: ['name:bar', 'smth:bar'] }, { foo: 'name:*' })
    ).toBe(true)
    expect(
      objectMatches({ foo: ['name:bar', 'smth:bar'] }, { foo: '*:*' })
    ).toBe(true)
    expect(
      objectMatches({ foo: ['name:bar', 'smth:bar'] }, { foo: '*:bar' })
    ).toBe(true)
    expect(
      objectMatches({ foo: ['name:bar', 'smth:bar'] }, { foo: '**' })
    ).toBe(true)
  })

  test('denies an object with no wildcard match', () => {
    expect(objectMatches({ foo: 'title:bar' }, { foo: 'name:*' })).toBe(false)
    expect(objectMatches({ foo: 'name:bar' }, { foo: '*:baz' })).toBe(false)

    expect(
      objectMatches({ foo: ['title:bar', 'cool:cat'] }, { foo: 'name:*' })
    ).toBe(false)
    expect(
      objectMatches({ foo: ['name:bar', 'cool:cat'] }, { foo: '*:baz' })
    ).toBe(false)
  })

  test('accepts an object with one of a wildcard match', () => {
    expect(
      objectMatches({ foo: 'name:bar' }, { foo: ['name:*', 'title:*'] })
    ).toBe(true)
    expect(
      objectMatches(
        { foo: ['name:bar', 'pork:bar'] },
        { foo: ['name:*', 'title:*'] }
      )
    ).toBe(true)
  })

  test('denies an object with none of a wildcard match', () => {
    expect(
      objectMatches({ foo: 'pork:bar' }, { foo: ['name:*', 'title:*'] })
    ).toBe(false)
    expect(
      objectMatches(
        { foo: ['pork:bar', 'crinkle:cut'] },
        { foo: ['name:*', 'title:*'] }
      )
    ).toBe(false)
  })

  test('allows user to provide a nested match object as well', () => {
    expect(
      objectMatches({ one: { two: 'bar' } }, { one: { two: 'bar' } })
    ).toBe(true)
  })

  test('matches a nested key', () => {
    expect(objectMatches({ one: { two: 'bar' } }, { 'one.two': 'bar' })).toBe(
      true
    )
  })

  test('does not use end with logic when a nested pattern is provided', () => {
    expect(
      objectMatches({ zero: { one: { two: 'bar' } } }, { 'one.two': 'bar' })
    ).toBe(false)
  })

  test('does not use end with logic when a glob pattern is provided', () => {
    expect(
      objectMatches({ zero: { one: { two: 'bar' } } }, { '*two': 'bar' })
    ).toBe(false)
  })

  test('matches a glob pattern', () => {
    expect(objectMatches({ one: { two: 'bar' } }, { '*.two': 'bar' })).toBe(
      true
    )
  })

  test('defaults to an `endsWith` pattern', () => {
    expect(objectMatches({ one: { two: 'bar' } }, { two: 'bar' })).toBe(true)
  })

  test('false if non-existent key', () => {
    expect(objectMatches({ one: { two: 'bar' } }, { three: 'bar' })).toBe(false)
  })

  test('matches a deep glob pattern', () => {
    expect(
      objectMatches({ one: { two: { three: 'bar' } } }, { '**.three': 'bar' })
    ).toBe(true)
    expect(
      objectMatches({ one: { two: { three: 'bar' } } }, { '*.three': 'bar' })
    ).toBe(false)
  })

  describe('additional edge cases', () => {
    // Empty Objects
    test('handles empty objects', () => {
      expect(objectMatches({}, {})).toBe(true)
      expect(objectMatches({ foo: 'bar' }, {})).toBe(true)
      expect(objectMatches({}, { foo: 'bar' })).toBe(false)
    })

    // Non-Object Inputs
    test('handles non-object inputs', () => {
      // @ts-ignore
      expect(() => objectMatches('foo', { foo: 'bar' })).toThrow()

      // @ts-ignore
      expect(() => objectMatches(123, { foo: 'bar' })).toThrow()

      // @ts-ignore
      expect(() => objectMatches(null, { foo: 'bar' })).toThrow()
    })

    // Special Characters in Keys
    test('handles special characters in keys', () => {
      expect(objectMatches({ 'foo*': 'bar' }, { 'foo*': 'bar' })).toBe(true)
      expect(objectMatches({ 'foo.bar': 'baz' }, { 'foo.bar': 'baz' })).toBe(
        true
      )
      expect(objectMatches({ foo$bar: 'baz' }, { foo$bar: 'baz' })).toBe(true)
    })

    // Matching Null Values
    test('matches null values', () => {
      expect(objectMatches({ foo: null }, { foo: null })).toBe(true)
      expect(objectMatches({ foo: 'bar' }, { foo: null })).toBe(false)
    })

    // Matching Undefined Values
    test('matches undefined values', () => {
      expect(objectMatches({ foo: undefined }, { foo: null })).toBe(true)

      // @ts-ignore
      expect(objectMatches({ foo: 'bar' }, { foo: undefined })).toBe(false)
    })

    // Nested Array Matches
    // test('handles nested array matches', () => {
    //   expect(
    //     objectMatches({ foo: [{ bar: 'baz' }] }, { foo: [{ bar: 'baz' }] })
    //   ).toBe(true)
    //   expect(
    //     objectMatches({ foo: [{ bar: 'qux' }] }, { foo: [{ bar: 'baz' }] })
    //   ).toBe(false)
    // })

    // Nested Wildcard Matches
    test('handles nested wildcard matches', () => {
      expect(
        objectMatches({ foo: { bar: 'baz' } }, { foo: { bar: '*' } })
      ).toBe(true)
      expect(
        objectMatches({ foo: { bar: 'qux' } }, { foo: { bar: 'baz*' } })
      ).toBe(false)
    })

    // Nested Glob Pattern Matches
    test('handles nested glob pattern matches', () => {
      expect(objectMatches({ foo: { bar: 'baz' } }, { 'foo.*': 'baz' })).toBe(
        true
      )
      expect(objectMatches({ foo: { bar: 'qux' } }, { 'foo.*': 'baz' })).toBe(
        false
      )
    })

    // Type Coercion
    test('it attempts to perform type coercion when a string match is provided', () => {
      expect(objectMatches({ foo: 1 }, { foo: '1' })).toBe(true)
    })

    // Type Coercion
    test('it will not coerce types if a non-string matcher is provided', () => {
      expect(objectMatches({ foo: '1' }, { foo: 1 })).toBe(false)
    })

    // Case Sensitivity
    test('is case sensitive', () => {
      expect(objectMatches({ foo: 'Bar' }, { foo: 'bar' })).toBe(false)
      expect(objectMatches({ foo: 'bar' }, { foo: 'Bar' })).toBe(false)
    })

    // Order of Keys
    test('does not care about order of keys', () => {
      expect(
        objectMatches({ foo: 'bar', baz: 'qux' }, { baz: 'qux', foo: 'bar' })
      ).toBe(true)
    })
  })
})
