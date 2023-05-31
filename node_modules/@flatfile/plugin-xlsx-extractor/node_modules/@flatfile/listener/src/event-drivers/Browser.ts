import { EventDriver } from './_EventDriver'
import { EventHandler } from '../events'
import { FetchAPI } from '@flatfile/api'

export class Browser extends EventDriver {
  public _accessToken?: string
  public _apiUrl?: string
  public _environmentId?: string
  public _fetchApi: FetchAPI

  constructor({
    apiUrl,
    accessToken,
    environmentId,
    fetchApi,
  }: {
    apiUrl: string
    accessToken: string
    environmentId?: string
    fetchApi: FetchAPI
  }) {
    super()
    this._apiUrl = apiUrl
    this._accessToken = accessToken
    this._environmentId = environmentId || ''
    this._fetchApi = fetchApi || undefined
  }

  mountEventHandler(handler: EventHandler): this {
    handler.setVariables({
      accessToken: this._accessToken,
      apiUrl: this._apiUrl,
      fetchApi: this._fetchApi,
    })

    this._handler = handler
    return this
  }
}
