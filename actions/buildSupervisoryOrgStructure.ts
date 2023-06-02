import { validateReportingStructure } from '../actions/validateReportingStructure'
import api, { Flatfile } from '@flatfile/api'

export class SupervisoryOrgStructureBuilder {
  private readonly workbookId: string
  private readonly sheetId: string
  private readonly managerMap: Map<string, string> = new Map()
  private readonly orderedManagerIds: string[] = []

  constructor(workbookId: string, sheetId: string) {
    this.workbookId = workbookId
    this.sheetId = sheetId
  }

  public async buildSupervisoryOrgStructure() {
    // Retrieve the necessary data and perform the steps
    const allRecords = await this.getAllRecords()
    const reportingErrors = validateReportingStructure(allRecords)

    if (reportingErrors.length > 0) {
      console.error('Reporting structure is invalid:', reportingErrors)
      return // Stop the process if reporting structure is invalid
    }

    // Step 1: Validate the reporting structure

    this.extractManagerIds(allRecords)
    this.orderReportingStructure()

    // Step 2: Extract managerIds and order the reporting structure

    const newSheetData = this.orderedManagerIds.map((employeeId) => {
      const record = allRecords.find(
        (r) => r.values.Applicant_ID.value === employeeId
      )
      console.log('Processing record:', record)

      return {
        managerId: record.values.Organization_Reference_ID.value,
        manager_name: record.values.Legal_Full_Name.value,
        location: record.values.Location_Reference_ID.value,
        // Include other relevant fields as needed
      }
    })

    // Step 3: Create the new sheet data with ordered managerIds

    await this.insertDataToExistingSheet(newSheetData)

    // Step 4: Insert the ordered data into the existing sheet
  }

  private async getAllRecords(): Promise<Flatfile.RecordWithLinks[]> {
    const recordsResponse = await api.records.get(this.sheetId, {
      includeCounts: true,
    })

    // Handle pagination if needed and return all records

    return recordsResponse?.data?.records ?? []
  }

  private extractManagerIds(records: Flatfile.RecordWithLinks[]) {
    for (const record of records) {
      const employeeId = String(record.values.Applicant_ID.value) // Convert to string
      const managerId = String(record.values.Organization_Reference_ID.value) // Convert to string

      console.log('Extracting employeeId:', employeeId)
      console.log('Extracting managerId:', managerId)

      this.managerMap.set(employeeId, managerId)
    }
  }

  private orderReportingStructure() {
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
    const orderedByLevel = Array.from(visited).sort((a, b) => {
      const levelA = this.managerMap.has(a) ? -1 : 0 // Records with blank superior manager should be at the top
      const levelB = this.managerMap.has(b) ? -1 : 0
      return levelA - levelB
    })

    // Push the ordered managerIds to the orderedManagerIds array
    this.orderedManagerIds.push(...orderedByLevel)
  }

  private async insertDataToExistingSheet(data: any[]) {
    const sheetSlug = 'orgs' // Slug of the existing sheet "Supervisory Orgs"

    // Retrieve the workbook by its ID
    const workbook = await api.workbooks.get(this.workbookId)

    // Find the sheet with the specified slug in the workbook's sheets array
    const sheet = workbook?.data?.sheets?.find(
      (s) => s.config?.slug === sheetSlug
    )

    if (!sheet) {
      console.error(`Sheet with slug "${sheetSlug}" not found.`)
      return
    }

    const records = data.map((record) => ({
      code: { value: `Sup_Org_${record.managerId}` },
      manager_name: { value: record.manager_name },
      manager_id: { value: record.managerId }, // Wrap managerId in an object
      manager_position: { value: `P-${record.managerId}` },
      superior_code: { value: this.managerMap.get(record.managerId) }, // Wrap superior_code in an object
      location: { value: record.location },

      // Include other relevant fields as needed
    }))

    // Sort the records based on the hierarchy structure
    const sortedRecords = this.orderedManagerIds.map((employeeId) =>
      records.find((record) => record.manager_id.value === employeeId)
    )

    // Filter out undefined values
    const finalRecords = sortedRecords.filter((record) => record !== undefined)

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

    await api.records.insert(sheet.id, finalRecords) // Insert the data into the existing sheet
  }
}
