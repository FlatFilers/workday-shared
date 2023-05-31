import inquirer from 'inquirer'
import fs from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import { requireInput } from '../../shared/utils/requireInput'
import { brandHex, developerLink, loginLink } from '../../shared/constants'

import { authAction } from './auth.action'
const util = require('util')
const exec = util.promisify(require('child_process').exec)

export interface XInitOptions {
  name?: string
  clientId?: string
  secret?: string
  environment?: string
  isProd?: boolean
  x?: boolean
}

export const init = async (options: XInitOptions) => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Please name your project',
      default: 'flatfile-platform-example',
      when: !options.name,
    },
    {
      type: 'input',
      name: 'clientId',
      message: 'Your API Client ID',
      when: !options.clientId,
      validate: (option: string) => requireInput(option, developerLink),
    },
    {
      type: 'input',
      name: 'secret',
      message: 'Your API Secret',
      when: !options.secret,
      validate: (option: string) => requireInput(option, developerLink),
    },
    {
      type: 'input',
      name: 'environment',
      message: 'Environment name',
      default: 'dev',
      when: !options.environment,
    },
    {
      type: 'confirm',
      name: 'isProd',
      message: 'Is this a Production environment?',
      default: 'false',
      when: !options.isProd,
    },
  ]

  console.log(
    `\n${chalk.hex(brandHex)(
      `🎉 Welcome to Flatfile! We're so glad you're here.`
    )}\n`
  )

  const nodeSpinner = ora({
    text: `${chalk.dim(`Verifying node installed\n`)}`,
  }).start()

  try {
    await exec('node --version')
    nodeSpinner.succeed(`${chalk.dim('Verified node installed')}\n`)
    console.log(
      `${chalk.dim(
        'Platform SDK supports node versions 16+, earlier versions may cause errors.\n'
      )}`
    )
    const output = await exec('node --version')

    console.log(`You are running version ${chalk.cyan(output.stdout)}`)
  } catch (err) {
    nodeSpinner.fail(
      `${chalk.red('Please install node version > 16 to proceed')}`
    )
    console.log(`\n${chalk.red(err)}\n`)
    process.exit(1)
  }

  // Prompt to login for easier flow
  if (!options.clientId || !options.secret) {
    console.log(`Please signup or login to Flatfile Dashboard with Github.`)
    console.log(`${chalk.dim(loginLink)}\n`)
  }

  const apiUrl = 'https://platform.flatfile.com/api/v1'
  return inquirer
    .prompt(questions)
    .then(async (answers) => {
      // Combine answers from user input with options passed in via CLI
      const answersWithDefaults: XInitOptions = { ...options, ...answers }
      const { name, clientId, secret, environment, isProd } =
        answersWithDefaults
      const projectDir = `${process.cwd()}/${name}`

      // Empty log for spacing only
      console.log('')
      // Clone starter repo
      const spinner = ora({
        text: `Creating ${chalk.cyan(`${name}`)} project`,
      }).start()

      // Create package scaffold - remove git related information
      try {
        await exec(
          `npx --yes degit FlatFilers/platform-sdk-starter#main ${name}`
        )
      } catch (error) {
        spinner.fail(`Unable to clone starter repository`)
        console.log(chalk.red(error))
        process.exit(1)
      }

      // Change to project directory
      process.chdir(projectDir)
      if (!clientId || !secret) {
        console.log('Must provide a clientId and secret')
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

        const newEnvironmentCreated = await apiClient.createEnvironment({
          environmentConfig: {
            name: environment || 'dev',
            isProd: isProd ?? false,
          },
        })
        const environmentId = newEnvironmentCreated?.data?.id ?? ''
        envSpinner.succeed(`Environment created:  ${chalk.dim(environmentId)}`)
      } catch (e) {
        console.log(e)
        process.exit(1)
      }

      // Create the .flatfilerc file
      if (!fs.existsSync('.flatfilerc')) {
        const flatfilerc = `
        {
            "endpoint": "https://platform.flatfile.com/api/v1",
            "env": "${environment}",
            "version": "10",
            "clientId": "${clientId}",
            "secret": "${secret}"
        }`

        fs.writeFileSync('.flatfilerc', flatfilerc)
      }

      // Install dependencies
      try {
        await exec(`npm install`)
      } catch (error) {
        spinner.fail(`Unable to install dependencies`)
        console.log(chalk.red(error))
        process.exit(1)
      }
      spinner.succeed(
        `Success! Created ${chalk.cyan(`${name}`)} at ${projectDir}\n`
      )

      console.log(`Start updating your workbook at ${projectDir}/src/index.ts`)
      console.log('Inside that directory, you can run several commands:\n')

      console.log(`  ${chalk.cyan(`npm run dev`)}`)
      console.log('    Starts the bundler in watch mode\n')

      console.log(`  ${chalk.cyan(`npm run build`)}`)
      console.log('    Generate a production bundle\n')

      console.log(`  ${chalk.cyan(`npm run test`)}`)
      console.log('    Start the test runner\n')

      console.log(`  ${chalk.cyan(`npm run lint`)}`)
      console.log('    Lint and fix files\n')

      console.log(`  ${chalk.cyan(`npx flatfile publish`)}`)
      console.log('    Deploy your workbook\n')

      console.log(
        `Optionally, preview an example at ${projectDir}/examples/workbooks/FullExample.ts`
      )

      console.log(
        'You can deploy an example by passing a file path to the publish command. For instance:\n'
      )

      console.log(
        `  ${chalk.cyan(
          `npx flatfile publish ./${name}/examples/workbooks/FullExample.ts`
        )}`
      )
      console.log('    Publish example workbook\n')
    })
    .catch((err) =>
      console.error('There was a problem running the init script', { err })
    )
}
