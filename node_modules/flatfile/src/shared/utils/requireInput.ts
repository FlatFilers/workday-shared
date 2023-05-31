import chalk from 'chalk'

/**
 *
 * @param input
 * @param helpLink
 * @returns boolean
 */

export function requireInput(input: string, helpLink: string) {
  return !input
    ? `${chalk.red(`⛔️ Required value, to find this value go to ${helpLink}`)}`
    : true
}
