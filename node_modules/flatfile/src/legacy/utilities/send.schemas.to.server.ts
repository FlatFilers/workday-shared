import { GraphQLClient } from 'graphql-request'
import { MUTATION_CREATE_DEPLOYMENT } from '../graphql/MUTATION_CREATE_DEPLOYMENT'
import { MUTATION_UPSERT_EMBED } from '../graphql/MUTATION_UPSERT_EMBED'
import { MUTATION_UPSERT_SCHEMA } from '../graphql/MUTATION_UPSERT_SCHEMA'
import { Portal } from '@flatfile/configure'
import * as CLIPackage from '../../../package.json'
import chalk from 'chalk'
import fs from 'fs'
import ora from 'ora'
import { MUTATION_UPDATE_DEPLOYMENT } from '../graphql/MUTATION_UPDATE_DEPLOYMENT'

export const sendSchemasToServer = async (
  client: GraphQLClient,
  buildFile: string,
  options: { team: number; env: string }
): Promise<{ schemaIds: number[]; portals: Portal[] }> => {
  const config = require(buildFile).default
  const { name, sheets, namespace, portals } = config.options
  const { team, env } = options
  const stringifiedWorkbook = JSON.stringify(config, function (key, val) {
    if (typeof val === 'function') {
      return val.toString()
    }
    return val
  })
  const { npm_package_json = '' } = process.env
  let localPackageJSON: {} = {}

  try {
    localPackageJSON = JSON.parse(fs.readFileSync(npm_package_json, 'utf8'))
  } catch (e) {
    console.error('No package.json found in the project root')
  }

  const workbookSheets: { [x: string]: any } = {}
  Object.values(sheets).forEach((sheet: any) => {
    workbookSheets[sheet.name] = null
  })

  const {
    createDeployment: { id: deploymentId },
  } = await client.request(MUTATION_CREATE_DEPLOYMENT, {
    teamId: options.team,
    version: CLIPackage.version,
    workbook: stringifiedWorkbook,
    name,
    namespace,
    workbookSheets,
    localPackageJSON,
    environment: env,
  })

  const schemaSlugs = Object.keys(sheets)
  const newSchemaVersions = await Promise.all(
    schemaSlugs.map(async (slug) => {
      const model = sheets[slug]
      const sheetName = model.name
      const sourceCode = fs.readFileSync(buildFile, 'utf8')
      const { previewFieldKey } = model.options
      const jsonSchema = { schema: model.toJSONSchema(namespace, slug) }

      const schema = await client.request(MUTATION_UPSERT_SCHEMA, {
        slug: `${namespace}/${slug}`,
        teamId: team,
        name: sheetName,
        jsonSchema,
        sheetCompute: model.getSheetCompute(),
        previewFieldKey,
        deploymentId,
        environment: env,
        code: sourceCode,
      })

      const {
        upsertSchema: { id, slug: newSlug, environmentId },
      } = schema

      if (portals) {
        const portal = portals.find((p: Portal) => p.options.sheet === slug)
        if (portal) {
          const { archived, helpContent } = portal.options
          const {
            upsertEmbed: { privateKeyString, embed },
          } = await client.request(MUTATION_UPSERT_EMBED, {
            teamId: team,
            schemaIds: [id],
            name: portal.options.name,
            environmentId,
            archived,
            helpContent,
          })
          portal.setId(embed.id)
          portal.setPrivateKeyString(privateKeyString)
        }
      }

      workbookSheets[sheetName] = id

      ora(`Workbook created with id ${chalk.white.bold(id)}`).succeed()
      return { id, newSlug }
    })
  )

  const {
    updateDeployment: { id: updatedDeployment },
  } = await client.request(MUTATION_UPDATE_DEPLOYMENT, {
    teamId: options.team,
    deploymentId,
    workbookSheets,
  })

  const schemaIds = newSchemaVersions.map((schema) => schema.id)
  return { schemaIds, portals }
}
