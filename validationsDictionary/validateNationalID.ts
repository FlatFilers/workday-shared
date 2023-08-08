import * as idValidations from './idValidations'

function validateNationalID(record, field, country) {
  const fieldValue = record.get(field.key)

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

export { validateNationalID }
