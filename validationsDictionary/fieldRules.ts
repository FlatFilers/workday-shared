/**
 * Determines if a field should be validated as alphanumeric.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as alphanumeric.
 */
function shouldValidateAsAlphanumeric(field): boolean {
  return field.metadata?.validateAs === 'alphanumeric'
}

/**
 * Determines if a field should undergo password complexity validation.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should undergo password complexity validation.
 */
function shouldValidateAsComplexPwd(field): boolean {
  return field.metadata?.validations?.includes('complexPwd') ?? false
}

/**
 * Determines if a field should be validated as an integer.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as an integer.
 */
function shouldValidateAsInteger(field): boolean {
  return field.metadata?.validations?.includes('ISINTEGER') ?? false
}

/**
 * Determines if a field should be validated as an email.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as an email.
 */
function shouldValidateAsEmail(field): boolean {
  return field.metadata?.validateAs === 'email'
}

/**
 * Determines if a field should be validated as a phone number.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as a phone number.
 */
function shouldValidateAsPhoneNumber(field): boolean {
  return field.metadata?.validateAs === 'phoneNumber'
}

/**
 * Determines if a field should be validated as a URL.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as a URL.
 */
function shouldValidateAsUrl(field): boolean {
  return field.metadata?.validateAs === 'url'
}

export {
  shouldValidateAsAlphanumeric,
  shouldValidateAsComplexPwd,
  shouldValidateAsInteger,
  shouldValidateAsEmail,
  shouldValidateAsPhoneNumber,
  shouldValidateAsUrl,
}
