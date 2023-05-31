import chalk from 'chalk'
import ora from 'ora'

import { config } from '../../config'
import { authAction } from './auth.action'

export async function createEnvironmentAction(
  options: Partial<{
    endpoint: string
    name: string
    isProd?: boolean
  }>
) {
  const apiUrl =
    options.endpoint || config().endpoint || process.env.FLATFILE_API_URL

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

  const name = options.name

  if (!name) {
    console.log(
      `You must provide a environment name. Set the -n flag to provide an environment name`
    )
    process.exit(1)
  }

  try {
    // Create and authenticated API client
    const apiClient = await authAction({ apiUrl, clientId, secret })

    if (!apiClient) {
      console.log('Failed to create API Client')
      process.exit(1)
    }

    // Find or Create Environment
    const envSpinner = ora({
      text: `Create Environment`,
    }).start()
    try {
      const newEnvironmentCreated = await apiClient.createEnvironment({
        environmentConfig: {
          name,
          isProd: options.isProd ?? false,
        },
      })
      const environmentId = newEnvironmentCreated?.data?.id ?? ''
      envSpinner.succeed(`Environment created:  ${chalk.dim(environmentId)}`)
    } catch (e) {
      envSpinner.fail(`Failed to create environment: ${chalk.dim(name)}`)
      console.log({ e })
    }
  } catch (e) {
    console.log({ e })
  }
}
