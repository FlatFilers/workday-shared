import { FlatfileEvent } from '@flatfile/listener'
import { FlatfileRecord, FlatfileRecords } from '@flatfile/hooks'
import { Record_, Records } from '@flatfile/api/api'
import { RecordTranslater } from './record.translater'
import { asyncBatch } from '@flatfile/util-common'

export const RecordHook = async (
  event: FlatfileEvent,
  handler: (
    record: FlatfileRecord,
    event?: FlatfileEvent
  ) => any | Promise<any>,
  options: { stripMessages?: boolean } = { stripMessages: true }
) => {
  return BulkRecordHook(
    event,
    async (records, event) => {
      return records.map((record) => handler(record, event))
    },
    options
  )
}

export const BulkRecordHook = async (
  event: FlatfileEvent,
  handler: (
    records: FlatfileRecord[],
    event?: FlatfileEvent
  ) => any | Promise<any>,
  options: {
    chunkSize?: number
    parallel?: number
    stripMessages?: boolean
  } = { stripMessages: true }
) => {
  try {
    const records = (await event.data).records
    if (!records) return

    console.log('Strip messages: ', options.stripMessages)

    const batch = await prepareXRecords(records, options.stripMessages)

    // run client defined data hooks
    await asyncBatch(batch.records, handler, options, event)

    const recordsUpdates = new RecordTranslater<FlatfileRecord>(
      batch.records
    ).toXRecords()

    // await event.cache.set('records', async () => recordsUpdates)

    // event.afterAll(async () => {
    //   const records = event.cache.get<Records>('records')
    try {
      return await event.update(recordsUpdates)
    } catch (e) {
      console.log(`Error updating records: ${e}`)
    }
    // })
  } catch (e) {
    console.log(`Error getting records: ${e}`)
  }

  return handler
}

const prepareXRecords = async (
  records: any,
  stripMessages: boolean
): Promise<FlatfileRecords<any>> => {
  const clearedMessages: Record_[] = records.map(
    (record: { values: { [x: string]: { messages: never[] } } }) => {
      // clear existing cell validation messages
      if (stripMessages) {
        Object.keys(record.values).forEach((k) => {
          record.values[k].messages = []
        })
      }
      return record
    }
  )
  const fromX = new RecordTranslater<Record_>(clearedMessages)
  return fromX.toFlatFileRecords()
}
