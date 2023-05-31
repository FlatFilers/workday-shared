import fetch from 'node-fetch'
import ora from 'ora'
import chalk from 'chalk'

interface AccessToken {
  /**
   * Access key exchange base URL
   */
  apiURL: string
  /**
   * Expiration in seconds. Must be between 60s (1min) and 86400 (24 hrs). Defaults to 5 mins
   */
  expiresIn?: number
}

interface Response {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt: Date
  }
  statusCode?: number
  message?: string
  error?: string
}

const generateAccessToken = async ({
  apiURL,
  expiresIn = 300,
}: AccessToken): Promise<string> => {
  if (!process.env.FLATFILE_ACCESS_KEY_ID) {
    console.log(
      `A ${chalk.yellow.bold(
        'FLATFILE_ACCESS_KEY_ID'
      )} environment variable must be provided.`
    )
    console.log(
      `See https://support.flatfile.com/hc/en-us/articles/4406299638932-How-can-I-create-API-Keys-`
    )

    process.exit(1)
  }

  if (!process.env.FLATFILE_SECRET) {
    console.log(
      `A ${chalk.yellow.bold(
        'FLATFILE_SECRET'
      )} environment variable must be provided.`
    )
    console.log(
      `See https://support.flatfile.com/hc/en-us/articles/4406299638932-How-can-I-create-API-Keys-`
    )

    process.exit(1)
  }

  const spinner = ora({
    text: `Creating access token`,
  }).start()
  const accessKey = process.env.FLATFILE_ACCESS_KEY_ID
  const secret = process.env.FLATFILE_SECRET
  const url = `${apiURL}/auth/access-key/exchange`
  const headers = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  }
  const body = JSON.stringify({
    accessKeyId: accessKey,
    secretAccessKey: secret,
    expiresIn,
  })

  try {
    // post request to exchange for a new token
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    const data = (await res.json()) as Response

    // Unauthorized
    if (data?.statusCode === 401) {
      spinner.fail(`${chalk.red(data.message)}`)
      process.exit(1)
    }

    // Unsuccessful for some other reason
    if (data.error) {
      spinner.fail(`${chalk.red(data.error)}`)
      process.exit(1)
    }

    // Success
    spinner.succeed(`Access token created`)

    return data.accessToken
  } catch (e) {
    spinner.fail(`${chalk.red(e)}`)
    process.exit(1)
  }
}

export { generateAccessToken }
