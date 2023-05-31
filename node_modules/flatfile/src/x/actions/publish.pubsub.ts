import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { info } from '../../legacy/ui/info'
import { config } from '../../config'
import { EventTopic } from '@flatfile/api'
import { authAction } from './auth.action'
import ora from 'ora'

import { rollup } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import injectProcessEnv from 'rollup-plugin-inject-process-env'

export async function publishPubSub(
  file: string,
  options: Partial<{
    account: string
    env: string
    endpoint: string
  }>
) {
  const outDir = path.join(process.cwd(), '.flatfile')
  const env = options.env || config().env
  if (!env) {
    console.log(
      `You must provide a Environment ID. Either set the ${chalk.bold(
        'FLATFILE_ENV'
      )} environment variable, 'env' in your .flatfilerc or pass the ID in as an option to this command with ${chalk.bold(
        '--env'
      )}`
    )
    process.exit(1)
  }

  const apiUrl = options.endpoint || config().endpoint
  if (!apiUrl) {
    console.log(
      `You must provide a API Endpoint URL. Either set the ${chalk.bold(
        'FLATFILE_API_URL'
      )} environment variable, 'endpoint' in your .flatfilerc or pass the ID in as an option to this command with ${chalk.bold(
        '--endpoint'
      )}`
    )
    process.exit(1)
  }

  const clientId = config().clientId
  if (!clientId) {
    console.log(`You must provide a secret. Set 'clientId' in your .flatfilerc`)
    process.exit(1)
  }

  const secret = config().secret

  if (!secret) {
    console.log(`You must provide a secret. Set 'secret' in your .flatfilerc`)
    process.exit(1)
  }

  try {
    info('Build Workbook')
    const bundle = await rollup({
      input: file,
      treeshake: true,
      inlineDynamicImports: true,
      plugins: [
        json(),
        typescript({
          tsconfig: 'tsconfig.json',
          // overriding the default tsconfig.json settings
          declaration: false,
          declarationMap: false,
        }),
        commonjs(),
        injectProcessEnv(config().internal),
        resolve({
          preferBuiltins: false,
        }),
      ],

      // Silences warning about using this being undefined
      onwarn: function (warning) {
        if (
          warning.code === 'THIS_IS_UNDEFINED' ||
          warning.code === 'CIRCULAR_DEPENDENCY' ||
          warning.code === 'UNRESOLVED_IMPORT' ||
          warning.code === 'PLUGIN_WARNING'
        ) {
          return
        }

        console.warn({ message: warning.message })
      },
    })

    await bundle.write({
      file: path.join(outDir, 'build.js'),
      // dir: path.join(outDir),
      format: 'cjs',
      exports: 'auto',
      plugins: [
        // Minifies the bundle
        // TODO: Be able to turn this off for debugging
        terser(),
      ],
    })
    bundle.close()
    info('Send Build.js')
  } catch (e) {
    console.log(e)
  }

  // Create and authenticated API client
  const apiClient = await authAction({ apiUrl, clientId, secret })

  if (!apiClient) {
    console.log('Failed to create API Client')
    process.exit(1)
  }

  try {
    const envSpinner = ora({
      text: `Finding Environment`,
    }).start()
    let environment
    try {
      environment = await apiClient.getEnvironmentById({
        environmentId: env,
      })

      envSpinner.succeed(
        `Found Environment: ${chalk.dim(environment?.data?.id)}`
      )
    } catch (e) {
      envSpinner.fail(`Environment was not found: ${chalk.dim(env)}`)
      process.exit(1)
    }

    const buildFile = path.join(outDir, 'build.js')
    const buffer = fs.readFileSync(buildFile)
    const source = buffer.toString()
    const client = require(buildFile)

    if (!('mount' in client)) {
      return console.error(
        '🛑 You must export a mountable class (Agent, Space, Workbook, or Sheet) as a default export from the entry file.'
      )
    }

    // Create an Agent with the default Data Hook
    const agentSpinner = ora({
      text: `Create Agent`,
    }).start()
    try {
      const topics = [
        EventTopic.Actiontriggered,
        EventTopic.Clientinit,
        EventTopic.Filedeleted,
        EventTopic.Jobcompleted,
        EventTopic.Jobdeleted,
        EventTopic.Jobfailed,
        EventTopic.Jobstarted,
        EventTopic.Jobupdated,
        EventTopic.Jobwaiting,
        EventTopic.Recordscreated,
        EventTopic.Recordsdeleted,
        EventTopic.Recordsupdated,
        EventTopic.Sheetvalidated,
        EventTopic.Spaceadded,
        EventTopic.Spaceremoved,
        EventTopic.Uploadcompleted,
        EventTopic.Uploadfailed,
        EventTopic.Uploadstarted,
        EventTopic.Useradded,
        EventTopic.Useroffline,
        EventTopic.Useronline,
        EventTopic.Userremoved,
        EventTopic.Workbookadded,
        EventTopic.Workbookremoved,
      ]

      const agent = await apiClient.createAgent({
        environmentId: env ?? '',
        agentConfig: {
          topics,
          compiler: 'js',
          source,
        },
      })
      agentSpinner.succeed(`Agent Created ${chalk.dim(agent?.data?.id)}\n`)
    } catch (e) {
      agentSpinner.fail(`Agent failed to be created ${chalk.dim(e)}\n`)
    }
  } catch (e) {
    console.log(e)
  }
}
