import { isNil, isNotNil } from './common/helpers'
import { parseFullName } from 'parse-full-name'

// Helper function to trim leading/trailing spaces and replace multiple spaces with single space
function cleanName(name) {
  if (name === null || name === undefined) {
    return ''
  }
  return name.trim().replace(/\s+/g, ' ')
}

// Helper function to convert a string to Title Case (i.e., first letter of each word is capitalized)
function toTitleCase(name) {
  if (name === null || name === undefined) {
    return ''
  }
  return name.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
  })
}

// Function to concatenate first, middle and last names into a full name
export function concatenateNames(record) {
  try {
    console.log('Starting name concatenation...')

    // Retrieving names and manager info from the record
    const full = record.get('Legal_Full_Name')
    let first = record.get('Legal_First_Name')
    let middle = record.get('Legal_Middle_Name')
    let last = record.get('Legal_Last_Name')
    const manager = record.getLinks('Organization_Reference_ID')
    const mgrName = manager?.[0]?.Legal_Full_Name

    // Clean the names by trimming spaces and replacing multiple spaces with a single space
    first = cleanName(first)
    middle = cleanName(middle)
    last = cleanName(last)

    // Concatenating names if full name is missing and both first and last names are present
    if ((isNil(full) || full === '') && isNotNil(first) && isNotNil(last)) {
      record.set('Legal_Full_Name', `${first} ${last}`)
      if (isNotNil(middle)) {
        record.set('Legal_Full_Name', `${first} ${middle} ${last}`)
      }
    }

    // Normalize the full name to title case
    const normalizedFullName = toTitleCase(record.get('Legal_Full_Name'))
    record.set('Legal_Full_Name', normalizedFullName)

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

// Function to split a full name into first, middle, and last names
export function splitFullName(record) {
  try {
    console.log('Starting name splitting...')
    const full = record.get('Legal_Full_Name')

    if (isNotNil(full)) {
      // Parsing the full name using parse-full-name library
      const parsedName = parseFullName(full)

      const firstName = parsedName.first
      const lastName = parsedName.last
      // Parsing might yield an array of middle names, join them with spaces if so
      const middleName = Array.isArray(parsedName.middle)
        ? parsedName.middle.join(' ')
        : parsedName.middle

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
