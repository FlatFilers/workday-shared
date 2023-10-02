import { RecordHook } from '@flatfile/plugin-record-hook'
import api from '@flatfile/api'
import { blueprint } from './blueprint/blueprint'
import { xlsxExtractorPlugin } from '@flatfile/plugin-xlsx-extractor'
import { DedupeRecords } from './actions/dedupe.records'
import { validateRecord } from './validationsDictionary/recordValidators'
import { validateReportingStructure } from './actions/validateReportingStructure'
import { SupervisoryOrgStructureBuilder } from './actions/buildSupervisoryOrgStructure'
require('dotenv').config()
import { clearAndPopulateSheet } from './actions/clearAndPopulateSheet'
import { createPage } from './workflow/welcome-page'
import { createAndInviteGuests } from './guests/createAndInviteGuests'
import csvZip from './actions/csvZip'
import { locationsMetadata } from './soapRequest/soapMetadata'
import { authenticateAndFetchData } from './soapRequest/authenticateAndFetchData'
import { costCentersMetadata } from './soapRequest/soapMetadata'
import { companiesMetadata } from './soapRequest/soapMetadata'
import { jobsMetadata } from './soapRequest/soapMetadata'
const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')
import { DelimiterExtractor } from '@flatfile/plugin-delimiter-extractor'
import theme from './workflow/theme'
import { addSecrets } from './workflow/addSecrets'
import { fetchWorkdaySecrets } from './workflow/fetchWorkdaySecrets'

export default function (listener) {
  // LOG ALL EVENTS IN THE ENVIRONMENT
  // This is safe to remove, just useful for development
  listener.on('**', (event) => {
    console.log(
      `-> My event listener received an event: ${JSON.stringify(event.topic)}`
    )
  })

  // Separate distinct actions into smaller functions
  async function addSecretsToSpace(spaceId, environmentId) {
    await addSecrets(spaceId, environmentId)
    console.log('Secrets added successfully to the space.')
  }

  async function fetchAndLogWorkdaySecrets(spaceId, environmentId) {
    const secrets = await fetchWorkdaySecrets(spaceId, environmentId)
    console.log('Fetched Workday secrets successfully:', secrets)
    return secrets
  }

  async function createWorkbookFromBlueprint(spaceId, environmentId) {
    return await api.workbooks.create({
      spaceId,
      environmentId,
      labels: ['primary'],
      name: 'Worker + Org Import',
      sheets: blueprint,
      actions: [
        {
          operation: 'downloadCSV',
          mode: 'foreground',
          label: 'Download ZIP File of Workbook Data',
          description: 'Downloads ZIP File of Workbook Data',
          primary: true,
        },
        {
          operation: 'downloadExcelWorkbook',
          mode: 'foreground',
          label: 'Download Excel Workbook',
          description: 'Downloads Excel Workbook of Data',
          primary: false,
        },
        {
          operation: 'downloadExcelTemplate',
          mode: 'foreground',
          label: 'Download Excel Template',
          description: 'Downloads Excel Templates of Workbook',
          primary: false,
        },
      ],
    })
  }

  async function handleSpaceConfiguration(event) {
    const { spaceId, environmentId, jobId } = event.context

    await api.jobs.ack(jobId, {
      info: 'Creating Space',
      progress: 10,
    })

    await createPage(spaceId)

    try {
      await addSecretsToSpace(spaceId, environmentId)
    } catch (error) {
      console.error('Error adding secrets to the space:', error)
    }

    let secrets
    try {
      secrets = await fetchAndLogWorkdaySecrets(spaceId, environmentId)
    } catch (error) {
      console.error('Error fetching Workday secrets:', error)
    }

    const createWorkbook = await createWorkbookFromBlueprint(
      spaceId,
      environmentId
    )
    const workbookId = createWorkbook.data?.id

    if (workbookId) {
      const updatedSpace = await api.spaces.update(spaceId, {
        environmentId,
        primaryWorkbookId: workbookId,
        metadata: {
          theme: theme,
        },
      })

      await createAndInviteGuests(updatedSpace, event)
    }

    if (secrets) {
      const allSecretsPresent =
        secrets.username &&
        secrets.password &&
        secrets.tenantUrl &&
        secrets.dataCenter

      if (allSecretsPresent) {
        console.log(
          `Space Configuration Completed: All secrets were provided, the space has been seeded with reference data from Workday Tenant: ${secrets.tenantUrl}.`
        )
        await api.jobs.complete(jobId, {
          outcome: {
            acknowledge: true,
            message: `Space Configuration Completed: All secrets were provided, the space has been seeded with reference data from Workday Tenant: ${secrets.tenantUrl}.`,
          },
        })
      } else {
        console.log(
          'Space Config Completed: Secrets are missing. Please update them manually in the space and refresh all necessary sheets to get the reference data from Workday.'
        )
        await api.jobs.complete(jobId, {
          outcome: {
            acknowledge: true,
            next: {
              type: 'url',
              url: `https://spaces.flatfile.com/space/${spaceId}/secrets`,
              label: 'Go to Secrets',
            },
            message:
              'Space Configuration Completed: Secrets are missing. Please ensure that all secrets have been added to the space. Once all secrets have been added, please refresh all necessary sheets to get the reference data from Workday. Secrets necessary are: WORKDAY_USERNAME, WORKDAY_PASSWORD, WORKDAY_TENANT_URL, and WORKDAY_DATA_CENTER.',
          },
        })
      }
    } else {
      await api.jobs.complete(jobId, {
        outcome: {
          message:
            'Space is completed, but there was an error fetching Workday secrets.',
        },
      })
    }
  }

  // SET UP THE SPACE
  listener.filter({ job: 'space:configure' }, (configure) => {
    configure.on('job:ready', handleSpaceConfiguration)
    configure.on('job:failed', async (event) => {
      console.log('Space Config Failed:', event)
    })
    configure.on('job:completed', async (event) => {
      console.log('Space Config Completed:', event)
    })
  })

  // Separate distinct actions into smaller functions

  async function fetchAndValidateSecrets(spaceId, environmentId) {
    const secrets = await fetchWorkdaySecrets(spaceId, environmentId)
    const allSecretsPresent =
      secrets &&
      secrets.username &&
      secrets.password &&
      secrets.tenantUrl &&
      secrets.dataCenter
    if (!allSecretsPresent) {
      console.error('Necessary secrets are missing.')
      return null
    }
    return secrets
  }

  async function getWorkbook(workbookId) {
    try {
      return await api.workbooks.get(workbookId)
    } catch (error) {
      console.error('Error getting workbook:', error.message)
      return null
    }
  }

  function mapCompanyData({ name, id }) {
    return { name: { value: name }, id: { value: id } }
  }

  function mapCostCenterData({ name, id }) {
    return { name: { value: name }, id: { value: id } }
  }

  function mapJobData({ jobCode, jobTitle, jobClassification, jobPayRate }) {
    return {
      code: { value: jobCode },
      title: { value: jobTitle },
      classification: { value: jobClassification },
      pay_rate_type: { value: jobPayRate },
    }
  }

  function mapLocationData({ name, id }) {
    return { name: { value: name }, id: { value: id } }
  }

  async function processSheet(sheet, spaceId, mapFunc, metadata) {
    console.log(`${sheet.config.slug} sheet found`)
    try {
      console.log(`Fetching ${sheet.config.slug} data...`)
      const data = await authenticateAndFetchData(spaceId, metadata)
      if (!data) {
        console.error(`Error: Failed to fetch ${sheet.config.slug} data`)
        return
      }

      console.log(
        `Fetched ${data.length} ${sheet.config.slug} records successfully`
      )
      const request = data.map(mapFunc)
      console.log(`Inserting ${sheet.config.slug} data...`)

      const insertedRecords = await api.records.insert(sheet.id, request)

      if (
        !insertedRecords ||
        !insertedRecords.data ||
        !insertedRecords.data.success
      ) {
        console.error(
          `Error: No records were inserted for ${sheet.config.slug}`
        )
        return
      }

      // Assume that if success is true, all records were inserted successfully.
      console.log(
        `Inserted ${data.length} ${sheet.config.slug} records successfully`
      )
    } catch (error) {
      console.error(
        `Error processing ${sheet.config.slug} sheet:`,
        error.message
      )
    }
  }

  // SEED THE WORKBOOK WITH DATA workbook:created
  listener.on('workbook:created', async (event) => {
    if (!event.context || !event.context.workbookId) {
      console.error('Event context or workbookId missing')
      return
    }

    const secrets = await fetchAndValidateSecrets(
      event.context.spaceId,
      event.context.environmentId
    )
    if (!secrets) return

    const workbook = await getWorkbook(event.context.workbookId)
    if (!workbook) return

    const workbookName = workbook.data?.name || ''
    const spaceId = workbook.data?.spaceId || ''
    if (!workbookName.includes('Worker + Org Import')) {
      console.log('Workbook does not match the expected name')
      return
    }

    const sheets = workbook.data?.sheets || []
    const companiesSheet = sheets.find((s) =>
      s.config.slug.includes('companies')
    )
    const costCentersSheet = sheets.find((s) =>
      s.config.slug.includes('cost_centers')
    )
    const jobsSheet = sheets.find((s) => s.config.slug.includes('jobs'))
    const locationsSheet = sheets.find((s) =>
      s.config.slug.includes('locations')
    )

    if (companiesSheet)
      await processSheet(
        companiesSheet,
        spaceId,
        mapCompanyData,
        companiesMetadata
      )
    if (costCentersSheet)
      await processSheet(
        costCentersSheet,
        spaceId,
        mapCostCenterData,
        costCentersMetadata
      )
    if (jobsSheet)
      await processSheet(jobsSheet, spaceId, mapJobData, jobsMetadata)
    if (locationsSheet)
      await processSheet(
        locationsSheet,
        spaceId,
        mapLocationData,
        locationsMetadata
      )
  })

  // VALIDATION & TRANSFORMATION RULES WITH DATA HOOKS
  listener.on('commit:created', async (event) => {
    try {
      console.log('commit:created event triggered') // Log when the event is triggered

      // Retrieve the sheetId from the event context
      const sheetId = event.context.sheetId
      console.log(`Retrieved sheetId from event: ${sheetId}`) // Log the retrieved sheetId

      // Fetch the sheet from the API
      const sheet = await api.sheets.get(sheetId)

      // Only log that the sheet was fetched successfully
      if (!sheet) {
        console.log(`Failed to fetch sheet with id: ${sheetId}`)
        return
      }
      console.log(`Sheet with id: ${sheetId} fetched successfully.`)

      // Verify that the sheetSlug matches 'workers'
      if (sheet.data.config?.slug === 'workers') {
        console.log(
          "Confirmed: sheetSlug matches 'workers'. Proceeding to call RecordHook..."
        ) // Log before calling RecordHook

        // Get the fields from the sheet response
        const fields = sheet.data.config?.fields

        // Log only the number of fields retrieved
        if (!fields) {
          console.log('No fields were fetched.')
          return
        }
        console.log(`Successfully fetched ${fields.length} fields.`)

        // Call the RecordHook function with event and a handler
        await RecordHook(event, async (record, event) => {
          console.log("Inside RecordHook's handler function") // Log inside the handler function
          try {
            await validateRecord(record, fields) // Using the validateRecord function here
          } catch (error) {
            console.error('Error in validateRecord:', error)
          }
          console.log("Exiting RecordHook's handler function") // Log when exiting the handler function
          return record
        })
        console.log('Finished calling RecordHook') // Log after calling RecordHook
      } else {
        console.log(
          "Failed: sheetSlug does not match 'workers'. Aborting RecordHook call..."
        )
      }
    } catch (error) {
      console.error('Error in commit:created event handler:', error)
    }
  })

  // RUN ACTIONS TRIGGERED BY USERS

  // DEDUPE FROM WORKERS SHEET
  listener.filter({ job: 'sheet:dedupeWorkers' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Deduplicating Workers...',
          progress: 10, //optional
        })

        // Call the dedupeEmployees function with the records
        await new DedupeRecords(sheetId, 'Applicant_ID').dedupeRecords()

        await api.jobs.complete(jobId, {
          info: 'This job is now complete.',
        })
      } catch (error) {
        console.log(`Error: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          info: 'This job did not work.',
        })
      }
    })
  })

  // VALIDATE REPORTING STRUCTURE FROM WORKERS SHEET
  listener.filter({ job: 'sheet:validateReportingStructure' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Validating Reporting Structure...',
          progress: 10, //optional
        })

        // Call the 'get' method of api.records with the sheetId
        const response = await api.records.get(sheetId)

        // Check if the response is valid and contains records
        if (response?.data?.records) {
          // Get the records from the response data
          const records = response.data.records

          // Call the validateReportingStructure function with the records
          const reportingErrors = validateReportingStructure(records)

          // Update the records if there are any reporting errors
          if (reportingErrors.length > 0) {
            await api.records.update(sheetId, reportingErrors)
            console.log('Records updated successfully.')
            // For example, you can send them as a notification or store them in a database
          } else {
            console.log('No records found for updating.')
          }
        } else {
          console.log('No records found in the response.')
        }

        await api.jobs.complete(jobId, {
          info: 'This job is now complete.',
        })
      } catch (error) {
        console.log(`Error: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          info: 'This job did not work.',
        })
      }
    })
  })

  // Listener where job is being handled
  listener.filter({ job: 'sheet:buildSupOrgStructure' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId, workbookId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Building Supervisory Organization Structure...',
          progress: 10,
        })

        const orgStructureBuilder = new SupervisoryOrgStructureBuilder(
          workbookId,
          sheetId
        )
        await orgStructureBuilder.buildSupervisoryOrgStructure()

        await api.jobs.complete(jobId, {
          info: 'This job is now complete.',
          outcome: {
            acknowledge: true,
            message:
              'Supervisory Organization Structure has been built successfully! Please navigate to the Supervisory Orgs sheet to view the results.',
          },
        })
      } catch (error) {
        console.error('Error:', error)
        await api.jobs.fail(jobId, {
          info: `Job failed due to error: ${error.message}`,
          outcome: {
            message: `Job failed due to error: ${error.message}`,
            acknowledge: true,
          },
        })
      }
    })
  })

  listener.filter({ job: 'sheet:refresh*Data' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: `Refreshing Data...`,
          progress: 10, // optional
        })

        // Call the clearAndPopulateSheet function
        await clearAndPopulateSheet(event)

        await api.jobs.complete(jobId, {
          info: 'This job is now complete.',
        })
      } catch (error) {
        console.error('Error:', error)
        await api.jobs.fail(jobId, {
          info: 'This job did not work.',
        })
      }
    })
  })

  // TRIMMING ALL
  // listener.on("commit:created", async (event) => {
  // event.context.sheet.records.value
  // for each value in each record
  // run .trim()
  // })

  listener.filter({ job: 'workbook:downloadExcelWorkbook' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, workbookId, spaceId, environmentId } = event.context

      console.log(
        `JobId: ${jobId}, WorkbookId: ${workbookId}, SpaceId: ${spaceId}, EnvironmentId: ${environmentId}`
      )

      try {
        // Get all sheets
        const sheetsResponse = await api.sheets.list({ workbookId })
        console.log('Sheets API Response:', sheetsResponse)
        if (!sheetsResponse.data) {
          throw new Error(
            `Failed to fetch sheets. Response: ${JSON.stringify(
              sheetsResponse
            )}`
          )
        }

        const sheets = sheetsResponse.data || []
        console.log('Sheets retrieved:', sheets)

        const records = {}
        for (const [index, sheet] of sheets.entries()) {
          const sheetRecords = await api.records.get(sheet.id)
          if (!sheetRecords.data) {
            throw new Error(
              `Failed to fetch records for sheet ${
                sheet.name
              }. Response: ${JSON.stringify(sheetRecords)}`
            )
          }
          records[sheet.name] = sheetRecords
        }
        console.log('Records for sheets:', records)

        await api.jobs.ack(jobId, {
          info: 'Starting job to write to Excel file',
          progress: 10,
        })

        // Create new workbook
        const workbook = new ExcelJS.Workbook()
        console.log('New workbook created')

        // For each sheet, populate Excel with data
        for (const sheet in records) {
          // Limit sheet name to 31 characters initially
          const initialName = sheet.substring(0, 31)

          let counter = 1
          let uniqueSheetName = initialName

          while (workbook.getWorksheet(uniqueSheetName)) {
            // Deduct 2 characters for "_X", or 3 for "_XX" etc., based on the number of digits in the counter.
            const baseLength = 31 - (1 + counter.toString().length)
            uniqueSheetName = `${initialName.substring(
              0,
              baseLength
            )}_${counter}`
            counter++

            if (counter > 99) {
              // Safety check to prevent infinite loops
              throw new Error(
                'Too many duplicate sheet names. Please review the data.'
              )
            }
          }

          const newWorksheet = workbook.addWorksheet(uniqueSheetName)
          const data = records[sheet].data.records

          let headers = []

          if (data.length > 0) {
            // Add headers based on the keys of the `values` object in the first record
            headers = Object.keys(data[0].values)
          } else {
            console.log(`No records for sheet: ${sheet}`) // Debugging statement 1

            // If there are no records, fetch headers from the sheet's configuration
            const matchingSheetConfig = sheets.find((s) => s.name === sheet)

            if (matchingSheetConfig) {
              console.log(`Found matching config for sheet: ${sheet}`) // Debugging statement 2

              if (
                matchingSheetConfig.config &&
                matchingSheetConfig.config.fields
              ) {
                headers = matchingSheetConfig.config.fields.map(
                  (field) => field.key
                )
                console.log(`Generated headers for sheet ${sheet}:`, headers) // Debugging statement 3
              }
            }
          }

          if (headers.length > 0) {
            newWorksheet.addRow(headers)
          }
          // For each row of data, write to Excel
          data.forEach((record) => {
            const cellData = record.values
            const newRow = []
            Object.entries(cellData).forEach(([, value]) => {
              newRow.push(value.value)
            })
            newWorksheet.addRow(newRow)
          })
        }
        console.log('Data written to workbook')

        // Get current date-time
        const dateTime = new Date().toISOString().replace(/[:.]/g, '-')

        // Write workbook to a file
        const tempFilePath = path.join(__dirname, `Workbook_${dateTime}.xlsx`)
        await workbook.xlsx.writeFile(tempFilePath)

        // Read the file as a stream
        const fileStream = fs.createReadStream(tempFilePath)

        // Upload the workbook to Flatfile as a file
        const fileUploadResponse = await api.files.upload(fileStream, {
          spaceId,
          environmentId,
          mode: 'export',
        })
        console.log('File uploaded:', fileUploadResponse)

        await api.jobs.complete(jobId, {
          outcome: {
            message:
              'Data was successfully written to Excel file and uploaded. You can access the workbook in the "Available Downloads" section of the Files page in Flatfile.',
          },
        })
      } catch (error) {
        console.error('Error:', error)
        try {
          await api.jobs.fail(jobId, {
            outcome: {
              message:
                'Job failed due to an unexpected error. Please check logs for more details.',
            },
          })
        } catch (apiError) {
          console.error('Error while reporting job failure:', apiError)
        }
      }
    })
  })

  listener.filter({ job: 'workbook:downloadExcelTemplate' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, workbookId, spaceId, environmentId } = event.context

      console.log(
        `JobId: ${jobId}, WorkbookId: ${workbookId}, SpaceId: ${spaceId}, EnvironmentId: ${environmentId}`
      )

      try {
        const sheetsResponse = await api.sheets.list({ workbookId })
        console.log('Sheets API Response:', sheetsResponse)
        if (!sheetsResponse.data) {
          throw new Error(
            `Failed to fetch sheets. Response: ${JSON.stringify(
              sheetsResponse
            )}`
          )
        }

        const sheets = sheetsResponse.data || []
        console.log('Sheets retrieved:', sheets)

        await api.jobs.ack(jobId, {
          info: 'Starting job to write to Excel file',
          progress: 10,
        })

        const workbook = new ExcelJS.Workbook()
        console.log('New workbook created')

        sheets.forEach((sheet) => {
          // Limit sheet name to 31 characters initially
          const initialName = sheet.name.substring(0, 31)

          let counter = 1
          let uniqueSheetName = initialName

          while (workbook.getWorksheet(uniqueSheetName)) {
            // Deduct 2 characters for "_X", or 3 for "_XX" etc., based on the number of digits in the counter.
            const baseLength = 31 - (1 + counter.toString().length)
            uniqueSheetName = `${initialName.substring(
              0,
              baseLength
            )}_${counter}`
            counter++

            if (counter > 99) {
              // Safety check to prevent infinite loops
              throw new Error(
                'Too many duplicate sheet names. Please review the data.'
              )
            }
          }

          const newWorksheet = workbook.addWorksheet(uniqueSheetName)

          if (sheet.config && sheet.config.fields) {
            const fieldKeys = sheet.config.fields.map((field) => field.key)
            const attributes = [
              'Field Label',
              'Field Description',
              'Field Type',
              'Required',
              'Unique',
              'Readonly',
            ]
            newWorksheet.addRow(['Field Key'].concat(fieldKeys)) // First row is field key

            attributes.forEach((attribute) => {
              let row = [attribute] // Start each row with the attribute name
              sheet.config.fields.forEach((field) => {
                switch (attribute) {
                  case 'Field Label':
                    row.push(field.label)
                    break
                  case 'Field Description':
                    row.push(field.description || '')
                    break
                  case 'Field Type':
                    row.push(field.type)
                    break
                  case 'Required':
                    row.push(
                      field.constraints &&
                        Array.isArray(field.constraints) &&
                        field.constraints.some(
                          (constraint) => constraint.type === 'required'
                        )
                        ? 'Yes'
                        : 'No'
                    )
                    break
                  case 'Unique':
                    row.push(
                      field.constraints &&
                        Array.isArray(field.constraints) &&
                        field.constraints.some(
                          (constraint) => constraint.type === 'unique'
                        )
                        ? 'Yes'
                        : 'No'
                    )
                    break
                  case 'Readonly':
                    row.push(field.readonly ? 'Yes' : 'No')
                    break
                  default:
                    row.push('')
                }
              })
              newWorksheet.addRow(row)
            })
          }
        })

        console.log('Field attributes written to workbook')

        const dateTime = new Date().toISOString().replace(/[:.]/g, '-')
        const tempFilePath = path.join(__dirname, `Workbook_${dateTime}.xlsx`)
        await workbook.xlsx.writeFile(tempFilePath)
        const fileStream = fs.createReadStream(tempFilePath)

        const fileUploadResponse = await api.files.upload(fileStream, {
          spaceId,
          environmentId,
          mode: 'export',
        })
        console.log('File uploaded:', fileUploadResponse)

        await api.jobs.complete(jobId, {
          outcome: {
            message:
              'Field attributes were successfully written to Excel file and uploaded. You can access the workbook in the "Available Downloads" section of the Files page in Flatfile.',
          },
        })
      } catch (error) {
        console.error('Error:', error)
        try {
          await api.jobs.fail(jobId, {
            outcome: {
              message:
                'Job failed due to an unexpected error. Please check logs for more details.',
            },
          })
        } catch (apiError) {
          console.error('Error while reporting job failure:', apiError)
        }
      }
    })
  })

  //Download Data to Zipped CSV
  listener.use(csvZip)
  // PARSE XLSX FILES
  listener.use(xlsxExtractorPlugin({ rawNumbers: true }))
  //PARSE PIPE-DELIMITED TXT FILES
  listener.use(DelimiterExtractor('.txt', { delimiter: '|' }))
}
