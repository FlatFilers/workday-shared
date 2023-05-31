import { Arrayable } from './event.handler'
import wildMatch from 'wildcard-match'
import flat from 'flat'

/**
 * Glob style matching of a value
 *
 * @param val
 * @param filter
 */
export function glob(val: any, filter: string | string[]): boolean {
  if (!val || typeof val !== 'string') {
    return false
  }
  return wildMatch(filter || '**', ':')(val)
}

/**
 * Glob style matching of values in an object
 *
 * @param object
 * @param filterObject
 */
export function objectMatches(
  object: Record<string, any>,
  filterObject: JSONPrimitive | FilterObj
): boolean {
  const cleanFilter: FilterObj =
    !filterObject || typeof filterObject !== 'object'
      ? { '**': filterObject }
      : filterObject

  if (typeof object !== 'object') {
    throw new Error('You cannot filter a non-object')
  }
  let denied = false
  const filter: FilterObj = flat(cleanFilter, { safe: true })
  const flattened = flat(object, { safe: true }) as Record<
    string,
    JSONPrimitive
  >

  // all filters MUST resolve true
  for (const keyPattern in filter) {
    const keys = filterKeys(flattened, keyPattern)

    const valuePattern = (
      Array.isArray(filter[keyPattern])
        ? filter[keyPattern]
        : [filter[keyPattern]]
    ) as JSONPrimitive[]

    // only one filter must match
    denied ||= !keys.some((key) => {
      const value: JSONPrimitive = flattened[key]
      return valuePattern.some((match) => globOrMatch(value, match))
    })
  }
  return !denied
}

/**
 * Glob keys of an object and return the narrowed set
 *
 * @param object
 * @param glob
 */
function filterKeys<T extends Record<string, any>>(
  object: Record<string, any>,
  glob: string
): Array<keyof T> {
  glob = glob.includes('*') || glob.includes('.') ? glob : `**.${glob}`
  const matcher = wildMatch(glob, '.')
  return Object.keys(object).filter((key) => matcher(key))
}

function globOrMatch(
  val: Arrayable<JSONPrimitive>,
  filter: JSONPrimitive
): boolean {
  if (val === undefined || val === null) {
    return filter === null
  }
  if (Array.isArray(val)) {
    return val.some((v) => globOrMatch(v, filter))
  }
  if (typeof filter === 'string') {
    return glob(val.toString(), filter)
  }

  // otherwise do a simple comparison
  return val === filter
}

type JSONPrimitive = string | number | boolean | null

type FilterObj = Record<
  string,
  Arrayable<JSONPrimitive> | Record<string, Arrayable<JSONPrimitive>>
>
