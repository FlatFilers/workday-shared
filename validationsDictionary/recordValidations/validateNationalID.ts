import * as idValidations from './idValidations'

function validateNationalID(record, field, country) {
  const fieldValue = record.get(field.key)

  const countryToIDValidationMap = {
    USA: idValidations.isValidSSN,
    CAN: idValidations.isValidSIN,
  }

  const validationFunc = countryToIDValidationMap[country]
  if (validationFunc) {
    const validationResult = validationFunc(fieldValue, country)
    if (validationResult.error) {
      record.addError(field.key, validationResult.error)
    }
  }

  if (country !== 'USA' && country !== 'CAN') {
    const ssidValidationResult = idValidations.isValidSSID(fieldValue, country)
    if (ssidValidationResult.error) {
      record.addError(field.key, ssidValidationResult.error)
    }

    const svnrValidationResult = idValidations.isValidSVNR(fieldValue, country)
    if (svnrValidationResult.error) {
      record.addError(field.key, svnrValidationResult.error)
    }
  }
}

export { validateNationalID }
