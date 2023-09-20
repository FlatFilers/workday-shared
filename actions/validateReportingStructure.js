export const validateReportingStructure = (records, returnErrors = false) => {
  const reportingErrors = [] // Array to store records with reporting errors
  const employees = {} // Object to store employee records by Applicant_ID
  const visited = new Set() // Set to keep track of visited Applicant_IDs
  const managerIds = new Set() // Set to store unique managerIds
  const employeesWithManagerId = new Set() // Set to store Applicant_IDs where Applicant_ID = Organization_Reference_ID

  //Clear all custom messages from EmployeeId field

  for (const record of records) {
    record.values.Applicant_ID.messages = []
  }

  // Recursive function to detect circular dependencies in the reporting structure
  const detectCircularDependency = (Applicant_ID, path) => {
    if (visited.has(Applicant_ID)) {
      // Circular dependency detected for Applicant_ID
      const record = employees[Applicant_ID]
      record.values.Applicant_ID.messages.push({
        message: `Circular dependency detected: ${path.join(
          ' -> '
        )} -> ${Applicant_ID}`,
        source: 'custom-logic',
        type: 'error',
      })
      reportingErrors.push(record)
      return
    }

    visited.add(Applicant_ID)
    const Organization_Reference_ID =
      employees[Applicant_ID]?.values.Organization_Reference_ID.value

    if (
      Organization_Reference_ID &&
      Organization_Reference_ID !== Applicant_ID
    ) {
      // Recursive call to detect circular dependency for the Organization_Reference_ID
      detectCircularDependency(Organization_Reference_ID, [
        ...path,
        Applicant_ID,
      ])
    }

    visited.delete(Applicant_ID)
  }

  // Iterating over the records to validate the reporting structure
  for (const record of records) {
    const Applicant_ID = record.values.Applicant_ID.value
    const Organization_Reference_ID =
      record.values.Organization_Reference_ID.value

    employees[Applicant_ID] = record

    if (Organization_Reference_ID && Organization_Reference_ID !== '') {
      // Adding Organization_Reference_ID to the set of unique managerIds
      managerIds.add(Organization_Reference_ID)

      if (Applicant_ID === Organization_Reference_ID) {
        // Add Applicant_ID to the set of Applicant_IDs where Applicant_ID = Organization_Reference_ID
        employeesWithManagerId.add(Applicant_ID)
      }
    }
  }

  // Add error message to records where Applicant_ID = Organization_Reference_ID and more than one record has this scenario
  if (employeesWithManagerId.size > 1) {
    for (const Applicant_ID of employeesWithManagerId) {
      const record = employees[Applicant_ID]
      record.values.Applicant_ID.messages.push({
        message: `Multiple records have the scenario where Applicant_ID = Organization_Reference_ID. Please ensure that only one record has the Applicant_ID = Organization_Reference_ID scenario.`,
        source: 'custom-logic',
        type: 'error',
      })
      reportingErrors.push(record)
    }
  }

  // Validating managerIds and checking if they exist as employees
  for (const record of records) {
    const Applicant_ID = record.values.Applicant_ID.value
    const Organization_Reference_ID =
      record.values.Organization_Reference_ID.value

    if (
      Organization_Reference_ID &&
      Organization_Reference_ID !== '' &&
      !employees[Organization_Reference_ID]
    ) {
      // Manager with Organization_Reference_ID does not exist as an employee
      record.values.Organization_Reference_ID.messages.push({
        message: `Manager with ID: ${Organization_Reference_ID} does not exist as an employee`,
        source: 'custom-logic',
        type: 'error',
      })
      reportingErrors.push(record)
    }
  }

  // Checking for circular dependencies in the reporting structure
  for (const Applicant_ID in employees) {
    if (!visited.has(Applicant_ID)) {
      // Start detecting circular dependencies from unvisited Applicant_ID
      detectCircularDependency(Applicant_ID, [])
    }
  }

  console.log('Reporting Errors: ' + JSON.stringify(reportingErrors))

  if (returnErrors) {
    return reportingErrors
  }
  return records
}
