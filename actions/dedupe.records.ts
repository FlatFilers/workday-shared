import api, { Flatfile } from "@flatfile/api";

export class DedupeRecords {
  private readonly sheetId: string;
  private readonly mergeKey: string;
  private uniqueRecordsByID: Map<string, any> = new Map();
  private recordIdsToDelete: string[] = [];

  constructor(sheetId: string, mergeKey: string) {
    this.sheetId = sheetId;
    this.mergeKey = mergeKey;
  }

  public async dedupeRecords() {
    try {
      const allRecords = await this.getAllRecords();
      await this.processRecords(allRecords);
      await this.deleteAndUpdateRecords();
    } catch (error) {
      console.error(`Failed to deduplicate records: ${error}`);
    }
  }

  private async getAllRecords() {
    let recordsResponse = await api.records.get(this.sheetId, { includeCounts: true });
    const total = recordsResponse?.data?.counts?.total;
    const pageSize = recordsResponse?.data?.records?.length;
    const pages = total && Math.ceil(total / pageSize);
    const additionalPages: Flatfile.RecordWithLinks[] = [];

    for (let i = 2; i <= pages; i++) {
      const moreRecords = await api.records.get(this.sheetId, { includeCounts: true, pageNumber: i });
      if (moreRecords.data?.records) {
        additionalPages.push(...moreRecords.data.records);
      }
    }

    return [...(recordsResponse?.data?.records || []), ...additionalPages];
  }

  private mergeValues(existingRecordValues: Record<string, any>, newRecordValues: Record<string, any>) {
    let mergedValues = {...existingRecordValues};
  
    for (let key in newRecordValues) {
      let newValue = newRecordValues[key]?.value;
      let existingValue = existingRecordValues[key]?.value;
  
      if ((newValue !== null && newValue !== '') || existingValue === null || existingValue === '') {
        mergedValues[key] = newRecordValues[key];
      }
    }
  
    return mergedValues;
  }
  

  private async processRecords(allRecords: Flatfile.RecordWithLinks[]) {
    for (const record of allRecords) {
      const uniqueId = record.values[this.mergeKey]?.value?.toString();
      if (uniqueId) {
        if (this.uniqueRecordsByID.has(uniqueId)) {
          this.handleDuplicateRecord(uniqueId, record);
        } else {
          this.uniqueRecordsByID.set(uniqueId, record);
        }
      }
    }
  }

  private handleDuplicateRecord(uniqueId: string, newRecord: Flatfile.RecordWithLinks) {
    const existingRecord = this.uniqueRecordsByID.get(uniqueId);
    const mergedValues = this.mergeValues(existingRecord.values, newRecord.values);
    this.recordIdsToDelete.push(existingRecord.id);
    this.uniqueRecordsByID.set(uniqueId, { ...newRecord, values: mergedValues });
  }

  private async deleteAndUpdateRecords() {
    const recordBatches = Array.from(this.uniqueRecordsByID.values())
      .map(record => ({ id: record.id, values: record.values }))
      .reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index/1000);
        if(!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = []
        }
        resultArray[chunkIndex].push(item);
        return resultArray
      }, []);

    const deletionBatches = this.recordIdsToDelete.reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index/1000);
        if(!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = []
        }
        resultArray[chunkIndex].push(item);
        return resultArray
      }, []);

    for (const ids of deletionBatches) {
      await api.records.delete(this.sheetId, { ids });
    }

    for (const records of recordBatches) {
      await api.records.update(this.sheetId, records);
    }
  }
}