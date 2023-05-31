import c from 'ansi-colors'
import { EventDriver } from '@flatfile/listener'
import { Configuration, DefaultApi } from '@flatfile/api'
import fetch from 'node-fetch'

const prepTargetForEvent = (event: any) => {
  const actionName = event.payload?.['actionName']
  const sheetSlug = event.context.sheetSlug
  const domain =
    sheetSlug && event.domain === 'workbook' ? 'sheet' : event.domain
  const actionTarget = `${domain}(${actionName?.split(':')[0]})`

  const target =
    domain === 'file'
      ? 'space(*)'
      : actionName
      ? actionTarget
      : `sheet(${sheetSlug?.split('/').pop()})` // workbook(PrimaryCRMWorkbook)
  return target
}
/**
 * Todo: this should just be using the version from listener
 */
const events = new Map()
export class PollingEventDriver extends EventDriver {
  environmentId?: string
  apiUrl: string
  accessToken: string
  constructor({
    environmentId,
    apiUrl,
    accessToken,
  }: {
    environmentId?: string
    apiUrl?: string
    accessToken?: string
  }) {
    super()
    this.apiUrl =
      apiUrl ||
      process.env.AGENT_INTERNAL_URL ||
      'https://platform.flatfile.com/api/'
    this.accessToken =
      accessToken ||
      process.env.FLATFILE_API_KEY ||
      process.env.FLATFILE_BEARER_TOKEN ||
      '...'
    this.environmentId = environmentId || process.env.FLATFILE_ENVIRONMENT_ID
  }

  start() {
    this.handler.setVariables({
      accessToken: this.accessToken,
      apiUrl: this.apiUrl,
    })

    let lastTimestamp = new Date(Date.now() - 5000)
    if (!this.environmentId) {
      throw new Error('environmentId is required')
    }

    try {
      const authClient = new DefaultApi(
        new Configuration({
          accessToken: this.accessToken,
          fetchApi: fetch,
          basePath: this.apiUrl + '/v1',
        })
      )
      setInterval(() => {
        authClient
          .getEvents({
            since: lastTimestamp,
            includeAcknowledged: true,
            environmentId: this.environmentId,
          })
          .then((res) => {
            process.stdout.cursorTo(0)
            process.stdout.clearLine(1)

            if (!res.data?.length) {
              process.stdout.write(
                `${c.white.bgMagentaBright(
                  'listening for events'
                )} at ${lastTimestamp.toLocaleString()}`
              )
            }

            res.data?.forEach((e) => {
              if (!events.get(e.id)) {
                process.stdout.write(
                  `${c.white.bgBlue(e.topic)} ${c.white.bgYellow(
                    e.id
                  )} ${e.createdAt?.toLocaleString()}\n`
                )
                events.set(e.id, true)
                e.target = prepTargetForEvent(e)
                this.dispatchEvent(e)
              }
            })
          })
          .catch(console.error)

        lastTimestamp = new Date(Date.now() - 5000)
      }, 500)
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
  }

  shutdown() {}
}
