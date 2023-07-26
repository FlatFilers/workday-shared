import api, { Flatfile } from '@flatfile/api'

export class DedupeRecords {
  /**
   * The identifier of the sheet being processed.
   */
  private readonly sheetId: string

  /**
   * The unique identifier key used for deduplication.
   */
  private readonly mergeKey: string

  /**
   * A map to store records unique by the merge key.
   */
  private uniqueRecordsByID: Map<string, any> = new Map()

  /**
   * An array to store the IDs of duplicate records to be deleted.
   */
  private recordIdsToDelete: string[] = []

  /**
   * An array to store records to be updated after merging duplicate records.
   */
  private recordsToUpdate: Flatfile.Records = []

  /**
   * @param sheetId - The identifier of the sheet being processed.
   * @param mergeKey - The unique identifier key used for deduplication.
   */
  constructor(sheetId: string, mergeKey: string) {
    this.sheetId = sheetId
    this.mergeKey = mergeKey
  }

  /**
   * The main function to deduplicate records.
   */
  public async dedupeRecords() {
    const allRecords = await this.getAllRecords()
    await this.processRecords(allRecords)
    await this.deleteRemainingRecords()
    await this.updateRemainingRecords()
  }

  /**
   * A method to fetch all records, handling pagination as necessary.
   */
  private async getAllRecords() {
    const recordsResponse = await api.records.get(this.sheetId, {
      includeCounts: true,
    })
    const total = recordsResponse?.data?.counts?.total
    const pages = total && Math.ceil(total / 1000)
    const additionalPages: Flatfile.RecordWithLinks[] = []

    for (let i = 2; i <= pages; i++) {
      const moreRecords = await api.records.get(this.sheetId, {
        includeCounts: true,
        pageNumber: i,
      })
      if (moreRecords.data?.records) {
        additionalPages.push(...moreRecords.data.records)
      }
    }

    return additionalPages.length > 0
      ? recordsResponse?.data?.records?.concat(additionalPages)
      : recordsResponse?.data?.records
  }

  /**
   * Merge old and new record values.
   * @param oldValues - The original record values.
   * @param newValues - The new record values.
   */
  private mergeValues(oldValues, newValues) {
    let merged = { ...oldValues }
    for (let key in newValues) {
      let newValue = newValues[key].value
      newValue = newValue === '' ? null : newValue
      if (newValue !== null && newValue !== undefined) {
        merged[key] = newValues[key]
      }
    }
    return merged
  }

  /**
   * Process each record and handle duplicates.
   * @param allRecords - All records from the sheet.
   */
  private async processRecords(allRecords: Flatfile.RecordWithLinks[]) {
    for (const record of allRecords) {
      const uniqueId = record.values[this.mergeKey]?.value?.toString()
      if (this.uniqueRecordsByID.has(uniqueId)) {
        await this.handleDuplicateRecord(uniqueId, record)
      } else {
        this.handleUniqueRecord(uniqueId, record)
      }
    }
  }

  /**
   * Handle a record that is determined to be a duplicate.
   * @param uniqueId - The uniqueId of the record.
   * @param record - The record to be processed.
   */
  private async handleDuplicateRecord(
    uniqueId: string,
    record: Flatfile.RecordWithLinks
  ) {
    const existingRecord = this.uniqueRecordsByID.get(uniqueId)
    const newRecordNonNullValues = {
      id: record.id,
      values: Object.fromEntries(
        Object.entries(record.values).filter(([_, val]) => val.value !== null)
      ),
    }
    this.recordIdsToDelete.push(existingRecord.id)
    const uniqueRecordValues = this.mergeValues(
      existingRecord.values,
      newRecordNonNullValues.values
    )
    this.uniqueRecordsByID.set(uniqueId, {
      ...existingRecord,
      id: record.id,
      values: uniqueRecordValues,
      count: existingRecord.count + 1,
    })

    if (this.recordIdsToDelete.length >= 100) {
      await api.records.delete(this.sheetId, { ids: this.recordIdsToDelete })
      this.recordIdsToDelete = []
    }
  }

  /**
   * Handle a record that is determined to be unique.
   * @param uniqueId - The uniqueId of the record.
   * @param record - The record to be processed.
   */
  private handleUniqueRecord(
    uniqueId: string,
    record: Flatfile.RecordWithLinks
  ) {
    this.uniqueRecordsByID.set(uniqueId, {
      id: record.id,
      values: record.values,
      count: 1,
    })
  }

  /**
   * Delete any remaining records in the delete queue.
   */
  private async deleteRemainingRecords() {
    if (this.recordIdsToDelete.length > 0) {
      await api.records.delete(this.sheetId, { ids: this.recordIdsToDelete })
    }
  }

  /**
   * Update any remaining records in the update queue.
   */
  private async updateRemainingRecords() {
    for (let [_uniqueId, record] of this.uniqueRecordsByID) {
      if (record.count > 1) {
        record.values[this.mergeKey].messages = [] // <-- INSERTED THIS LINE
        this.recordsToUpdate.push({
          id: record.id,
          values: record.values,
        })
      }
    }

    while (this.recordsToUpdate.length) {
      const batch = this.recordsToUpdate.splice(0, 1000)
      await api.records.update(this.sheetId, batch)
    }
  }
}
