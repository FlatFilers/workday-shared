import chalk from 'chalk'
import path from 'path'
import { info } from '../ui/info'
import { build } from 'tsup'
import { generateAccessToken } from '../utilities/access.token'
import { deploy } from '../utilities/deploy'
import { summary } from '../ui/summary'
import { config } from '../../config'

export const publishAction = async (
  file: string = './src/index.ts',
  options: Partial<{ team: string; env: string; apiUrl: string }>
) => {
  const teamId = options.team || process.env.FLATFILE_TEAM_ID || ''
  const team = parseInt(teamId, 10)
  const env = options.env || process.env.FLATFILE_ENV || 'test'
  const apiURL: string =
    options.apiUrl ||
    process.env.FLATFILE_API_URL ||
    'https://api.us.flatfile.io'

  if (!teamId) {
    console.log(
      `You must provide a Team ID. Either set the ${chalk.bold(
        'FLATFILE_TEAM_ID'
      )} environment variable or pass the ID in as an option to this command with ${chalk.bold(
        '--team'
      )}`
    )
    process.exit(1)
  }

  const outDir = path.join(process.cwd(), '.flatfile')

  try {
    info('Build Workbook')

    await build({
      config: false,
      entry: { build: file },
      outDir,
      format: 'cjs',
      noExternal: [/.*/],
      silent: true,
    })
  } catch (e) {
    console.log('Build failed')
    console.log(chalk.red(e))

    process.exit(1)
  }

  info('Generate token')
  const token = await generateAccessToken({ apiURL })

  info('Deploy Workbook to Flatfile')

  const buildFile = path.join(outDir, 'build.js')
  const { schemaIds, portals } = await deploy(buildFile, {
    apiURL,
    apiKey: token,
    team,
    env,
  })

  console.log(`🎉 Deploy successful! 🎉`)

  summary({
    team,
    apiURL,
    schemaIds,
    env,
    portals,
  })
}
