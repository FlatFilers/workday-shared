import { config } from '../config'
import { AUTODETECT_FILE_PATHS } from './constants'
import fs from 'fs'
import path from 'path'

/**
 * Get the entry file to use for the CLI command
 *
 * @param file
 * @param cmd
 */
export function getEntryFile(
  file: string | null | undefined,
  cmd: string
): string | null {
  file ??= config().entry

  if (!file) {
    file = AUTODETECT_FILE_PATHS.find((f) => fs.existsSync(f))
  } else {
    file = path.join(process.cwd(), file)
  }
  if (!file) {
    console.error(
      '⛔️ Could not find the common entry files we look for. Looked for:\n' +
        AUTODETECT_FILE_PATHS.map((p) => `\t${p}`).join('\n') +
        '\n\nPlease specify the exact path to the entry file one of these ways:\n' +
        `- Via the CLI command (eg. npx flatfile ${cmd} ./src/my-file.js)\n` +
        '- Adding an "entry" configuration to your .flatfilerc'
    )
    return null
  }
  return file
}
