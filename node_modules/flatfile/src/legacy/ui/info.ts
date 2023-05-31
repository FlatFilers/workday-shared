import chalk from 'chalk'

export const info = (text: string) => {
  console.log(`${chalk.bgBlue(' INFO ')} ${text}`)
}
