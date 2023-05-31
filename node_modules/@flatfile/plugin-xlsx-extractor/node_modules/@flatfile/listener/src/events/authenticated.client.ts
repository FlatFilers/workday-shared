import { Configuration, DefaultApi, FetchAPI } from '@flatfile/api'
import fetch from 'node-fetch'

const FLATFILE_API_URL =
  process.env.AGENT_INTERNAL_URL || 'http://localhost:3000'

export class AuthenticatedClient {
  private _api?: DefaultApi
  private _fetchApi?: FetchAPI

  public _accessToken?: string
  public _apiUrl?: string
  public fetchApi: FetchAPI

  constructor(accessToken?: string, apiUrl?: string) {
    this._accessToken =
      accessToken || process.env.FLATFILE_BEARER_TOKEN || '...'
    this._apiUrl = apiUrl || FLATFILE_API_URL
  }
  get api(): DefaultApi {
    if (this._api) {
      return this._api
    }

    const accessToken = this._accessToken
    const apiUrl = this._apiUrl

    const ClientConfig = new Configuration({
      basePath: `${apiUrl}/v1`,
      fetchApi: fetch,
      accessToken,
      headers: {
        Authorization: `Bearer ${accessToken || '...'}`,
        'x-disable-hooks': 'true',
      },
    })
    this._api = new DefaultApi(ClientConfig)
    return this._api
  }

  fetch(url: string) {
    if (this._fetchApi) {
      return this._fetchApi
    }

    const headers = {
      Authorization: `Bearer ${this._accessToken}`,
      'x-disable-hooks': 'true',
    }
    const fetchUrl = this._apiUrl + '/' + url

    this._fetchApi = fetch(fetchUrl, {
      headers,
    })
      .then((resp: any) => resp.json())
      .then((resp: any) => resp.data)

    return this._fetchApi
  }

  public setVariables({
    accessToken,
    apiUrl,
    fetchApi,
  }: {
    accessToken?: string
    apiUrl?: string
    fetchApi?: any
  }) {
    this._accessToken = accessToken
    this._apiUrl = apiUrl
    this.fetchApi = fetchApi
  }
}
