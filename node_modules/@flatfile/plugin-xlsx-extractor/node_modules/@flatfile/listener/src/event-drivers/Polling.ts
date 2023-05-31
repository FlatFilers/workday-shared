import c from 'ansi-colors'
import { EventDriver } from './_EventDriver'

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
    setInterval(() => {
      this.handler.api
        .getEvents({
          since: lastTimestamp,
          includeAcknowledged: false,
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
              this.dispatchEvent(e)
            }
          })
        })
        .catch(console.error)

      lastTimestamp = new Date(Date.now() - 5000)
    }, 500)
  }

  shutdown() {}
}
