import { FlatfileListener } from './flatfile.listener'

describe('Client', () => {
  let testFn: jest.Mock

  beforeEach(() => {
    testFn = jest.fn()
  })

  describe('triggering', () => {
    test('triggers basic event listeners', async () => {
      const client = FlatfileListener.create((c) => {
        c.on('foo', testFn)
      })
      await client.dispatchEvent({ topic: 'foo' })
      expect(testFn).toHaveBeenCalledTimes(1)
    })

    test('triggers namespaced event listeners', () => {
      const client = FlatfileListener.create((c) => {
        c.on('records:created', testFn)
      })
      client.dispatchEvent({ topic: 'records:created' })
      expect(testFn).toHaveBeenCalled()
    })

    test('triggers event listener for array of events', () => {
      const client = FlatfileListener.create((c) => {
        c.on(['records:created', 'records:updated'], testFn)
      })
      client.dispatchEvent({ topic: 'records:created' })
      client.dispatchEvent({ topic: 'records:updated' })
      expect(testFn).toHaveBeenCalledTimes(2)
    })

    test('triggers event listener for wildcard query of events', () => {
      const client = FlatfileListener.create((c) => {
        c.on('records:*', testFn)
      })
      client.dispatchEvent({ topic: 'records:created' })
      client.dispatchEvent({ topic: 'records:updated' })
      client.dispatchEvent({ topic: 'records:deleted' })
      expect(testFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('filtering', () => {
    test('trigger only when filter match - on listener', async () => {
      const client = FlatfileListener.create((c) => {
        c.on('records:created', { domain: 'foo' }, testFn)
      })
      await client.dispatchEvent({ topic: 'records:created' })
      await client.dispatchEvent({ topic: 'records:created', domain: 'foo' })
      expect(testFn).toHaveBeenCalledTimes(1)
    })

    test('trigger only when filter match - on scope', async () => {
      const client = FlatfileListener.create((c) => {
        c.filter({ domain: 'foo' }, (f) => {
          f.on('records:created', testFn)
        })
      })
      await client.dispatchEvent({ topic: 'records:created' })
      await client.dispatchEvent({ topic: 'records:created', domain: 'foo' })
      expect(testFn).toHaveBeenCalledTimes(1)
    })

    test('multiple layers of filtering', async () => {
      const client = FlatfileListener.create((c) => {
        c.filter({ domain: 'foo:*' })
          .filter({ domain: 'foo:bar' })
          .use((f) => {
            f.on('records:created', testFn)
          })
      })
      await client.dispatchEvent({ topic: 'records:created' })
      await client.dispatchEvent({
        topic: 'records:created',
        domain: 'foo:bar',
      })
      await client.dispatchEvent({
        topic: 'records:created',
        domain: 'foo:baz',
      })
      expect(testFn).toHaveBeenCalledTimes(1)
    })
  })
})
