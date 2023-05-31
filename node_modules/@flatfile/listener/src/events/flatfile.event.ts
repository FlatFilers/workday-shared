import { AuthenticatedClient } from './authenticated.client'
import type { Flatfile } from '@flatfile/api'
import { EventCache } from './cache'
export class FlatfileEvent extends AuthenticatedClient {
  /**
   * Event ID from the API
   *
   * @example us0_ev_82hgidh9skd
   * @readonly
   *
   */
  public readonly id?: string

  /**
   * Topic the event was produced on
   *
   * @example workbook:created
   * @readonly
   */
  public readonly topic: string
  public readonly domain: string
  public readonly target: string
  public readonly action: string
  public readonly context: any
  public readonly payload: any
  public readonly cache: EventCache

  constructor(
    private readonly src: Flatfile.Event,
    accessToken?: string,
    apiUrl?: string
  ) {
    super(accessToken, apiUrl)
    this.cache = new EventCache()
    this.domain = src.domain
    this.topic = src.topic
    this.context = src.context // -> [us0_acc_ihjh8943h9w, space_id, workbook_id]
    this.payload = src.payload
    this.target = src.target || ''
    this.action = src.context?.actionName || ''
  }

  /**
   * Should return either event body if expanded already or fetch data from the
   * signed callback URL
   *
   * @todo this should work with the included callback URL
   */
  get data(): Promise<any> {
    if (this.src.dataUrl) {
      return this.fetch(this.src.dataUrl)
    } else {
      return this.payload
    }
  }

  private afterAllCallbacks: Map<any, any> = new Map()
  afterAll<T>(callback: () => T, cacheKey?: string): void {
    const key = cacheKey || callback.toString()
    if (!this.afterAllCallbacks.get(key)) {
      this.afterAllCallbacks.set(key, callback)
    }
  }
}

export type EventCallback = (evt: FlatfileEvent) => void
