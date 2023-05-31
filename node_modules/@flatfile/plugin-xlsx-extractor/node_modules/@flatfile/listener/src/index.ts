import { FlatfileListener } from './flatfile.listener'
export * from './flatfile.listener'
export * from './event-drivers'
export * from './events'

/**
 * Backwards compatibility
 */
export class Client extends FlatfileListener {}
