import { config } from './config'

describe('config', () => {
  test('uses preconfigured defaults when no configuration is provided', () => {
    expect(config({ team: 99 })).toMatchObject({
      team: 99,
      env: 'test',
      version: 3,
      region: 'us0',
      x: false,
      endpoint: 'https://api.us0.flatfile.com',
    })
  })

  test('treats versions greater than or equal to 10 as x:true', () => {
    expect(config({ team: 99, version: 10 })).toMatchObject({ x: true })
  })

  test('treats versions less than 10 as x:false', () => {
    expect(config({ team: 99, version: 3 })).toMatchObject({ x: false })
  })

  test('interpolates the endpoint with region', () => {
    expect(config({ team: 99, region: 'de0' })).toMatchObject({
      endpoint: 'https://api.de0.flatfile.com',
    })
  })
})
