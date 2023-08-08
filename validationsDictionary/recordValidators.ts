import * as validations from './validations'
import * as fieldRules from './fieldRules'
import { validateNationalID } from './validateNationalID'

function validateRecord(record, fields) {
  const NATIONAL_ID_PATTERN = /.*National_ID_Country_Ref.*_ID$/

  fields.forEach((field) => {
    const fieldValue = record.get(field.key)
    const country = record.get('COUNTRY')

    const errorCheckMessage = validations.checkForError(fieldValue)
    if (errorCheckMessage) {
      record.addError(field.key, errorCheckMessage)
    }

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
      validateNationalID(record, field, country)
    }
  })
}

export { validateRecord }
