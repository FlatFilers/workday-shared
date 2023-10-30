import { RecordHook } from './utilsRecordHookNoCache/RecordHook'
import api from '@flatfile/api'
import { blueprint } from './blueprint/blueprint'
import { xlsxExtractorPlugin } from '@flatfile/plugin-xlsx-extractor'
import { DedupeRecords } from './actions/dedupe.records'
import { validateRecord } from './validationsDictionary/recordValidations/recordValidators'
import { validateReportingStructure } from './actions/validateReportingStructure'
import { SupervisoryOrgStructureBuilder } from './actions/buildSupervisoryOrgStructure'
require('dotenv').config()
import { clearAndPopulateLocations } from './actions/clearAndPopulateLocations'
import { createPage } from './workflow/welcome-page'
import { retrieveBlueprint } from './workflow/retrieve-blueprint'
import { isNil, isNotNil } from './validations/common/helpers'
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
import { validateBatch } from './validationsDictionary/datasetValidations/batchValidators'
import axios from 'axios'

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

      // Corrected path to the dcdd_blueprints folder
      const folderPath = path.join(__dirname, '..', 'dcdd_blueprints')

      // Read the contents of the folder
      const blueprintFiles = fs.readdirSync(folderPath)

      // Your two default actions
      const defaultActions = [
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
      ]

      // Dynamically generate blueprints based on files
      const blueprints = blueprintFiles.map((file) => {
        const blueprintContent = JSON.parse(
          fs.readFileSync(path.join(folderPath, file), 'utf8')
        )
        const nameWithoutExtension = path.basename(file, path.extname(file)) // e.g., "absence_blueprint"
        const workbookName =
          nameWithoutExtension.split('_')[0].charAt(0).toUpperCase() +
          nameWithoutExtension.split('_')[0].slice(1) // e.g., "Absence"

        return {
          name: workbookName,
          sheets: blueprintContent, // Assuming each file directly contains the blueprint structure
          actions: defaultActions,
        }
      })
      const workbookIds = []

      for (const blueprint of blueprints) {
        const createWorkbook = await api.workbooks.create({
          spaceId: spaceId,
          environmentId: environmentId,
          settings: {
            trackChanges: true,
          },
          //labels: ['primary'],
          ...blueprint,
        })
        workbookIds.push(createWorkbook.data?.id)
      }

      console.log(workbookIds) // This will give you all the workbook IDs created

      // ADD WORKBOOK TO SPACE, SET THEME, AND SAVE CREDS
      if (workbookIds) {
        // Need to refresh until update to Spaces to poll for changes
        const updatedSpace = await api.spaces.update(spaceId, {
          environmentId: environmentId,
          //primaryWorkbookId: workbookId,
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

  // // SEED THE WORKBOOK WITH DATA workbook:created
  listener.on('workbook:created', async (event) => {
    //   if (!event.context || !event.context.workbookId) {
    //     console.error('Event context or workbookId missing')
    //     return
    //   }
    //   const workbookId = event.context.workbookId
    //   let workbook
    //   try {
    //     workbook = await api.workbooks.get(workbookId)
    //   } catch (error) {
    //     console.error('Error getting workbook:', error.message)
    //     return
    //   }
    //   const workbookName =
    //     workbook.data && workbook.data.name ? workbook.data.name : ''
    //   const spaceId =
    //     workbook.data && workbook.data.spaceId ? workbook.data.spaceId : ''
    //   // console.log('Received workbook:created event')
    //   // console.log('Workbook ID:', workbookId)
    //   // console.log('Workbook Name:', workbookName)
    //   if (workbookName.includes('Worker + Org Import')) {
    //     // console.log('Workbook matches the expected name')
    //     const sheets =
    //       workbook.data && workbook.data.sheets ? workbook.data.sheets : []
    //     // COMPANIES
    //     const companiesSheet = workbook.data.sheets.find((s) =>
    //       s.config.slug.includes('companies')
    //     )
    //     if (companiesSheet) {
    //       console.log('Companies sheet found')
    //       const companiesId = companiesSheet.id
    //       try {
    //         console.log('Fetching company data...')
    //         const companyData = await authenticateAndFetchData(
    //           spaceId,
    //           companiesMetadata
    //         ) // Fetch company data using the authenticateAndFetchData function
    //         if (companyData) {
    //           console.log(
    //             `Fetched ${companyData.length} company records successfully`
    //           )
    //           const request = companyData.map(({ name, id }) => ({
    //             name: { value: name },
    //             id: { value: id },
    //             // Include other fields if necessary
    //           }))
    //           try {
    //             console.log('Inserting company data...')
    //             const insertCompanies = await api.records.insert(
    //               companiesId,
    //               request
    //             )
    //             console.log(
    //               `Inserted ${insertCompanies.length} company records successfully`
    //             )
    //           } catch (error) {
    //             console.error('Error inserting company data:', error.message)
    //           }
    //         } else {
    //           console.error('Error: Failed to fetch company data')
    //         }
    //       } catch (error) {
    //         console.error('Error fetching company data:', error.message)
    //       }
    //     } else {
    //       console.error('Error: Companies sheet not found')
    //     }
    //     // COST CENTERS
    //     const costCentersSheet = workbook.data.sheets.find((s) =>
    //       s.config.slug.includes('cost_centers')
    //     )
    //     if (costCentersSheet) {
    //       console.log('Cost Centers sheet found')
    //       const costCentersId = costCentersSheet.id
    //       try {
    //         console.log('Fetching cost center data...')
    //         const costCenterData = await authenticateAndFetchData(
    //           spaceId,
    //           costCentersMetadata
    //         ) // Fetch cost center data using the authenticateAndFetchData function
    //         if (costCenterData) {
    //           console.log(
    //             `Fetched ${costCenterData.length} cost center records successfully`
    //           )
    //           const request = costCenterData.map(({ name, id }) => ({
    //             name: { value: name },
    //             id: { value: id },
    //             // Include other fields if necessary
    //           }))
    //           try {
    //             console.log('Inserting cost center data...')
    //             const insertCostCenters = await api.records.insert(
    //               costCentersId,
    //               request
    //             )
    //             console.log(
    //               `Inserted ${insertCostCenters.length} cost center records successfully`
    //             )
    //           } catch (error) {
    //             console.error('Error inserting cost center data:', error.message)
    //           }
    //         } else {
    //           console.error('Error: Failed to fetch cost center data')
    //         }
    //       } catch (error) {
    //         console.error('Error fetching cost center data:', error.message)
    //       }
    //     } else {
    //       console.error('Error: Cost Centers sheet not found')
    //     }
    //     // JOB PROFILES
    //     const jobsSheet = workbook.data.sheets.find((s) =>
    //       s.config.slug.includes('jobs')
    //     )
    //     if (jobsSheet) {
    //       console.log('Jobs sheet found')
    //       const jobsId = jobsSheet.id
    //       try {
    //         console.log('Fetching job profile data...')
    //         const jobData = await authenticateAndFetchData(spaceId, jobsMetadata) // Fetch job profile data using the authenticateAndFetchData function
    //         if (jobData) {
    //           console.log(
    //             `Fetched ${jobData.length} job profile records successfully`
    //           )
    //           const request = jobData.map(
    //             ({ jobCode, jobTitle, jobClassification, jobPayRate }) => ({
    //               code: { value: jobCode },
    //               title: { value: jobTitle },
    //               classification: { value: jobClassification },
    //               pay_rate_type: { value: jobPayRate },
    //               // Include other fields if necessary
    //             })
    //           )
    //           try {
    //             console.log('Inserting job profile data...')
    //             const insertJobs = await api.records.insert(jobsId, request)
    //             console.log(
    //               `Inserted ${insertJobs.length} job profile records successfully`
    //             )
    //           } catch (error) {
    //             console.error('Error inserting job profile data:', error.message)
    //           }
    //         } else {
    //           console.error('Error: Failed to fetch job profile data')
    //         }
    //       } catch (error) {
    //         console.error('Error fetching job profile data:', error.message)
    //       }
    //     } else {
    //       console.error('Error: Jobs sheet not found')
    //     }
    //     //Locations
    //     const locationsSheet = workbook.data.sheets.find((s) =>
    //       s.config.slug.includes('locations')
    //     )
    //     if (locationsSheet) {
    //       console.log('Locations sheet found')
    //       const locationsId = locationsSheet.id
    //       try {
    //         // console.log('Fetching location data...')
    //         const locationData = await authenticateAndFetchData(
    //           spaceId,
    //           locationsMetadata
    //         ) // Fetch location data using the authenticateAndFetchLocations function
    //         console.log('Location Data Prior to Preparing Request:', locationData)
    //         if (locationData) {
    //           console.log('Location data fetched successfully')
    //           console.log('Location Data:', locationData)
    //           const request = locationData.map(({ name, id }) => ({
    //             name: { value: name },
    //             id: { value: id },
    //             // Include other fields if necessary
    //           }))
    //           console.log('Request:', request) // Log the prepared request
    //           try {
    //             // console.log('Inserting location data...')
    //             const insertLocations = await api.records.insert(
    //               locationsId,
    //               request
    //             )
    //             // console.log('Location data inserted:', insertLocations)
    //           } catch (error) {
    //             console.error('Error inserting location data:', error.message)
    //             console.error('Error Details:', error)
    //           }
    //         } else {
    //           console.error('Error: Failed to fetch location data')
    //         }
    //       } catch (error) {
    //         console.error('Error fetching location data:', error.message)
    //       }
    //     } else {
    //       console.error('Error: Locations sheet not found')
    //     }
    //   } else {
    //     console.log('Workbook does not match the expected name')
    //   }
  })

  // VALIDATION & TRANSFORMATION RULES WITH DATA HOOKS

  // Event listener for the 'commit:created' event

  listener.on('commit:created', async (event) => {
    try {
      // Log the initiation of the event
      console.log('commit:created event triggered')
      console.log('Logging Event Context for Colin: ', event.context)

      // Retrieve the sheetId and workbookId from the event context
      const { sheetId, workbookId } = event.context
      console.log(`Retrieved sheetId from event: ${sheetId}`)

      // Fetch the workbook details
      const workbook = await api.workbooks.get(workbookId)
      // Check if the workbook is file-based and decide whether to skip RecordHooks
      if (
        !workbook ||
        workbook.data.name.startsWith('[file]') ||
        workbook.data.labels.includes('file')
      ) {
        console.log('Skipping RecordHooks for file-based workbooks.')
        return
      }

      // Fetch the sheet details
      const sheet = await api.sheets.get(sheetId)
      if (!sheet) {
        console.log(`Failed to fetch sheet with id: ${sheetId}`)
        return
      }
      console.log(`Sheet with id: ${sheetId} fetched successfully.`)

      // Retrieve the fields configuration from the fetched sheet
      const fields = sheet.data.config?.fields
      if (!fields) {
        console.log('No fields were fetched.')
        return
      }
      console.log(`Successfully fetched ${fields.length} fields.`)

      // Call the RecordHook function to handle individual record validation
      await RecordHook(
        event,
        async (record, event) => {
          console.log(
            "Inside RecordHook's handler function for Event: ",
            event.src.id
          )
          try {
            await validateRecord(record, fields)
          } catch (error) {
            console.error('Error in validateRecord:', error)
          }
          console.log(
            "Exiting RecordHook's handler function for Event: ",
            event.src.id
          )
          return record
        },
        { stripMessages: false }
      )
      console.log('RecordHook for individual record validation completed.')
    } catch (error) {
      console.error('Error in commit:created event handler:', error)
    }
  })

  // listener.on('commit:completed', async (event) => {
  //   try {
  //     const { sheetId, workbookId } = event.context

  //     // Fetch all records associated with the sheet
  //     const allRecords = await api.records.get(sheetId)
  //     console.log(
  //       `Checking records for sheet: ${sheetId} on Event ID:`,
  //       event.src.id
  //     )

  //     // Determine which records have been processed
  //     const recordsArray = allRecords.data.records || []
  //     const processedRecords = recordsArray.filter(
  //       (record) => record.metadata && record.metadata.processed
  //     )
  //     const allProcessed = processedRecords.length === recordsArray.length
  //     console.log(
  //       `${processedRecords.length} out of ${recordsArray.length} records have been processed.`
  //     )

  //     // If all records are processed, initiate batch validation
  //     if (allProcessed) {
  //       console.log(
  //         'All records have been processed. Starting the next set of validations.'
  //       )

  //       const recordsForValidation = allRecords.data.records
  //       if (recordsForValidation && recordsForValidation.length > 0) {
  //         // Determine the primary key for the records
  //         const primaryKeyField = Object.keys(
  //           recordsForValidation[0]?.values || {}
  //         )[0]
  //         console.log('Determined primary key field:', primaryKeyField)
  //         console.log('Calling RecordHook for Batch Validations')

  //         // Call the RecordHook function to handle batch validation
  //         await RecordHook(
  //           event,
  //           async (record, event) => {
  //             console.log(
  //               "Inside RecordHook's handler function for Batch Validations for Event: ",
  //               event.src.id
  //             )
  //             try {
  //               await validateRecord(record, fields)
  //               await validateBatch(
  //                 record,
  //                 fields,
  //                 primaryKeyField,
  //                 recordsForValidation
  //               )
  //             } catch (error) {
  //               console.error('Error in batch validations:', error)
  //             }
  //             console.log(
  //               "Exiting RecordHook's handler function for Batch Validations For Event: ",
  //               event.src.id
  //             )
  //             return record
  //           },
  //           { stripMessages: false }
  //         )

  //         // Optionally trigger sheet validations
  //         try {
  //           if (
  //             event.context.actorId &&
  //             event.context.actorId.includes('_usr_' || '_jb_')
  //           ) {
  //             const validateSheet = await api.sheets.validate(sheetId)
  //             console.log(
  //               'Sheet validation triggered:',
  //               validateSheet,
  //               'from event: ',
  //               event.src.id
  //             )
  //           }
  //         } catch (error) {
  //           console.error('Error triggering sheet validation:', error)
  //         }
  //       } else {
  //         console.error('No records available for validation.')
  //       }
  //     } else {
  //       console.log(
  //         'Not all records have been processed. Skipping the next set of validations.'
  //       )
  //     }
  //   } catch (error) {
  //     console.error('Error in commit:completed event handler:', error)
  //   }
  // })

  // listener.on('commit:created', async (event) => {
  //   try {
  //     // Log the initiation of the event
  //     console.log('commit:created event triggered')
  //     console.log('Logging Event Context for Colin: ', event.context)

  //     // Retrieve the sheetId and workbookId from the event context
  //     const sheetId = event.context.sheetId
  //     const workbookId = event.context.workbookId

  //     console.log(`Retrieved sheetId from event: ${sheetId}`)

  //     // Fetch the workbook details
  //     const workbook = await api.workbooks.get(workbookId)
  //     // Check if the workbook is file-based and decide whether to skip RecordHooks
  //     if (
  //       !workbook ||
  //       workbook.data.name.startsWith('[file]') ||
  //       workbook.data.labels.includes('file')
  //     ) {
  //       console.log('Skipping RecordHooks for file-based workbooks.')
  //       return
  //     }

  //     // Fetch the sheet details
  //     const sheet = await api.sheets.get(sheetId)
  //     // Handle the situation where the sheet fetching failed
  //     if (!sheet) {
  //       console.log(`Failed to fetch sheet with id: ${sheetId}`)
  //       return
  //     }
  //     console.log(`Sheet with id: ${sheetId} fetched successfully.`)

  //     // Retrieve the fields configuration from the fetched sheet
  //     const fields = sheet.data.config?.fields
  //     if (!fields) {
  //       console.log('No fields were fetched.')
  //       return
  //     }
  //     console.log(`Successfully fetched ${fields.length} fields.`)

  //     // Call the RecordHook function to handle individual record validation
  //     await RecordHook(
  //       event,
  //       async (record, event) => {
  //         console.log(
  //           "Inside RecordHook's handler function for Event: ",
  //           event.src.id
  //         )
  //         try {
  //           await validateRecord(record, fields)
  //         } catch (error) {
  //           console.error('Error in validateRecord:', error)
  //         }
  //         console.log(
  //           "Exiting RecordHook's handler function for Event: ",
  //           event.src.id
  //         )
  //         return record
  //       },
  //       { stripMessages: false }
  //     )

  //     // Fetch all records associated with the sheet
  //     const allRecords = await api.records.get(sheetId)

  //     console.log(
  //       `Checking records for sheet: ${
  //         sheet.data.name || 'Unknown Sheet'
  //       } on Event ID:`,
  //       event.src.id
  //     )

  //     // Determine which records have been processed
  //     const recordsArray = allRecords.data.records || []
  //     const processedRecords = recordsArray.filter(
  //       (record) => record.metadata && record.metadata.processed
  //     )
  //     const allProcessed = processedRecords.length === recordsArray.length
  //     console.log(
  //       `${processedRecords.length} out of ${recordsArray.length} records have been processed.`
  //     )

  //     // If all records are processed, initiate batch validation
  //     if (allProcessed) {
  //       console.log(
  //         'All records have been processed. Starting the next set of validations.'
  //       )

  //       const recordsForValidation = allRecords.data.records

  //       if (recordsForValidation && recordsForValidation.length > 0) {
  //         // Determine the primary key for the records
  //         const primaryKeyField = Object.keys(
  //           recordsForValidation[0]?.values || {}
  //         )[0]
  //         console.log('Determined primary key field:', primaryKeyField)
  //         console.log('Calling RecordHook for Batch Validations')

  //         // Call the RecordHook function to handle batch validation
  //         await RecordHook(
  //           event,
  //           async (record, event) => {
  //             try {
  //               await validateRecord(record, fields)
  //             } catch (error) {
  //               console.error('Error in validateRecord:', error)
  //             }
  //             console.log(
  //               "Exiting RecordHook's handler function for Event: ",
  //               event.src.id
  //             )

  //             console.log(
  //               "Inside RecordHook's handler function for Batch Validations for Event: ",
  //               event.src.id
  //             )
  //             try {
  //               await validateBatch(
  //                 record,
  //                 fields,
  //                 primaryKeyField,
  //                 recordsForValidation
  //               )
  //             } catch (error) {
  //               console.error('Error in validateBatch:', error)
  //             }
  //             console.log(
  //               "Exiting RecordHook's handler function for Batch Validations For Event: ",
  //               event.src.id
  //             )
  //             return record
  //           },
  //           { stripMessages: false }
  //         )

  //         // Optionally trigger sheet validations
  //         try {
  //           if (
  //             event.context.actorId &&
  //             event.context.actorId.includes('_usr_' || '_jb_')
  //           ) {
  //             const validateSheet = await api.sheets.validate(sheetId)
  //             console.log(
  //               'Sheet validation triggered:',
  //               validateSheet,
  //               'from event: ',
  //               event.src.id
  //             )
  //           }
  //         } catch (error) {
  //           console.error('Error triggering sheet validation:', error)
  //         }
  //       } else {
  //         console.error('No records available for validation.')
  //       }
  //     } else {
  //       console.log(
  //         'Not all records have been processed. Skipping the next set of validations.'
  //       )
  //     }
  //   } catch (error) {
  //     console.error('Error in commit:created event handler:', error)
  //   }
  // })

  // // RUN ACTIONS TRIGGERED BY USERS

  // // DEDUPE FROM WORKERS SHEET
  // listener.filter({ job: 'sheet:dedupeWorkers' }, (configure) => {
  //   configure.on('job:ready', async (event) => {
  //     const { jobId, sheetId } = event.context

  //     try {
  //       await api.jobs.ack(jobId, {
  //         info: 'Deduplicating Workers...',
  //         progress: 10, //optional
  //       })

  //       // Call the dedupeEmployees function with the records
  //       await new DedupeRecords(sheetId, 'Applicant_ID').dedupeRecords()

  //       await api.jobs.complete(jobId, {
  //         info: 'This job is now complete.',
  //       })
  //     } catch (error) {
  //       console.log(`Error: ${JSON.stringify(error, null, 2)}`)

  //       await api.jobs.fail(jobId, {
  //         info: 'This job did not work.',
  //       })
  //     }
  //   })
  // })

  // // VALIDATE REPORTING STRUCTURE FROM WORKERS SHEET
  // listener.filter({ job: 'sheet:validateReportingStructure' }, (configure) => {
  //   configure.on('job:ready', async (event) => {
  //     const { jobId, sheetId } = event.context

  //     try {
  //       await api.jobs.ack(jobId, {
  //         info: 'Validating Reporting Structure...',
  //         progress: 10, //optional
  //       })

  //       // Call the 'get' method of api.records with the sheetId
  //       const response = await api.records.get(sheetId)

  //       // Check if the response is valid and contains records
  //       if (response?.data?.records) {
  //         // Get the records from the response data
  //         const records = response.data.records

  //         // Call the validateReportingStructure function with the records
  //         const reportingErrors = validateReportingStructure(records)

  //         // Update the records if there are any reporting errors
  //         if (reportingErrors.length > 0) {
  //           await api.records.update(sheetId, reportingErrors)
  //           console.log('Records updated successfully.')
  //           // For example, you can send them as a notification or store them in a database
  //         } else {
  //           console.log('No records found for updating.')
  //         }
  //       } else {
  //         console.log('No records found in the response.')
  //       }

  //       await api.jobs.complete(jobId, {
  //         info: 'This job is now complete.',
  //       })
  //     } catch (error) {
  //       console.log(`Error: ${JSON.stringify(error, null, 2)}`)

  //       await api.jobs.fail(jobId, {
  //         info: 'This job did not work.',
  //       })
  //     }
  //   })
  // })

  // // CREATE SUPERVISORY ORG STRUCTURE FROM WORKERS SHEET
  // listener.filter({ job: 'sheet:buildSupOrgStructure' }, (configure) => {
  //   configure.on('job:ready', async (event) => {
  //     const { jobId, sheetId, workbookId } = event.context

  //     try {
  //       await api.jobs.ack(jobId, {
  //         info: 'Building Supervisory Organization Structure...',
  //         progress: 10, // optional
  //       })

  //       // Instantiate the SupervisoryOrgStructureBuilder and call the buildSupervisoryOrgStructure method
  //       const orgStructureBuilder = new SupervisoryOrgStructureBuilder(
  //         workbookId,
  //         sheetId
  //       )
  //       await orgStructureBuilder.buildSupervisoryOrgStructure()

  //       await api.jobs.complete(jobId, {
  //         info: 'This job is now complete.',
  //       })
  //     } catch (error) {
  //       console.error('Error:', error)

  //       await api.jobs.fail(jobId, {
  //         info: 'This job did not work.',
  //       })
  //     }
  //   })
  // })

  // // REFRESH LOCATIONS SHEET WITH DATA
  // listener.filter({ job: 'sheet:refreshLocationsData' }, (configure) => {
  //   configure.on('job:ready', async (event) => {
  //     const { jobId, sheetId, workbookId } = event.context

  //     try {
  //       await api.jobs.ack(jobId, {
  //         info: 'Refreshing Locations Data...',
  //         progress: 10, // optional
  //       })

  //       // Call the clearAndPopulateLocations function
  //       await clearAndPopulateLocations(event)

  //       await api.jobs.complete(jobId, {
  //         info: 'This job is now complete.',
  //       })
  //     } catch (error) {
  //       console.error('Error:', error)

  //       await api.jobs.fail(jobId, {
  //         info: 'This job did not work.',
  //       })
  //     }
  //   })
  // })

  // // TRIMMING ALL
  // // listener.on("commit:created", async (event) => {
  // // event.context.sheet.records.value
  // // for each value in each record
  // // run .trim()
  // // })

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
          // Limit sheet name to 31 characters
          const trimmedSheetName = sheet.substring(0, 31)

          const newWorksheet = workbook.addWorksheet(trimmedSheetName)
          const data = records[sheet].data.records

          if (data.length > 0) {
            // Add headers based on the keys of the `values` object in the first record
            const headers = Object.keys(data[0].values)
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

  //Download Data to Zipped CSV
  listener.use(csvZip)
  // PARSE XLSX FILES
  listener.use(xlsxExtractorPlugin({ rawNumbers: true }))
  //PARSE PIPE-DELIMITED TXT FILES
  listener.use(DelimiterExtractor('.txt', { delimiter: '|' }))
}
