import { EventDriver } from './_EventDriver'
import { EventHandler, FlatfileEvent } from '../events'

/**
 * Flatfile's Virtual Machine is stateless / serverless. So when a new event
 * is handled, it will just call `handle(event)`.
 */
export class FlatfileVirtualMachine extends EventDriver {
  /**
   * This method is triggered from within the Flatfile Core VM Runner. This
   * EventDriver does not have to listen for events because this method will
   * be invoked as necessary.
   *
   * @param event
   */

  handle(event: FlatfileEvent) {
    this.dispatchEvent(event)
  }

  mountEventHandler(handler: EventHandler): this {
    this._handler = handler
    return this
  }
}
