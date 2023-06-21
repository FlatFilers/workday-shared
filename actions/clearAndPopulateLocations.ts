import api from '@flatfile/api'
import { authenticateAndFetchLocations } from '../reference_data/locations.js'

async function clearAndPopulateLocations(event) {
  try {
    // Get the ID of the workbook
    const workbookId = event.context.workbookId
    // Retrieve the workbook details
    const workbook = await api.workbooks.get(workbookId)
    console.log('Workbook:', workbook)

    // Find the sheet with "locations" in its slug
    const locationsSheet = workbook.data.sheets.find((s) =>
      s.config.slug.includes('locations')
    )

    if (locationsSheet) {
      console.log('Locations sheet found')
      const locationsId = locationsSheet.id

      console.log('Fetching location data...')
      // Fetch location data from the source (e.g., API)
      const locationData = await authenticateAndFetchLocations(
        event.context.spaceId
      )
      console.log('Fetched location data:', locationData)

      if (locationData) {
        locationData.forEach((loc, index) => {
          if (!loc.locationName || !loc.locationID) {
            console.log(
              `Undefined locationName or locationID at index ${index}:`,
              loc
            )
          }
        })

        console.log('Location data fetched successfully')
        console.log('Location Data:', locationData)

        console.log('Deleting existing records from the locations sheet...')
        // Get the existing records from the locations sheet
        const existingRecords = await api.records.get(locationsId)
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
          // Delete the existing records from the locations sheet in batches
          const batchSize = 100 // Set the desired batch size
          const totalBatches = Math.ceil(recordIdsToDelete.length / batchSize)
          for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize
            const end = (i + 1) * batchSize
            const batchIds = recordIdsToDelete.slice(start, end)
            await api.records.delete(locationsId, { ids: batchIds })
            console.log(`Batch ${i + 1}/${totalBatches} deleted.`)
          }
          console.log('All existing records deleted.')
        }

        // Prepare the request to insert the location data
        const request = locationData.map(({ locationName, locationID }) => ({
          name: { value: locationName },
          id: { value: locationID },
          // Include other fields if necessary
        }))

        console.log('Inserting location data...')
        // Insert the location data into the locations sheet
        const insertLocations = await api.records.insert(locationsId, request)
        console.log('Inserted records:', insertLocations)

        console.log('All location data inserted.')
      } else {
        console.error('Error: Failed to fetch location data')
      }
    } else {
      console.error('Error: Locations sheet not found')
    }
  } catch (error) {
    console.error(
      'Error occurred during clear and populate of locations:',
      error
    )
  }
}

export { clearAndPopulateLocations }
