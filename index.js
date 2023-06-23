import { recordHook } from '@flatfile/plugin-record-hook'
import api from '@flatfile/api'
import { blueprint } from './blueprint/blueprint'
import { xlsxExtractorPlugin } from '@flatfile/plugin-xlsx-extractor'
import { DedupeRecords } from './actions/dedupe.records'
import { employeeValidations } from './validations/employeeValidations'
const { authenticateAndFetchLocations } = require('./reference_data/locations')
import { validateReportingStructure } from './actions/validateReportingStructure'
import { SupervisoryOrgStructureBuilder } from './actions/buildSupervisoryOrgStructure'
import axios from 'axios'
require('dotenv').config()
import { clearAndPopulateLocations } from './actions/clearAndPopulateLocations'
import { createPage } from './workflow/welcome-page'
import { retrieveBlueprint } from './workflow/retrieve-blueprint'
import { isNil, isNotNil } from './validations/common/helpers'
import { createAndInviteGuests } from './guests/createAndInviteGuests'
import { companies } from './reference_data/companies'
import { cost_centers } from './reference_data/cost_centers'
import { jobs } from './reference_data/jobs'
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

export default function (listener) {
  // LOG ALL EVENTS IN THE ENVIRONMENT
  // This is safe to remove, just useful for development
  listener.on('**', (event) => {
    console.log(
      `-> My event listener received an event: ${JSON.stringify(event.topic)}`
    )
  })

  // SET UP THE SPACE
  listener.filter({ job: 'space:configure' }, (configure) => {
    // Add an event listener for the 'job:created' event with a filter on 'space:configure'
    configure.on('job:ready', async (event) => {
      // Destructure the 'context' object from the event object to get the necessary IDs
      const { spaceId, environmentId, jobId } = event.context
      const space = await api.spaces.get(spaceId)

      // Acknowledge the job with progress and info using api.jobs.ack
      await api.jobs.ack(jobId, {
        info: 'Creating Space',
        progress: 10,
      })

      // ADD CUSTOM MARKDOWN PAGE TO SPACE
      const page = await createPage(spaceId)

      // GET & SAVE CREDS FOR WORKDAY TENANT
      // assumes username and password have been set on the space metadata
      let username, password, tenantUrl
      if (
        isNil(space.data.metadata?.creds?.username) ||
        isNil(space.data.metadata?.creds?.password) ||
        isNil(space.data.metadata?.creds?.tenantUrl)
      ) {
        username = process.env.USERNAME.split('@')[0]
        password = process.env.PASSWORD
        tenantUrl = process.env.USERNAME.split('@')[1]
      } else {
        username = space.data.metadata?.creds?.username || {}
        password = space.data.metadata?.creds?.password || {}
        tenantUrl = space.data.metadata?.creds?.tenantUrl || {}
      }

      // PLACEHOLDER FOR ANDY TO AUTOGEN THE BLUEPRINT
      const dynamicBlueprint = retrieveBlueprint(
        username,
        password,
        environmentId
      )
      // Safety check for the dynamic blueprint, else fall back to static blueprint
      if (isNotNil(dynamicBlueprint)) {
        blueprint = dynamicBlueprint
      }

      // CREATE WORKBOOK FROM BLUEPRINT
      const createWorkbook = await api.workbooks.create({
        spaceId: spaceId,
        environmentId: environmentId,
        labels: ['primary'],
        name: 'Worker + Org Import',
        sheets: blueprint,
        actions: [
          {
            operation: 'submitAction',
            mode: 'foreground',
            label: 'Submit',
            description: 'Send a webhook to the app',
            primary: true,
          },
          {
            operation: 'downloadExcelWorkbook',
            mode: 'foreground',
            label: 'Download Excel Workbook',
            description: 'Downloads Excel Workbook of Data',
            primary: true,
          },
        ],
      })

      const workbookId = createWorkbook.data?.id

      // ADD WORKBOOK TO SPACE, SET THEME, AND SAVE CREDS
      if (workbookId) {
        // Need to refresh until update to Spaces to poll for changes
        const updatedSpace = await api.spaces.update(spaceId, {
          environmentId: environmentId,
          primaryWorkbookId: workbookId,
          metadata: {
            creds: {
              username: username,
              password: password,
              tenantUrl: tenantUrl,
            },
            theme: {
              root: {
                primaryColor: '#005CB9',
                dangerColor: '#F44336',
                warningColor: '#FF9800',
              },
              sidebar: {
                logo: 'https://www.workday.com/content/dam/web/en-us/images/icons/general/workday-logo.svg',
                textColor: '#fff',
                titleColor: '#fff',
                focusBgColor: '#E5832D',
                focusTextColor: '#fff',
                backgroundColor: '#005CB9',
                footerTextColor: '#fff',
                textUltralightColor: '#F6C84F',
              },
              table: {
                inputs: {
                  radio: {
                    color: '#005CB9',
                  },
                  checkbox: {
                    color: '#005CB9',
                  },
                },
                filters: {
                  color: '#000',
                  active: {
                    color: '#fff',
                    backgroundColor: '#005CB9',
                  },
                  error: {
                    activeBackgroundColor: '#F44336',
                  },
                },
                column: {
                  header: {
                    fontSize: '14px',
                    backgroundColor: '#F0F1F2',
                    color: '#000',
                    dragHandle: {
                      idle: '#005CB9',
                      dragging: '#005CB9',
                    },
                  },
                },
                fontFamily: "'Proxima Nova', 'Helvetica', sans-serif",
                indexColumn: {
                  backgroundColor: '#F0F1F2',
                  selected: {
                    color: '#000',
                    backgroundColor: '#F0F1F2',
                  },
                },
                cell: {
                  selected: {
                    backgroundColor: '#F9DB75',
                  },
                  active: {
                    borderColor: '#E5832D',
                    spinnerColor: '#E5832D',
                  },
                },
                boolean: {
                  toggleChecked: '#005CB9',
                },
                loading: {
                  color: '#005CB9',
                },
              },
            },
          },
        })

        // CREATE AND INVITE GUESTS
        await createAndInviteGuests(updatedSpace, event)
      }

      // Acknowledging that the Space is now set up
      await api.jobs.complete(jobId, {
        info: 'This space is completed.',
      })
    })
    // Handle the 'job:failed' event
    configure.on('job:failed', async (event) => {
      console.log('Space Config Failed: ' + JSON.stringify(event))
    })

    configure.on('job:completed', async (event) => {
      // can enter stuff here if job compeleted
    })
  })

  // SEED THE WORKBOOK WITH DATA workbook:created
  listener.on('workbook:created', async (event) => {
    if (!event.context || !event.context.workbookId) {
      console.error('Event context or workbookId missing')
      return
    }

    const workbookId = event.context.workbookId
    let workbook
    try {
      workbook = await api.workbooks.get(workbookId)
    } catch (error) {
      console.error('Error getting workbook:', error.message)
      return
    }

    const workbookName =
      workbook.data && workbook.data.name ? workbook.data.name : ''
    const spaceId =
      workbook.data && workbook.data.spaceId ? workbook.data.spaceId : ''

    // console.log('Received workbook:created event')
    // console.log('Workbook ID:', workbookId)
    // console.log('Workbook Name:', workbookName)

    if (workbookName.includes('Worker + Org Import')) {
      // console.log('Workbook matches the expected name')

      const sheets =
        workbook.data && workbook.data.sheets ? workbook.data.sheets : []

      // COMPANIES
      const companiesSheet = sheets.find((s) =>
        s.config.slug.includes('companies')
      )
      if (companiesSheet && Array.isArray(companies)) {
        const companiesId = companiesSheet.id
        const request1 = companies.map(({ CompanyName, Reference_ID }) => ({
          name: { value: CompanyName },
          id: { value: Reference_ID },
        }))

        try {
          const insertCompanies = await api.records.insert(
            companiesId,
            request1
          )
        } catch (error) {
          console.error('Error inserting companies:', error.message)
        }
      }

      // COST CENTERS
      const ccSheet = sheets.find((s) => s.config.slug.includes('cost_centers'))
      if (ccSheet && Array.isArray(cost_centers)) {
        const ccId = ccSheet.id
        const request3 = cost_centers.map(
          ({ CostCenterName, CostCenterCode }) => ({
            name: { value: CostCenterName },
            id: { value: CostCenterCode },
          })
        )

        try {
          const insertCostCenters = await api.records.insert(ccId, request3)
        } catch (error) {
          console.error('Error inserting cost centers:', error.message)
        }
      }

      // Jobs
      const jobsSheet = sheets.find((s) => s.config.slug.includes('jobs'))
      if (jobsSheet && Array.isArray(jobs)) {
        const jobsId = jobsSheet.id
        const request4 = jobs.map(
          ({
            JobCode,
            JobTitle,
            Department,
            Classification,
            Pay_Rate_Type,
          }) => ({
            code: { value: JobCode },
            title: { value: JobTitle },
            department: { value: Department },
            classification: { value: Classification },
            pay_rate_type: { value: Pay_Rate_Type },
          })
        )

        try {
          const insertJobs = await api.records.insert(jobsId, request4)
        } catch (error) {
          console.error('Error inserting jobs:', error.message)
        }
      }

      //Locations

      const locationsSheet = workbook.data.sheets.find((s) =>
        s.config.slug.includes('locations')
      )

      if (locationsSheet) {
        // console.log('Locations sheet found')
        const locationsId = locationsSheet.id

        try {
          // console.log('Fetching location data...')
          const locationData = await authenticateAndFetchLocations(spaceId) // Fetch location data using the authenticateAndFetchLocations function
          // console.log('Location Data Prior to Preparing Request:', locationData)

          if (locationData) {
            // console.log('Location data fetched successfully')
            // console.log('Location Data:', locationData)

            const request = locationData.map(
              ({ locationName, locationID }) => ({
                name: { value: locationName },
                id: { value: locationID },
                // Include other fields if necessary
              })
            )

            // console.log('Request:', request) // Log the prepared request

            try {
              // console.log('Inserting location data...')
              const insertLocations = await api.records.insert(
                locationsId,
                request
              )
              // console.log('Location data inserted:', insertLocations)
            } catch (error) {
              console.error('Error inserting location data:', error.message)
              console.error('Error Details:', error)
            }
          } else {
            console.error('Error: Failed to fetch location data')
          }
        } catch (error) {
          console.error('Error fetching location data:', error.message)
        }
      } else {
        console.error('Error: Locations sheet not found')
      }
    } else {
      console.log('Workbook does not match the expected name')
    }
  })

  // VALIDATION & TRANSFORMATION RULES WITH DATA HOOKS

  // WORKERS

  listener.use(
    recordHook('workers', async (record, event) => {
      try {
        // Call the employeeValidations function which now includes assignBeerToRecord
        await employeeValidations(record)
      } catch (error) {
        // Handle errors that might occur within employeeValidations
        console.error('Error in employeeValidations:', error)
      } finally {
        // Clean up or perform any necessary actions after the try/catch block
      }

      return record
    })
  )

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

  // CREATE SUPERVISORY ORG STRUCTURE FROM WORKERS SHEET
  listener.filter({ job: 'sheet:buildSupOrgStructure' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId, workbookId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Building Supervisory Organization Structure...',
          progress: 10, // optional
        })

        // Instantiate the SupervisoryOrgStructureBuilder and call the buildSupervisoryOrgStructure method
        const orgStructureBuilder = new SupervisoryOrgStructureBuilder(
          workbookId,
          sheetId
        )
        await orgStructureBuilder.buildSupervisoryOrgStructure()

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

  // REFRESH LOCATIONS SHEET WITH DATA
  listener.filter({ job: 'sheet:refreshLocationsData' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId, workbookId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Refreshing Locations Data...',
          progress: 10, // optional
        })

        // Call the clearAndPopulateLocations function
        await clearAndPopulateLocations(event)

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

  // SUBMIT A WEBHOOK WITH THE WORKBOOK ID

  listener.filter({ job: 'workbook:submitAction' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, workbookId } = event.context

      //get all sheets
      const sheets = await api.sheets.list({ workbookId })

      const records = {}
      for (const [index, element] of sheets.data.entries()) {
        records[`Sheet[${index}]`] = await api.records.get(element.id)
      }

      try {
        await api.jobs.ack(jobId, {
          info: 'Starting job to submit action to webhook.site',
          progress: 10,
        })

        const webhookReceiver =
          process.env.WEBHOOK_SITE_URL ||
          'https://webhook.site/e8702d78-58c2-4f47-9b11-8ab39ff9da9e'

        const response = await axios.post(
          webhookReceiver,
          {
            ...event.payload,
            method: 'axios',
            sheets,
            records,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.status === 200) {
          await api.jobs.complete(jobId, {
            outcome: {
              message:
                'Data was successfully submitted to webhook.site. Go check it out!',
            },
          })
        } else {
          throw new Error('Failed to submit data to webhook.site')
        }
      } catch (error) {
        console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't find the webhook.site URL.",
          },
        })
      }
    })
  })

  //Download Data to Excel Workbook
  listener.filter({ job: 'workbook:downloadExcelWorkbook' }, (configure) => {
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
          info: 'Starting job to write to Excel file',
          progress: 10,
        })

        // Create new workbook
        const workbook = new ExcelJS.Workbook()
        console.log('New workbook created')

        // For each sheet, create a worksheet in the workbook and populate it with data
        for (const sheet in records) {
          // Limit sheet name to 31 characters
          const trimmedSheetName = sheet.substring(0, 31)

          const newWorksheet = workbook.addWorksheet(trimmedSheetName)
          const data = records[sheet].data.records

          if (data.length > 0) {
            // Add headers to the worksheet based on the keys of the `values` object in the first record
            const headers = Object.keys(data[0].values)
            newWorksheet.addRow(headers)
          }

          // For each row of data, write to a row in the Excel worksheet
          data.forEach((record, rowIndex) => {
            // Get the values object, which contains the actual cell data
            const cellData = record.values

            // Create a new row for the worksheet
            const newRow = []

            // Write each cell to the Excel file
            Object.entries(cellData).forEach(([column, value], cellIndex) => {
              newRow.push(value.value)
            })

            // Add the new row to the worksheet
            newWorksheet.addRow(newRow)
          })
        }
        console.log('Data written to workbook')

        // Get current date-time
        const dateTime = new Date().toISOString().replace(/[:.]/g, '-')

        // Write workbook to a file with date and time in its name
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
        console.log(`Error: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't write to the Excel file or upload it.",
          },
        })
      }
    })
  })

  // PARSE XLSX FILES
  listener.use(xlsxExtractorPlugin({ rawNumbers: true }))
}
