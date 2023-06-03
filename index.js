import { recordHook } from '@flatfile/plugin-record-hook'
import api from '@flatfile/api'
import { blueprint } from './blueprint/blueprint'
import { ExcelExtractor } from '@flatfile/plugin-xlsx-extractor'
import { DedupeRecords } from './actions/dedupe.records'
import { employeeValidations } from './validations/employeeValidations'
const { authenticateAndFetchLocations } = require('./reference_data/locations')
import { validateReportingStructure } from './actions/validateReportingStructure'
import { SupervisoryOrgStructureBuilder } from './actions/buildSupervisoryOrgStructure'
import axios from 'axios'

export default function (listener) {
  // logging all events in the environment
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

      // Acknowledge the job with progress and info using api.jobs.ack
      const updateJob = await api.jobs.ack(jobId, {
        info: 'Creating Space',
        progress: 10,
      })

      // ADD CUSTOM MARKDOWN PAGE TO SPACE
      const createDoc = await api.documents.create(spaceId, {
        title: 'Getting Started',
        body:
          '# Welcome\n' +
          '### Say hello to your first customer Space in the new Flatfile!\n' +
          "We've customized the colors in this Space to fit your brand; however, we can very easily change these for you if you need a different aesthetic or desire a co-branded experience for your customers.\n" +
          "Let's begin by first getting acquainted with what you're seeing in your Space initially.\n" +
          '---\n',
      })

      // CREATE WORKBOOK FROM BLUEPRINT
      const createWorkbook = await api.workbooks.create({
        spaceId: spaceId,
        environmentId: environmentId,
        labels: ['primary'],
        name: 'Worker + Org Import',
        sheets: blueprint,
        // Workbook-level action. We will set this up when we integrate later
        // actions: [
        //   {
        //     operation: 'submit',
        //     slug: 'submit',
        //     mode: 'foreground',
        //     label: 'Submit',
        //     type: 'string',
        //     description: 'Send a webhook to the app',
        //     primary: true,
        //   },
        // ],
      })

      const workbookId = createWorkbook.data?.id

      // ADD WORKBOOK TO SPACE AND SET THEME
      if (workbookId) {
        // Need to refresh until update to Spaces to poll for changes
        const updatedSpace = await api.spaces.update(spaceId, {
          environmentId: environmentId,
          primaryWorkbookId: workbookId,
          metadata: {
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
      }

      // Acknowledging that the Space is now set up
      const updateJob3 = await api.jobs.complete(jobId, {
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
    const workbookId = event.context.workbookId
    const workbook = await api.workbooks.get(workbookId)
    const workbookName = workbook.data.name

    console.log('Received workbook:created event')
    console.log('Workbook ID:', workbookId)
    console.log('Workbook Name:', workbookName)

    if (workbookName.includes('Worker + Org Import')) {
      console.log('Workbook matches the expected name')

      const locationsSheet = workbook.data.sheets.find((s) =>
        s.config.slug.includes('locations')
      )

      if (locationsSheet) {
        console.log('Locations sheet found')
        const locationsId = locationsSheet.id

        try {
          console.log('Fetching location data...')
          const locationData = await authenticateAndFetchLocations() // Fetch location data using the authenticateAndFetchLocations function
          console.log('Location Data Prior to Preparing Request:', locationData)

          if (locationData) {
            console.log('Location data fetched successfully')
            console.log('Location Data:', locationData)

            const request = locationData.map(
              ({ locationName, locationID }) => ({
                name: { value: locationName },
                id: { value: locationID },
                // Include other fields if necessary
              })
            )

            console.log('Request:', request) // Log the prepared request

            try {
              console.log('Inserting location data...')
              const insertLocations = await api.records.insert(
                locationsId,
                request
              )
              console.log('Location data inserted:', insertLocations)
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
    // When a record is processed, invoke the 'employeeValidations' function to validate the record
    recordHook('workers', (record) => {
      const results = employeeValidations(record)
      // Log the results of the validations to the console as a JSON string
      console.log('Employees Hooks: ' + JSON.stringify(results))
      // Return the record
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
          info: 'Deduplicating Workers...',
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

  // TRIMMING ALL
  // listener.on("commit:created", async (event) => {
  // event.context.sheet.records.value
  // for each value in each record
  // run .trim()
  // })

  // SUBMIT A WEBHOOK WITH THE WORKBOOK ID
  // note that this will need to be updated when we switch to workbook-level action
  listener.filter({ job: 'sheet:submit' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { sheetId, jobId } = event.context
      try {
        await api.jobs.ack(jobId, {
          info: 'Starting job to submit action to webhook.site',
          progress: 10,
        })

        const url = 'https://webhook.site/a25c6e8d-91c7-4e9e-b111-32b8d1ba1fa9'
        const payload = JSON.stringify(sheetId, null, 2)
        const payload2 = api.records.get(sheetId)

        axios.post(
          url,
          { data: payload2 },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )

        await api.jobs.complete(jobId, {
          outcome: {
            message:
              'Data was successfully submitted to webhook.site. Go check it out!',
          },
        })
      } catch (error) {
        console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`)

        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't find the webhook.site url.",
          },
        })
      }
    })
  })

  // BUILD SUP ORG
  listener.filter({ job: 'sheet:buildOrg' }, (configure) => {
    configure.on('job:ready', async (event) => {
      const { jobId, sheetId } = event.context

      try {
        await api.jobs.ack(jobId, {
          info: 'Gettin started.',
          progress: 10, //optional
        })

        //do your work here

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

  // PARSE XLSX FILES
  listener.on('file:created', async (event) => {
    return new ExcelExtractor(event).runExtraction()
  })
}
