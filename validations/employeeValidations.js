import { vlookup } from './common/common'
import validateContactInformation from './validate-contacts'
import { validateJobAndDates } from './validate-job-dates'
import { formatRecordDates } from './common/dateFormatting'
import { isNotNil, isNil } from './common/helpers'
import { concatenateNames, splitFullName } from './employeeNameProcessing'

export function employeeValidations(record) {
  // Validate the input record parameter
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid record input. Expecting a valid record object.')
  }

  // baseline function for normalizing all dates before running other logic
  try {
    formatRecordDates(record, 'workers')
  } catch (error) {
    console.log('Error occurred during date formatting:', error)
    // Handle or rethrow the error as needed
  }

  // Process names: concatenate or split
  try {
    concatenateNames(record)
    splitFullName(record)
  } catch (error) {
    console.log('Error occurred during name processing:', error)
    // Handle or rethrow the error as needed
  }

  // validations on worker contact / personal information
  try {
    validateContactInformation(record)
  } catch (error) {
    console.log('Error occurred during contact information validation:', error)
    // Handle or rethrow the error as needed
  }

  // validations on worker jobs and dates
  try {
    validateJobAndDates(record)
  } catch (error) {
    console.log('Error occurred during job and date validation:', error)
    // Handle or rethrow the error as needed
  }

  // simple salary validations
  try {
    const hrly = record.get('hourly_rate')
    const slry = record.get('salary')
    if (isNotNil(hrly)) {
      record.set('Compensation_Element_Amount', hrly)
    }
    if (isNotNil(slry)) {
      record.set('Compensation_Element_Amount', slry)
    }
  } catch (error) {
    console.log('Error in running salary / pay validations:', error)
    // Handle or rethrow the error as needed
  }

  // lookup job titles based on job code
  try {
    vlookup(record, 'Job_Profile_Reference_ID', 'title', 'Job_Title')
  } catch (error) {
    console.log('Error occurred during vlookup:', error)
    // Handle or rethrow the error as needed
  }

  return record
}
