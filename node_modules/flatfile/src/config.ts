import rc from 'rc'
import dotenv from 'dotenv'
import { z } from 'zod'

const interpolation = require('interpolate-json').interpolation

/**
 * Get the configuration for this Flatfile deployment.
 *
 * Uses the common `rc` package to load and merge configuration from the following places in order:
 *
 * - command line arguments, parsed by minimist (e.g. --foo baz, also nested: --foo.bar=baz)
 * - environment variables prefixed with FLATFILE_
 * - any environment variables provided in .env files
 * - if you passed an option --config file then from that file
 * - a local .flatfilerc or the first found traversing the directory path
 * - $HOME/.flatfilerc
 * - $HOME/.flatfile/config
 * - $HOME/.config/flatfile
 * - $HOME/.config/flatfile/config
 * - /etc/flatfilerc
 * - /etc/flatfile/config
 * - default values
 *
 * @param overrides
 */
export function config(overrides?: Partial<Config>): Config {
  const fullConfig = {
    ...rawConfig,
    ...removeEmpty(overrides),
  }

  const config = interpolation.expand(fullConfig)

  const x = config.version >= 10
  const auth = config.auth === 'false' ? false : true
  return x
    ? ConfigValidation.parse(castNumbers({ ...config, x, auth }))
    : { ...config, x }
}

/**
 * Basic utility function for removing empty values from an object
 *
 * @example { foo: null, bar: '', baz: 'hello' } => { baz: 'hello' }
 * @param obj any object
 */
function removeEmpty(obj?: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj || {}).filter(([_, v]) => v != null)
  )
}

/**
 * Basic utility function to cast the numeric values of an object to a number
 *
 * @example { foo: '11', baz: 'hello' } => { foo: 11, baz: 'hello' }
 * @param obj any object
 */
function castNumbers(obj?: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(obj || {}).map(([k, v]) => [
      k,
      typeof v === 'string' && /^[0-9]+$/.test(v) ? parseInt(v, 10) : v,
    ])
  )
}

// --- the following runs globally on import as part of setup

dotenv.config()

// import .env values into rc as defaults that can be overwritten
const rawConfig = rc('flatfile', {
  // legacy configs
  env: 'test',
  version: 3,
  account: null,
  region: 'us0',
  clientId: null,
  secret: null,
  x: false,
  endpoint: 'https://api.${region}.flatfile.com',
  auth: true,

  // platform configs
  entry: null,
  api_url: 'https://platform.flatfile.com/api', // configuration property used for x
})

const ConfigValidation = z.object({
  account: z.string().nullable().optional(),
  team: z.number().nullable().optional(),
  endpoint: z.string().min(1).optional(),
  env: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  clientId: z.string().min(1).nullable().optional(),
  secret: z.string().min(1).nullable().optional(),
  version: z.number().gte(1).optional(),
  x: z.boolean().optional(),
  auth: z.boolean().optional(),
  internal: z.object({}).catchall(z.string()).optional(),

  entry: z.string().min(4).nullable().optional(),
  api_url: z.string().min(4).nullable().optional(),
})

export type Config = z.infer<typeof ConfigValidation>
