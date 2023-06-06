import { isNil, isNotNil } from './common/helpers'
import { parseFullName } from 'parse-full-name'

// Function to concatenate names
export function concatenateNames(record) {
  try {
    console.log('Starting name concatenation...')

    // Retrieving field values from the record
    const full = record.get('Legal_Full_Name')
    const first = record.get('Legal_First_Name')
    const middle = record.get('Legal_Middle_Name')
    const last = record.get('Legal_Last_Name')
    const manager = record.getLinks('Organization_Reference_ID')
    const mgrName = manager?.[0]?.Legal_Full_Name

    // Logging the field values
    console.log('Legal_Full_Name:', full)
    console.log('Legal_First_Name:', first)
    console.log('Legal_Middle_Name:', middle)
    console.log('Legal_Last_Name:', last)
    console.log('Manager:', manager)
    console.log('MgrName:', mgrName)

    // Concatenating names if Legal_Full_Name is missing and first and last names are present
    if ((isNil(full) || full === '') && isNotNil(first) && isNotNil(last)) {
      record.set('Legal_Full_Name', `${first} ${last}`)
      if (isNotNil(middle)) {
        record.set('Legal_Full_Name', `${first} ${middle} ${last}`)
      }
    }

    // Setting Organization_Descriptor field if manager and manager name are present
    if (isNotNil(manager) && isNotNil(mgrName)) {
      record.set('Organization_Descriptor', mgrName)
    }
  } catch (error) {
    console.log(
      'Error occurred during name concatenation and manager name:',
      error
    )
    // Handle or rethrow the error as needed
  }
}

// Function to split full name into first, middle, and last names
export function splitFullName(record) {
  try {
    console.log('Starting name splitting...')
    const full = record.get('Legal_Full_Name')

    // Logging the Legal_Full_Name value
    console.log('Legal_Full_Name:', full)

    if (isNotNil(full)) {
      // Parsing the full name using parse-full-name library
      const parsedName = parseFullName(full)

      // Logging the parsed name components
      console.log('Parsed Name:', parsedName)

      const firstName = parsedName.first
      const lastName = parsedName.last
      const middleName = Array.isArray(parsedName.middle)
        ? parsedName.middle.join(' ')
        : parsedName.middle

      // Logging the split name components
      console.log('Legal_First_Name:', firstName)
      console.log('Legal_Last_Name:', lastName)
      console.log('Legal_Middle_Name:', middleName)

      // Setting the name fields with the parsed name components
      record.set('Legal_First_Name', firstName)
      record.set('Legal_Last_Name', lastName)
      record.set('Legal_Middle_Name', middleName)
    }
  } catch (error) {
    console.log('Error occurred during name splitting:', error)
    // Handle or rethrow the error as needed
  }
}
