/**
 * Determines if a field should be validated as alphanumeric.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as alphanumeric.
 */
function shouldValidateAsAlphanumeric(field): boolean {
  // Example: validate fields with names that start with 'alpha_'
  return field.name.startsWith('alpha_')
}

/**
 * Determines if a field should undergo password complexity validation.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should undergo password complexity validation.
 */
function shouldValidateAsComplexPwd(field): boolean {
  return field.name === 'password'
}

/**
 * Determines if a field should be validated as an integer.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as an integer.
 */
function shouldValidateAsInteger(field): boolean {
  return field.name === 'integer_field'
}

/**
 * Determines if a field should be validated as an email.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as an email.
 */
function shouldValidateAsEmail(field): boolean {
  // Check if the field name contains the word 'email' (case-insensitive)
  return field.name.toLowerCase().includes('email')
}

/**
 * Determines if a field should be validated as a phone number.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as a phone number.
 */
function shouldValidateAsPhoneNumber(field): boolean {
  // Check if the field name includes "phone number"
  return field.name.toLowerCase().includes('phone number')
}

/**
 * Determines if a field should be validated as a URL.
 * @param {Object} field - The field to check.
 * @returns {boolean} - Whether the field should be validated as a URL.
 */

function shouldValidateAsUrl(field): boolean {
  return field.name.toLowerCase().includes('url')
}

export {
  shouldValidateAsAlphanumeric,
  shouldValidateAsComplexPwd,
  shouldValidateAsInteger,
  shouldValidateAsEmail,
  shouldValidateAsPhoneNumber,
  shouldValidateAsUrl,
}
