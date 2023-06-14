import { isNil, isString, isNotNil } from './common/helpers'

// Main function to validate and format SSN
const validateAndFormatSSN = (record) => {
  // Check if the record is an object and has a "get" method, otherwise throw an error
  if (
    !record ||
    typeof record !== 'object' ||
    typeof record.get !== 'function'
  ) {
    throw new Error(
      'Invalid input: "record" must be an object with a "get" method.'
    )
  }

  // Extract the SSN from the record using the "get" method
  const originalSSN = record.get('National_ID')

  // If SSN is empty or null, skip the rest of the function
  if (isNil(originalSSN)) {
    return
  }

  // Check if SSN is a string, otherwise throw an error
  if (!isString(originalSSN)) {
    throw new Error('Invalid input: "National_ID" must be a string.')
  }

  // Remove all non-numeric characters from the SSN
  let sanitizedSSN = sanitizeSSN(originalSSN)

  // Perform SSN validation
  validateSSN(sanitizedSSN, record)

  // If the sanitized SSN is not empty and it's different from the original, update the record and add an info message
  if (isNotNil(sanitizedSSN) && originalSSN !== sanitizedSSN) {
    record.set('National_ID', sanitizedSSN)
    record.addInfo(
      'National_ID',
      `The original SSN "${originalSSN}" was sanitized to "${sanitizedSSN}" by removing any non-numeric characters.`
    )
  }
}

// Function to sanitize the SSN by removing all non-numeric characters
const sanitizeSSN = (ssn) => {
  return ssn.replace(/\D/g, '')
}

// Function to validate the SSN format and detect placeholders
const validateSSN = (ssn, record) => {
  // Set of common placeholder SSNs
  const placeholderSSNs = new Set([
    '123456789',
    '000000000',
    '111111111',
    '222222222',
    '333333333',
    '444444444',
    '555555555',
    '666666666',
    '777777777',
    '888888888',
    '999999999',
  ])

  // If the SSN is a placeholder, add a warning to the record
  if (placeholderSSNs.has(ssn)) {
    record.addWarning(
      'National_ID',
      `The SSN "${ssn}" is a common placeholder. Please confirm that this is the correct SSN.`
    )
    return
  }

  // Check if the SSN is properly formatted. If not, add an error to the record
  if (
    ssn.length !== 9 ||
    /^(000|666|9)\d{6}|^\d{3}00\d{4}|^\d{5}0000$/.test(ssn)
  ) {
    record.addError(
      'National_ID',
      `The SSN "${ssn}" is not properly formatted. A valid SSN must be a 9-digit number that does not begin with '000', '666', or any number between '900-999', and it cannot have '00' in the fourth and fifth positions or '0000' in the last four positions.`
    )
  }
}

// Export the main function
export default validateAndFormatSSN
