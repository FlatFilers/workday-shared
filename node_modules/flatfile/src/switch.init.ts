import { init as legacyInit, LegacyInitOptions } from './legacy/actions/init'
import { init as xInit, XInitOptions } from './x/actions/init.action'

type InitOptions = XInitOptions & LegacyInitOptions

export function switchInit(options: InitOptions) {
  if (options.x) {
    xInit(options)
  } else {
    legacyInit(options)
  }
}
