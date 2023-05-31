import { config } from './config'

/**
 * Switch between legacy and X handlers based on the configuration provided.
 *
 * @param legacy function or attribute to return if using a legacy Flatfile version
 * @param x function or attribute to return if using Flatfile version X or greater
 */
export function switchVersion<L, X>(legacy: L, x: X): L | X {
  if (config().x) {
    return x
  } else {
    return legacy
  }
}
