import chalk from 'chalk'

export const info = (text: string) => {
  console.log(`\n${chalk.bgBlue(' INFO ')} ${text}`)
}
