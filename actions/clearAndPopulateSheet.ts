import api from '@flatfile/api'
import { authenticateAndFetchData } from '../soapRequest/authenticateAndFetchData'
// Import all metadata
import * as metadata from '../soapRequest/soapMetadata'

async function clearAndPopulateSheet(event) {
  // Declare sheetName outside the try block to ensure it's accessible in both try and catch blocks
  let sheetName = ''

  try {
    console.log('Event: ', event)

    // Extract sheet name from job name in the payload
    sheetName = event.payload.job
      .split('refresh')[1]
      .split('Data')[0]
      .toLowerCase()
    
    console.log(`${JSON.stringify(event.payload,null,2)}`)

    // Determine the metadata based on the sheet name
    const targetMetadata = metadata[`${sheetName}Metadata`]
    if (!targetMetadata) {
      throw new Error(`Metadata not found for sheet: ${sheetName}`)
    }

    // Get the ID of the workbook
    const workbookId = event.context.workbookId
    // Retrieve the workbook details
    const workbook = await api.workbooks.get(workbookId)

    // Find the target sheet using the extracted sheet name
    const targetSheet = workbook.data.sheets.find((s) =>
      s.config.slug.includes(sheetName)
    )

    if (targetSheet) {
      console.log(
        `${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)} sheet found`
      )
      const sheetId = targetSheet.id

      console.log(`Fetching ${sheetName} data...`)
      // Fetch data using the determined metadata
      const data = await authenticateAndFetchData(
        event.context.spaceId,
        targetMetadata
      )
      console.log(`Fetched ${sheetName} data:`, data)

      if (data) {
        // Check each data item for required fields
        // This logic might need further adjustments based on specific requirements for each sheet
        data.forEach((item, index) => {
          if (!item.name || !item.id) {
            console.log(`Undefined name or id at index ${index}:`, item)
          }
        })

        console.log(`${sheetName} data fetched successfully`)
        console.log('Data:', data)

        console.log(`Deleting existing records from the ${sheetName} sheet...`)
        // Get the existing records from the sheet
        const existingRecords = await api.records.get(sheetId)
        console.log('Existing records:', existingRecords)

        // Extract the record IDs to delete
        const recordIdsToDelete = existingRecords.data.records.map(
          (record) => record.id
        )

        // Check if there are any existing records to delete
        if (recordIdsToDelete.length === 0) {
          console.log('No existing records to delete.')
        } else {
          console.log(`Deleting ${recordIdsToDelete.length} records...`)
          // Delete the existing records from the sheet in batches
          const batchSize = 100 // Set the desired batch size
          const totalBatches = Math.ceil(recordIdsToDelete.length / batchSize)
          for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize
            const end = (i + 1) * batchSize
            const batchIds = recordIdsToDelete.slice(start, end)
            await api.records.delete(sheetId, { ids: batchIds })
            console.log(`Batch ${i + 1}/${totalBatches} deleted.`)
          }
          console.log('All existing records deleted.')
        }

        // Prepare the request to insert the data
        // Map each data item to the request format expected by the API
        const request = data.map(({ name, id }) => ({
          name: { value: name },
          id: { value: id },
        }))

        console.log(`Inserting ${sheetName} data...`)
        // Insert the data into the sheet
        const insertData = await api.records.insert(sheetId, request)
        console.log('Inserted records:', insertData)

        console.log(`All ${sheetName} data inserted.`)
      } else {
        console.error(`Error: Failed to fetch ${sheetName} data`)
      }
    } else {
      console.error(`Error: ${sheetName} sheet not found`)
    }
  } catch (error) {
    console.error(
      `Error occurred during clear and populate of ${sheetName}:`,
      error
    )
  }
}

export { clearAndPopulateSheet }
