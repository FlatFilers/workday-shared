import * as validations from './validations'
import * as fieldRules from './fieldRules'
import * as idValidations from './idValidations'

function validateRecord(record, fields) {
  const NATIONAL_ID_PATTERN = /.*National_ID_Country_Ref.*_ID$/

  // Loop through all fields
  fields.forEach((field) => {
    const fieldValue = record.get(field.key)
    const country = record.get('COUNTRY')

    const errorCheckMessage = validations.checkForError(fieldValue)
    if (errorCheckMessage) {
      record.addError(field.key, errorCheckMessage)
    }

    // Use a mapping for cleaner code
    const fieldTypeToValidationMap = {
      boolean: validations.checkBoolean,
      date: validations.checkDateFormat,
      number: validations.isNumeric,
    }

    const validationFunc = fieldTypeToValidationMap[field.type]
    if (validationFunc) {
      const error = validationFunc(fieldValue)
      if (error) {
        record.addError(field.key, error)
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
        const error = validation(fieldValue)
        if (error) {
          record.addError(field.key, error)
        }
      }
    }

    if (field.name.match(NATIONAL_ID_PATTERN)) {
      const countryToIDValidationMap = {
        USA: idValidations.isValidSSN,
        CAN: idValidations.isValidSIN,
      }

      const validationFunc = countryToIDValidationMap[country]
      if (validationFunc) {
        const error = validationFunc(fieldValue)
        if (error) {
          record.addError(field.key, error)
        }
      }

      const ssidError = idValidations.isValidSSID(fieldValue)
      if (ssidError) {
        record.addError(field.key, ssidError)
      }

      const svnrError = idValidations.isValidSVNR(fieldValue)
      if (svnrError) {
        record.addError(field.key, svnrError)
      }
    }
  })
}

export { validateRecord }
