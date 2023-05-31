import { EventDriver } from './_EventDriver'
import { EventHandler } from '../events'

export class Browser extends EventDriver {
  public _accessToken?: string
  public _apiUrl?: string
  public _environmentId?: string

  constructor({
    apiUrl,
    accessToken,
    environmentId,
  }: {
    apiUrl: string
    accessToken: string
    environmentId?: string
    /**
     * @deprecated
     */
    fetchApi: any
  }) {
    super()
    this._apiUrl = apiUrl
    this._accessToken = accessToken
    this._environmentId = environmentId || ''
  }

  mountEventHandler(handler: EventHandler): this {
    handler.setVariables({
      accessToken: this._accessToken,
      apiUrl: this._apiUrl,
    })

    this._handler = handler
    return this
  }
}
