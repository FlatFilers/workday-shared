import { vlookup } from './common/common'
import validateContactInformation from './validate-contacts'
import { validateJobAndDates } from './validate-job-dates'
import { formatRecordDates } from './common/dateFormatting'
import { isNotNil, isNil } from './common/helpers'
import { concatenateNames, splitFullName } from './employeeNameProcessing'
import validateAndFormatSSN from './validateAndFormatSSN'
import { checkApiForExistingWorkers } from './apiValidation'

export async function employeeValidations(record, fields, employees) {
  // The function itself must be async to use await inside it
  // Validates that the input is a record object
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid record input. Expecting a valid record object.')
  }

  // Normalizes all dates in the record before running other logic
  try {
    console.log('Normalizing dates...')
    formatRecordDates(record, fields)
    console.log('Dates normalized successfully.')
  } catch (error) {
    console.log('Error occurred during date formatting:', error)
  }

  // Processes names: if names are split, it concatenates them. If name is full, it splits it into components
  try {
    console.log('Processing names...')
    concatenateNames(record)
    splitFullName(record)
    console.log('Names processed successfully.')
  } catch (error) {
    console.log('Error occurred during name processing:', error)
  }

  // Runs validations on worker's contact information and personal data
  try {
    console.log('Validating contact information...')
    validateContactInformation(record)
    console.log('Contact information validated successfully.')
  } catch (error) {
    console.log('Error occurred during contact information validation:', error)
  }

  // Runs validations related to worker's job profile and associated dates
  try {
    console.log('Validating job and dates...')
    validateJobAndDates(record)
    console.log('Job and dates validated successfully.')
  } catch (error) {
    console.log('Error occurred during job and date validation:', error)
  }

  // Runs validations and formatting on worker's Social Security Number (SSN)
  try {
    console.log('Validating and formatting SSN...')
    validateAndFormatSSN(record)
    console.log('SSN validated and formatted successfully.')
  } catch (error) {
    console.log(
      'Error occurred during validation and formatting of SSN:',
      error
    )
  }

  // Performs basic validations on worker's salary.
  // Sets 'Compensation_Element_Amount' based on either 'hourly_rate' or 'salary' whichever is not null
  try {
    console.log('Running salary/pay validations...')
    const hrly = record.get('hourly_rate')
    const slry = record.get('salary')
    if (isNotNil(hrly)) {
      record.set('Compensation_Element_Amount', hrly)
    }
    if (isNotNil(slry)) {
      record.set('Compensation_Element_Amount', slry)
    }
    console.log('Salary/pay validations completed successfully.')
  } catch (error) {
    console.log('Error in running salary/pay validations:', error)
  }

  // Performs a vlookup operation to fill in job titles based on job codes
  try {
    console.log('Performing vlookup...')
    vlookup(record, 'Job_Profile_Reference_ID', 'title', 'Job_Title')
    console.log('Vlookup completed successfully.')
  } catch (error) {
    console.log('Error occurred during vlookup:', error)
  }

  // Run API check for existing workers
  try {
    console.log('Checking API for existing workers...')
    await checkApiForExistingWorkers(record, employees)
    console.log('API check completed successfully.')
  } catch (error) {
    console.log('Error occurred during API check:', error)
  }

  // Returns the validated and processed record
  return record
}
