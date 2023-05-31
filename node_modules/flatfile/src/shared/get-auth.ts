import { config } from '../config'
import chalk from 'chalk'
import prompt from 'prompts'
import { Configuration, DefaultApi } from '@flatfile/api'
import fetch from 'node-fetch'
import ora from 'ora'
import { apiKeyClient } from '../x/actions/auth.action'

export async function getAuth(options: any): Promise<{
  apiKey: string
  apiUrl: string
  environment: any
}> {
  const apiUrl =
    options?.apiUrl || config().api_url || process.env.FLATFILE_API_URL

  if (!apiUrl) {
    console.log(
      `You must provide a API Endpoint URL. Either set the ${chalk.bold(
        'FLATFILE_API_URL'
      )} environment variable, 'endpoint' in your .flatfilerc or pass the ID in as an option to this command with ${chalk.bold(
        '--api-url'
      )}`
    )
    process.exit(1)
  }

  let apiKey =
    options?.token ||
    process.env.FLATFILE_API_KEY ||
    process.env.FLATFILE_SECRET_KEY ||
    process.env.FLATFILE_BEARER_TOKEN

  if (!apiKey) {
    const input = await prompt({
      type: 'select',
      name: 'auth_type',
      message: 'Select an authentication mode',
      choices: [
        {
          title: 'API Key',
          value: 'api_key',
          description: 'Easily obtained from your dashboard',
        },
        { title: 'Your Username & Password', value: 'password' },
        {
          title: 'Environment variable',
          description:
            "You'll need to know how to manage your environment variables.",
          value: 'env',
        },
      ],
      initial: 0,
    })
    switch (input.auth_type) {
      case 'api_key':
        const res = await prompt({
          type: 'password',
          name: 'apiKey',
          message: 'Enter your secret api key',
        })
        apiKey = res.apiKey
        break
      case 'password':
        const auth = await prompt([
          {
            type: 'text',
            name: 'email',
            message: 'Email Address',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password',
          },
        ])
        const api = new DefaultApi(
          new Configuration({
            fetchApi: fetch,
            basePath: `${apiUrl ?? 'https://platform.flatfile.com/api'}/v1`,
          })
        )
        try {
          const res = await api.createAccessToken({
            createAccessTokenRequest: {
              email: auth.email,
              password: auth.password,
            },
          })
          apiKey = res.data?.accessToken
        } catch (e) {
          throw 'Invalid username or password'
        }

        break
      case 'env':
        throw `Set up an environment variable for FLATFILE_API_KEY using your preferred approach. If you're
  developing in a cloud environment like repl.it or codesandbox, look for the SECRETS feature
  and add a secret named FLATFILE_API_KEY. Locally consider using a .env file that is not committed
  to your git repository.`
    }

    // console.log(
    //   `🛑 You must provide an authentication key. Either set the ${chalk.bold(
    //     'FLATFILE_API_KEY'
    //   )} or ${chalk.bold(
    //     'FLATFILE_BEARER_TOKEN'
    //   )} environment variable, or pass it as an option to this command with ${chalk.bold(
    //     '--token'
    //   )}`
    // )
    // process.exit(1)
  }
  const environment = await getEnvironment(options, apiUrl, apiKey)
  return { apiKey, apiUrl, environment }
}

async function getEnvironment(options: any, apiUrl: string, apiKey: string) {
  const envSpinner = ora({
    text: `Looking for environments...`,
  }).start()
  const apiClient = apiKeyClient({ apiUrl, apiKey: apiKey! })

  const environments = await apiClient.getEnvironments()
  if (environments.data?.length === 0) {
    envSpinner.fail(`No Environments found.`)
    process.exit(1)
  }

  envSpinner.succeed(
    `${environments.data?.length} environment(s) found for these credentials`
  )
  const providedEnvironmentId =
    options?.env || process.env.FLATFILE_ENVIRONMENT_ID
  let environment
  if (providedEnvironmentId) {
    const foundEnv = environments.data?.filter(
      (e) => e.id === providedEnvironmentId
    )
    if (foundEnv?.length !== 0) {
      environment = foundEnv?.[0]
    }
  } else if (environments.data?.length! > 1) {
    const res = await prompt({
      type: 'select',
      name: 'environment',
      message: 'Select an Environment',
      choices: environments.data?.map((e) => ({
        title: e.name,
        value: e.id,
      })),
    })

    const selectedEnvironment = environments.data?.find(
      (e) => e.id === res.environment
    )

    environment = selectedEnvironment
  } else {
    environment = environments.data?.[0]
  }

  if (!environment) {
    throw `No Environments found.`
  }

  return environment
}
