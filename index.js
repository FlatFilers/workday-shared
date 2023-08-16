import { RecordHook } from '@flatfile/plugin-record-hook'
import api from '@flatfile/api'
import { blueprint } from './blueprint/blueprint'
import { ExcelExtractor } from '@flatfile/plugin-xlsx-extractor'
import { DedupeRecords } from './actions/dedupe.records'
import { validateRecord } from './validationsDictionary/recordValidators'
import { validateReportingStructure } from './actions/validateReportingStructure'
import { SupervisoryOrgStructureBuilder } from './actions/buildSupervisoryOrgStructure'
import axios from 'axios'
require('dotenv').config()
import { clearAndPopulateLocations } from './actions/clearAndPopulateLocations'
import { createPage } from './workflow/welcome-page'
import { retrieveBlueprint } from './workflow/retrieve-blueprint'
import { isNil, isNotNil } from './validations/common/helpers'
import { createAndInviteGuests } from './guests/createAndInviteGuests'
import { jobs } from './reference_data/jobs'
import csvZip from './actions/csvZip'
import { locationsMetadata } from './soapRequest/soapMetadata'
import { authenticateAndFetchData } from './soapRequest/authenticateAndFetchData'
import { costCentersMetadata } from './soapRequest/soapMetadata'
import { companiesMetadata } from './soapRequest/soapMetadata'
import { jobsMetadata } from './soapRequest/soapMetadata'

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
            operation: 'downloadCSV',
            mode: 'foreground',
            label: 'Download ZIP File of Workbook Data',
            description: 'Downloads ZIP File of Workbook Data',
            primary: false,
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
      const companiesSheet = workbook.data.sheets.find((s) =>
        s.config.slug.includes('companies')
      )

      if (companiesSheet) {
        console.log('Companies sheet found')
        const companiesId = companiesSheet.id

        try {
          console.log('Fetching company data...')
          const companyData = await authenticateAndFetchData(
            spaceId,
            companiesMetadata
          ) // Fetch company data using the authenticateAndFetchData function

          if (companyData) {
            console.log(
              `Fetched ${companyData.length} company records successfully`
            )

            const request = companyData.map(({ name, id }) => ({
              name: { value: name },
              id: { value: id },
              // Include other fields if necessary
            }))

            try {
              console.log('Inserting company data...')
              const insertCompanies = await api.records.insert(
                companiesId,
                request
              )
              console.log(
                `Inserted ${insertCompanies.length} company records successfully`
              )
            } catch (error) {
              console.error('Error inserting company data:', error.message)
            }
          } else {
            console.error('Error: Failed to fetch company data')
          }
        } catch (error) {
          console.error('Error fetching company data:', error.message)
        }
      } else {
        console.error('Error: Companies sheet not found')
      }

      // COST CENTERS
      const costCentersSheet = workbook.data.sheets.find((s) =>
        s.config.slug.includes('cost_centers')
      )

      if (costCentersSheet) {
        console.log('Cost Centers sheet found')
        const costCentersId = costCentersSheet.id

        try {
          console.log('Fetching cost center data...')
          const costCenterData = await authenticateAndFetchData(
            spaceId,
            costCentersMetadata
          ) // Fetch cost center data using the authenticateAndFetchData function

          if (costCenterData) {
            console.log(
              `Fetched ${costCenterData.length} cost center records successfully`
            )

            const request = costCenterData.map(({ name, id }) => ({
              name: { value: name },
              id: { value: id },
              // Include other fields if necessary
            }))

            try {
              console.log('Inserting cost center data...')
              const insertCostCenters = await api.records.insert(
                costCentersId,
                request
              )
              console.log(
                `Inserted ${insertCostCenters.length} cost center records successfully`
              )
            } catch (error) {
              console.error('Error inserting cost center data:', error.message)
            }
          } else {
            console.error('Error: Failed to fetch cost center data')
          }
        } catch (error) {
          console.error('Error fetching cost center data:', error.message)
        }
      } else {
        console.error('Error: Cost Centers sheet not found')
      }

      // JOB PROFILES
      const jobsSheet = workbook.data.sheets.find((s) =>
        s.config.slug.includes('jobs')
      )

      if (jobsSheet) {
        console.log('Jobs sheet found')
        const jobsId = jobsSheet.id

        try {
          console.log('Fetching job profile data...')
          const jobData = await authenticateAndFetchData(spaceId, jobsMetadata) // Fetch job profile data using the authenticateAndFetchData function

          if (jobData) {
            console.log(
              `Fetched ${jobData.length} job profile records successfully`
            )

            const request = jobData.map(
              ({ jobCode, jobTitle, jobClassification, jobPayRate }) => ({
                code: { value: jobCode },
                title: { value: jobTitle },
                classification: { value: jobClassification },
                pay_rate_type: { value: jobPayRate },
                // Include other fields if necessary
              })
            )

            try {
              console.log('Inserting job profile data...')
              const insertJobs = await api.records.insert(jobsId, request)
              console.log(
                `Inserted ${insertJobs.length} job profile records successfully`
              )
            } catch (error) {
              console.error('Error inserting job profile data:', error.message)
            }
          } else {
            console.error('Error: Failed to fetch job profile data')
          }
        } catch (error) {
          console.error('Error fetching job profile data:', error.message)
        }
      } else {
        console.error('Error: Jobs sheet not found')
      }

          //Locations

          const locationsSheet = workbook.data.sheets.find((s) =>
            s.config.slug.includes('locations')
          )

          if (locationsSheet) {
            console.log('Locations sheet found')
            const locationsId = locationsSheet.id

            try {
              // console.log('Fetching location data...')
              const locationData = await authenticateAndFetchData(
                spaceId,
                locationsMetadata
              ) // Fetch location data using the authenticateAndFetchLocations function
              console.log('Location Data Prior to Preparing Request:', locationData)

              if (locationData) {
                console.log('Location data fetched successfully')
                console.log('Location Data:', locationData)

                const request = locationData.map(({ name, id }) => ({
                  name: { value: name },
                  id: { value: id },
                  // Include other fields if necessary
                }))

                console.log('Request:', request) // Log the prepared request

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
  listener.use(csvZip)
  // PARSE XLSX FILES
  listener.on('file:created', async (event) => {
    return new ExcelExtractor(event).runExtraction()
  })
}
