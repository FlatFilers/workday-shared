import { Portal } from '@flatfile/configure'

type Environment = 'prod' | 'test' | string
export interface PublishSchemas {
  team: number
  schemaIds: number[]
  apiURL: string
  env: Environment
  portals?: Portal[]
}
export interface PublishSchema {
  team: number
  schemaId: number
  apiURL: string
  env: Environment
}

export interface PublishEmbed {
  team: number
  embedId: string
  apiURL: string
  env: Environment
}
