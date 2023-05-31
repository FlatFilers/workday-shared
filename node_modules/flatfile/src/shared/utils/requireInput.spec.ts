import { requireInput } from './requireInput'

describe('requireInput', () => {
  test('returns true if input value is defined', () => {
    const input = 'exampleClientId'
    const helpLink = 'www.fakehelplink.com'
    expect(requireInput(input, helpLink)).toBe(true)
  })
  test('returns error if input value is not passed', () => {
    const helpLink = 'www.fakeHelpLink'
    expect(requireInput('', helpLink)).toMatch(
      `⛔️ Required value, to find this value go to ${helpLink}`
    )
  })
})
