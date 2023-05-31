import { FlatfileListener, FlatfileVirtualMachine } from '../'

const example = FlatfileListener.create((client) => {
  /**
   * This is a basic hook on events with no sugar on top
   */
  client.on('records:*', { target: 'sheet(TestSheet)' }, async (event) => {
    const { workbookId, sheetId } = event.context
    try {
      const records = await event.data
      const recordsUpdates = records?.records.map((record: any) => {
        record.values.middleName.value = 'TestSheet'

        return record
      })
      await client.api.updateRecords({
        workbookId,
        sheetId,
        recordsUpdates,
      })
    } catch (e) {
      console.log(`Error getting records: ${e}`)
    }
  })

  /**
   * This is a setup of the space with its workbooks
   */
  client.on('client:init', async (event) => {
    console.log('client:init')
  })
})

const FlatfileVM = new FlatfileVirtualMachine()

example.mount(FlatfileVM)

export default example
