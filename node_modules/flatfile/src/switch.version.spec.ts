import { switchVersion } from './switch.version'
import { Config, config } from './config'
jest.mock('./config')

describe('switchVersion', () => {
  test('returns legacy version when x: false', () => {
    jest.mocked(config).mockImplementation(() => {
      return { x: true } as Config
    })
    expect(switchVersion(1, 2)).toEqual(2)
  })

  test('returns legacy version when x: true', () => {
    jest.mocked(config).mockImplementation(() => {
      return { x: false } as Config
    })
    expect(switchVersion(1, 2)).toEqual(1)
  })
})
