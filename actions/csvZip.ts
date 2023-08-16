const csvWriter = require('csv-writer')
const fs = require('fs')
const path = require('path')
const os = require('os') // Import the os module
const archiver = require('archiver')
import { FlatfileListener } from '@flatfile/listener'
import api from '@flatfile/api'

export default function csvZip(listener: FlatfileListener) {
  //Download Data to CSV files and compress to a ZIP file
  listener.filter({ job: 'workbook:downloadCSV' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, workbookId, spaceId, environmentId } = event.context

      console.log(
        `JobId: ${jobId}, WorkbookId: ${workbookId}, SpaceId: ${spaceId}, EnvironmentId: ${environmentId}`
      )

      // Get all sheets
      const sheetsResponse = await api.sheets.list({ workbookId })
      const sheets = sheetsResponse.data
      console.log('Sheets retrieved:', sheets)

      const records = {}
      for (const [index, sheet] of sheets.entries()) {
        const sheetRecords = await api.records.get(sheet.id)
        records[sheet.name] = sheetRecords
      }
      console.log('Records for sheets:', records)

      try {
        await api.jobs.ack(jobId, {
          info: 'Starting job to write to CSV files',
          progress: 10,
        })

        // Get current date-time
        const dateTime = new Date().toISOString().replace(/[:.]/g, '-')

        // Get the path to the system's temporary directory
        const tempDir = os.tmpdir()

        // Create a new directory in the system's temporary directory for the CSV files
        const dir = path.join(tempDir, `CSV_Files_${dateTime}`)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }

        // For each sheet, create a CSV file and populate it with data
        for (const sheet in records) {
          // Limit sheet name to 31 characters
          const trimmedSheetName = sheet.substring(0, 31)

          const data = records[sheet].data.records

          if (data.length > 0) {
            // Create a CSV writer
            const writer = csvWriter.createObjectCsvWriter({
              path: `${dir}/${trimmedSheetName}.csv`,
              header: Object.keys(data[0].values).map((id) => ({
                id,
                title: id,
              })),
            })

            // Write records to CSV file
            await writer.writeRecords(
              data.map((record) =>
                Object.keys(record.values).reduce((acc, key) => {
                  acc[key] = record.values[key].value
                  return acc
                }, {})
              )
            )
          }
        }
        console.log('Data written to CSV files')

        // Create a ZIP file in the system's temporary directory
        const zipFilePath = path.join(tempDir, `CSV_Files_${dateTime}.zip`)
        const output = fs.createWriteStream(zipFilePath)
        const archive = archiver('zip')

        output.on('close', async function () {
          console.log(archive.pointer() + ' total bytes')

          // Read the file as a stream
          const fileStream = fs.createReadStream(zipFilePath)

          // Upload the ZIP file to Flatfile as a file
          const fileUploadResponse = await api.files.upload(fileStream, {
            spaceId,
            environmentId,
            mode: 'export',
          })
          console.log('File uploaded:', fileUploadResponse)

          await api.jobs.complete(jobId, {
            outcome: {
              message:
                'Data was successfully written to CSV files, compressed into a ZIP file, and uploaded. You can access the ZIP file in the "Available Downloads" section of the Files page in Flatfile.',
            },
          })
        })

        archive.on('error', function (err) {
          throw err
        })

        archive.pipe(output)
        archive.directory(dir, false)
        archive.finalize()
      } catch (error) {
        console.log(`Error: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't write to the CSV files, compress them into a ZIP file, or upload it.",
          },
        })
      }
    })
  })
}
