import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { apiKeyClient } from './auth.action'
import ora from 'ora'
// TODO: Can we do better with these types?
// @ts-expect-error
import readJson from 'read-package-json'
// @ts-expect-error
import ncc from '@vercel/ncc'
import { deployTopics } from '../../shared/constants'
import { getAuth } from '../../shared/get-auth'
import { getEntryFile } from '../../shared/get-entry-file'

export async function deployAction(
  file?: string | null | undefined,
  options?: Partial<{
    apiUrl: string
    token: string
  }>
): Promise<void> {
  const outDir = path.join(process.cwd(), '.flatfile')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  let authRes
  try {
    authRes = await getAuth(options)
  } catch (e) {
    console.log(e)
    return
  }
  const { apiKey, apiUrl, environment } = authRes

  file = getEntryFile(file, 'deploy')

  if (!file) {
    return
  }

  const hasListener = await new Promise((resolve, reject) => {
    readJson(
      path.join(process.cwd(), 'package.json'),
      () => {},
      false,
      function (er: any, data: any) {
        if (er) {
          console.log(
            'Could not find package.json in the current directory. Deploy flatfile from the root of your project.'
          )
          resolve(-1)
          return
        }

        if (
          data.dependencies?.['@flatfile/listener'] ||
          data.devDependencies?.['@flatfile/listener']
        ) {
          resolve(1)
          return
        }

        // console.log('the package data is', data)
        resolve(0)
      }
    )
  })

  if (hasListener === 0) {
    console.log(
      `You must install the @flatfile/listener package to use the deploy command.`
    )
    process.exit(1)
  }

  const liteMode = process.env.FLATFILE_COMPILE_MODE === 'no-minify'

  try {
    const data = fs.readFileSync(
      path.join(__dirname, '..', 'templates', 'entry.js'),
      'utf8'
    )
    const result = data.replace(
      /{ENTRY_PATH}/g,
      path.join(
        path.relative(
          path.dirname(path.join(outDir, '_entry.js')),
          path.dirname(file!)
        ),
        path.basename(file!)
      )
    )

    fs.writeFileSync(path.join(outDir, '_entry.js'), result, 'utf8')
    const buildingSpinner = ora({
      text: `Building deployable code package`,
    }).start()

    buildingSpinner.succeed('Code package compiled to .flatfile/build.js')
  } catch (e) {
    console.error(e)
  }

  // Create and authenticated API client
  const apiClient = apiKeyClient({ apiUrl, apiKey: apiKey! })

  const validatingSpinner = ora({
    text: `Validating code package...`,
  }).start()
  try {
    validatingSpinner.succeed('Code package passed validation')

    ora({
      text: `Environment "${environment?.name}" selected`,
    }).succeed()

    const deployingSpinner = ora({
      text: `Deploying event listener to Flatfile`,
    }).start()

    try {
      const { err, code } = await ncc(path.join(outDir, '_entry.js'), {
        minify: liteMode,
        target: 'es2020',
        cache: false,
      })
      if (err) {
        deployingSpinner.fail(
          `Event listener failed to build ${chalk.dim(err)}\n`
        )
        process.exit(1)
      }

      const agent = await apiClient.createAgent({
        environmentId: environment?.id!,
        agentConfig: {
          topics: deployTopics,
          compiler: 'js',
          source: code,
        },
      })
      // console.log({ map, assets })

      deployingSpinner.succeed(
        `Event listener deployed and running on your environment "${
          environment?.name
        }". ${chalk.dim(agent?.data?.id)}\n`
      )
    } catch (e) {
      deployingSpinner.fail(
        `Event listener failed deployment ${chalk.dim(e)}\n`
      )
      console.error(e)
    }
  } catch (e) {
    console.log(e)
  }
}
