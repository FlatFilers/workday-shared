import { schemaURL } from '../utilities/schema.url'
import boxen from 'boxen'
import chalk from 'chalk'
import { PublishSchemas } from '../utilities/types'
import { embedURL } from '../utilities/embed.url'

export const summary = ({
  team,
  schemaIds,
  apiURL,
  env = 'test',
  portals,
}: PublishSchemas) => {
  const teamSummary = `${chalk.whiteBright('TEAM:')}        ${chalk.dim(
    team
  )}\n`

  const schemaSummary =
    schemaIds.length > 1
      ? `${chalk.whiteBright('SCHEMAS:')}     ${schemaIds
          .map((schemaId) => chalk.dim(schemaId))
          .join(', ')}\n`
      : `${chalk.whiteBright('SCHEMA:')}      ${chalk.dim(schemaIds[0])}\n`

  const envSummary = `${chalk.whiteBright('ENVIRONMENT:')} ${chalk.dim(
    env
  )}\n\n`
  const URLspaceer = ' '.repeat(21)

  const urls =
    schemaIds.length > 1
      ? schemaIds
          .map(
            (schemaId, index) =>
              `${index > 0 ? URLspaceer : ''}${chalk.blue(
                schemaURL({ team, schemaId, apiURL, env })
              )}`
          )
          .join('\n')
      : `${chalk.blue(
          schemaURL({ team, schemaId: schemaIds[0], apiURL, env })
        )}`

  const links = `View your schema${schemaIds.length > 1 ? 's' : ''} at ${urls}`

  const portalContent = portals?.map((portal) => {
    const nameSummary = `\n${chalk.whiteBright(
      '          name:'
    )}      ${chalk.dim(portal.options.name)}`

    const idSummary = `\n${chalk.whiteBright(
      '            id:'
    )}      ${chalk.dim(portal.id)}`

    const embedSummary =
      portal.id &&
      `\n${chalk.whiteBright('           url:')}      ${chalk.blue(
        embedURL({ team, embedId: portal.id, apiURL, env })
      )}`

    const privateKeyMessage = `\n${chalk.dim(
      'Portal private key will only be displayed once, so make sure to save it somewhere safe.'
    )}`

    const privateKeyStringSummary =
      portal.privateKeyString &&
      `\n${privateKeyMessage}\n\n${chalk.whiteBright(
        '   private key:'
      )}      ${chalk.dim(portal.privateKeyString)}`

    return `${nameSummary}${idSummary}${embedSummary}${privateKeyStringSummary}`
  })
  const portalTitle = `\n${chalk.whiteBright('PORTALS:')}`
  const portalSummary = portals ? `${portalTitle}${portalContent}` : ''

  console.log(
    boxen(
      `${teamSummary}${schemaSummary}${envSummary}${links}${portalSummary}`,
      {
        title: 'Summary',
        titleAlignment: 'left',
        padding: 1,
        borderColor: 'magenta',
        margin: { top: 2, bottom: 2, right: 0, left: 0 },
      }
    )
  )
}
