import * as validations from './validations'
import * as fieldRules from './fieldRules'
import { validateNationalID } from './validateNationalID'

function validateRecord(record, fields) {
  // Log the initial state of the record
  // console.log(
  //   `Initial state of record (ID: ${record.id || 'unknown'}):`,
  //   record
  // )

  // 1. Initialization: Set metadata to unprocessed at the start of validation
  record.metadata = {
    ...record.metadata,
    processed: false,
  }

  const NATIONAL_ID_PATTERN = /.*National_ID_Country_Ref.*_ID$/

  // Check if 'COUNTRY' is one of the field keys
  const countryExists = fields.some((field) => field.key === 'COUNTRY')
  const country = countryExists ? record.get('COUNTRY') : null

  // Check if NATIONAL_ID_PATTERN matches any field key
  const shouldRunNationalIDValidations =
    countryExists &&
    fields.some(
      (field) =>
        field.key &&
        typeof field.key === 'string' &&
        field.key.match(NATIONAL_ID_PATTERN)
    )

  fields.forEach((field) => {
    const fieldValue = record.get(field.key)
    //console.log(`Processing field: ${field.key}, value: ${fieldValue}`)

    const errorCheckResult = validations.checkForError(fieldValue)
    if (errorCheckResult.error) {
      // console.log(
      //   `Error check message for ${field.key}: ${errorCheckResult.error}`
      // )
      record.addError(field.key, errorCheckResult.error)
    }

    const fieldTypeToValidationMap = {
      boolean: validations.checkBoolean,
      date: validations.checkDateFormat,
      number: validations.isNumeric,
    }

    const validationFunc = fieldTypeToValidationMap[field.type]
    if (validationFunc) {
      if (field.type === 'boolean') {
        //   console.log(`Validating boolean for ${field.key}`)
      }
      const validationResult = validationFunc(fieldValue, record, field.key)
      if (validationResult.error) {
        // console.log(
        //   `Validation error for ${field.key}: ${validationResult.error}`
        // )
        record.addError(field.key, validationResult.error)
      } else if (validationResult.info) {
        // console.log(
        //   `Validation info for ${field.key}: ${validationResult.info}`
        // )
        record.addInfo(field.key, validationResult.info)
      }
    }

    const fieldRuleToValidationMap = {
      shouldValidateAsAlphanumeric: validations.isAlphanumeric,
      shouldValidateAsComplexPwd: validations.isComplexPwd,
      shouldValidateAsInteger: validations.isInteger,
      shouldValidateAsEmail: validations.isValidEmail,
      shouldValidateAsPhoneNumber: validations.isValidPhoneNumber,
      shouldValidateAsUrl: validations.isValidUrl,
    }

    for (const [rule, validation] of Object.entries(fieldRuleToValidationMap)) {
      if (fieldRules[rule](field)) {
        // We've already defined fieldValue at the beginning of the forEach loop, so we don't need to redefine it here

        // Skip validation if the value is null or empty
        if (fieldValue === null || fieldValue === '') continue

        const validationResult = validation(fieldValue)
        if (validationResult.error) {
          console.log(
            `Field rule error for ${field.key}: ${validationResult.error}`
          )
          record.addError(field.key, validationResult.error)
        } else if (validationResult.info) {
          console.log(
            `Field rule info for ${field.key}: ${validationResult.info}`
          )
          record.addInfo(field.key, validationResult.info)
        }
      }
    }

    if (
      shouldRunNationalIDValidations &&
      field.key.match(NATIONAL_ID_PATTERN)
    ) {
      // console.log(`Validating national ID for ${field.key}`)
      validateNationalID(record, field, country) // Pass the value to the validation function
    } else {
      // console.log(`National ID Validations will not run for ${field.key}`)
    }
  })

  // 2. Completion: After all validations, set metadata to processed
  record.metadata = {
    ...record.metadata,
    processed: true,
  }
  // Log the metadata for the processed record
  console.log(
    `Metadata for processed record (ID: ${record || 'unknown'}):`,
    record.metadata
  )
  // Log the state of the record after all validations
  console.log(
    `Final state of record after validateRecord (ID: ${
      record.id || 'unknown'
    }):`,
    record
  )
}

export { validateRecord }
