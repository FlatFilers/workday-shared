// Import necessary modules
import { validateReportingStructure } from '../actions/validateReportingStructure'
import api, { Flatfile } from '@flatfile/api'

// Define a class for building the supervisory organizational structure
export class SupervisoryOrgStructureBuilder {
  private readonly workbookId: string
  private readonly sheetId: string
  private readonly managerMap: Map<string, string> = new Map()
  private readonly orderedManagerIds: string[] = []

  constructor(workbookId: string, sheetId: string) {
    if (!workbookId || !sheetId) {
      throw new Error('Invalid workbookId or sheetId')
    }
    this.workbookId = workbookId
    this.sheetId = sheetId
  }

  public async buildSupervisoryOrgStructure() {
    try {
      // Retrieve the necessary data and perform the steps
      const allRecords = await this.getAllRecords()

      console.log('Number of records retrieved:', allRecords.length)

      const reportingErrors = validateReportingStructure(allRecords, true)

      console.log('Number of reporting errors:', reportingErrors.length)

      if (reportingErrors.length > 0) {
        const errorMessage = `Reporting structure is invalid with ${reportingErrors.length} error(s). Please run the "Validate Supervisory Org Structure" action to address these issues.`
        throw new Error(errorMessage)
      }

      // Step 1: Validate the reporting structure
      this.extractManagerIds(allRecords)
      this.orderReportingStructure()

      // Step 2: Extract managerIds and order the reporting structure
      const recordMap = this.createRecordMap(allRecords)
      const newSheetData = this.orderedManagerIds.map((employeeId) => {
        const record = recordMap.get(employeeId)

        console.log('orderedManagerIds:', this.orderedManagerIds)

        return {
          managerId: record.values.Organization_Reference_ID.value,
          manager_name: record.values.Legal_Full_Name.value,
          location: record.values.Location_Reference_ID.value,
          // Include other relevant fields as needed
        }
      })

      // Step 3: Create the new sheet data with ordered managerIds
      await this.insertDataToExistingSheet(allRecords, newSheetData)

      // Step 4: Insert the ordered data into the existing sheet
    } catch (error) {
      console.error(
        'An error occurred while building the supervisory organizational structure:',
        error
      )
      throw error // Rethrow the error to the caller
    }
  }

  // Retrieve all records from the specified sheet
  private async getAllRecords(): Promise<Flatfile.RecordWithLinks[]> {
    try {
      const recordsResponse = await api.records.get(this.sheetId, {
        includeCounts: true,
      })

      // Handle pagination if needed and return all records
      return recordsResponse?.data?.records ?? []
    } catch (error) {
      console.error('An error occurred while retrieving records:', error)
      throw error // Rethrow the error to the caller
    }
  }

  // Extract managerIds from records and store them in a map
  private extractManagerIds(records: Flatfile.RecordWithLinks[]) {
    try {
      for (const record of records) {
        const employeeId = String(record.values.Applicant_ID.value) // Convert to string
        const managerId = String(record.values.Organization_Reference_ID.value) // Convert to string

        console.log('Extracting employeeId:', employeeId)
        console.log('Extracting managerId:', managerId)

        this.managerMap.set(employeeId, managerId)
      }
    } catch (error) {
      console.error('An error occurred while extracting manager IDs:', error)
      throw error // Rethrow the error to the caller
    }
  }

  // Create a map of records with employeeId as the key
  private createRecordMap(records: Flatfile.RecordWithLinks[]) {
    try {
      const recordMap = new Map<string, Flatfile.RecordWithLinks>()
      for (const record of records) {
        const employeeId = String(record.values.Applicant_ID.value) // Convert to string
        recordMap.set(employeeId, record)
      }
      return recordMap
    } catch (error) {
      console.error('An error occurred while creating the record map:', error)
      throw error // Rethrow the error to the caller
    }
  }

  // Order the reporting structure based on manager hierarchy levels
  private orderReportingStructure() {
    try {
      const visited: Set<string> = new Set()
      const stack: { employeeId: string; level: number }[] = []

      for (const employeeId of this.managerMap.keys()) {
        if (!visited.has(employeeId)) {
          // Push the record with blank superior manager to the stack with level 0
          if (!this.managerMap.get(employeeId)) {
            stack.push({ employeeId, level: 0 })
          } else {
            stack.push({ employeeId, level: -1 }) // Push other records with a negative level initially
          }

          while (stack.length > 0) {
            const { employeeId, level } = stack.pop()!
            const managerId = this.managerMap.get(employeeId)

            if (managerId && !visited.has(managerId)) {
              // Increment the level if the managerId is not blank
              const nextLevel = managerId ? level + 1 : level

              // Push the record with its corresponding level
              stack.push({ employeeId: managerId, level: nextLevel })
            }

            visited.add(employeeId)
          }
        }
      }

      // Sort the visited managerIds based on their levels in ascending order
      this.orderedManagerIds.push(
        ...Array.from(visited).sort((a, b) => {
          const levelA = this.managerMap.has(a) ? -1 : 0 // Records with blank superior manager should be at the top
          const levelB = this.managerMap.has(b) ? -1 : 0
          return levelA - levelB
        })
      )
    } catch (error) {
      console.error(
        'An error occurred while ordering the reporting structure:',
        error
      )
      throw error // Rethrow the error to the caller
    }
  }

  // Insert data into the existing sheet
  private async insertDataToExistingSheet(
    records: Flatfile.RecordWithLinks[],
    data: any[]
  ) {
    try {
      const sheetSlug = 'orgs' // Slug of the existing sheet "Supervisory Orgs"

      // Retrieve the workbook by its ID
      const workbook = await api.workbooks.get(this.workbookId)

      // Find the sheet with the specified slug in the workbook's sheets array
      const sheet = workbook?.data?.sheets?.find(
        (s) => s.config?.slug === sheetSlug
      )

      if (!sheet) {
        throw new Error(`Sheet with slug "${sheetSlug}" not found.`)
      }

      // Prepare the data records to be inserted
      const recordsToInsert = data.map((record) => ({
        code: { value: `Sup_Org_${record.managerId}` },
        manager_name: { value: record.manager_name },
        manager_id: { value: record.managerId }, // Wrap managerId in an object
        manager_position: { value: `P-${record.managerId}` },
        superior_code: {
          value: `Sup_Org_${this.managerMap.get(String(record.managerId))}`,
        },
        location: { value: record.location },
        // Include other relevant fields as needed
      }))

      console.log('recordsToInsert length:', recordsToInsert.length)
      console.log('recordsToInsert:', recordsToInsert)

      // Sort the records based on the hierarchy structure
      const sortedRecords = this.orderedManagerIds.map((employeeId) =>
        recordsToInsert.find(
          (record) => String(record.manager_id.value) === String(employeeId)
        )
      )

      console.log('sortedRecords length:', sortedRecords.length)
      console.log('sortedRecords:', sortedRecords)

      this.orderedManagerIds.forEach((employeeId) => {
        const matchingRecord = recordsToInsert.find(
          (record) => record.manager_id.value === employeeId
        )
        if (!matchingRecord) {
          console.log('No matching record found for employeeId:', employeeId)
        }
      })

      // Filter out undefined values
      const finalRecords = sortedRecords.filter(
        (record) => record !== undefined
      )

      // Leave the superior_code field blank if manager_id is equal to superior_code
      finalRecords.forEach((record) => {
        if (record.manager_id.value === record.superior_code.value) {
          record.superior_code.value = '' // Update the value property of superior_code
        } else {
          const correspondingRecord = finalRecords.find(
            (r) => r.manager_id.value === record.superior_code.value
          )
          if (correspondingRecord) {
            record.superior_code.value = correspondingRecord.code.value
          }
        }
      })

      console.log('finalRecords length:', finalRecords.length)
      console.log('finalRecords:', finalRecords)

      await api.records.insert(sheet.id, finalRecords) // Insert the data into the existing sheet
    } catch (error) {
      console.error(
        'An error occurred while inserting data into the existing sheet:',
        error
      )
      throw error // Rethrow the error to the caller
    }
  }
}
