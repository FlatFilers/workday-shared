import {
  checkForError,
  checkBoolean,
  checkDateFormat,
  isAlphanumeric,
  isComplexPwd,
  isInteger,
  isNumeric,
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
} from './validations'

import {
  shouldValidateAsAlphanumeric,
  shouldValidateAsComplexPwd,
  shouldValidateAsInteger,
  shouldValidateAsEmail,
  shouldValidateAsPhoneNumber,
  shouldValidateAsUrl,
} from './fieldRules'

function validateRecord(record, fields) {
  // Loop through all fields
  fields.forEach((field) => {
    // Get the current value of the field
    const fieldValue = record.get(field.key)

    // Universal check for errors
    const errorCheckMessage = checkForError(fieldValue)
    if (errorCheckMessage) {
      record.addError(field.key, errorCheckMessage)
    }

    // Validations based on field type
    switch (field.type) {
      case 'boolean':
        const { error, info } = checkBoolean(fieldValue)
        if (error) record.addError(field.key, error)
        if (info) record.addInfo(field.key, info)
        break
      case 'date':
        const dateFormatError = checkDateFormat(fieldValue)
        if (dateFormatError) record.addError(field.key, dateFormatError)
        break
      case 'number':
        const numericError = isNumeric(fieldValue)
        if (numericError) record.addError(field.key, numericError)
        break
      default:
        break
    }

    // Custom field rules and validations
    if (shouldValidateAsAlphanumeric(field)) {
      const alphanumericError = isAlphanumeric(fieldValue)
      if (alphanumericError) record.addError(field.key, alphanumericError)
    }

    if (shouldValidateAsComplexPwd(field)) {
      const passwordComplexityError = isComplexPwd(fieldValue)
      if (passwordComplexityError)
        record.addError(field.key, passwordComplexityError)
    }

    if (shouldValidateAsInteger(field)) {
      const integerError = isInteger(fieldValue)
      if (integerError) record.addError(field.key, integerError)
    }
    if (shouldValidateAsEmail(field)) {
      const emailValidationError = isValidEmail(fieldValue)
      if (emailValidationError) {
        record.addError(field.key, emailValidationError)
      }
    }
    if (shouldValidateAsPhoneNumber(field)) {
      const phoneNumberError = isValidPhoneNumber(fieldValue)

      if (phoneNumberError) {
        record.addError(field.key, phoneNumberError)
      }
    }
    // If the field meets the URL criteria, apply the ISVALIDURL validation
    if (shouldValidateAsUrl(field)) {
      const urlError = isValidUrl(fieldValue)
      if (urlError) {
        record.addError(field.key, urlError)
      }
    }
  })
}

export { validateRecord }
