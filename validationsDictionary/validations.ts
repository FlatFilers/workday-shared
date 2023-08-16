import * as moment from 'moment'

// Type for ValidationResult
type ValidationResult = {
  error?: string
  info?: string
}

// Common error message format helper
function formatError(value: any, message: string): string {
  return `►${value}◄ ${message}`
}

// ---------- BOOLEAN VALIDATIONS ----------

// ---------- BOOLEAN VALIDATIONS ----------

function checkBoolean(
  value: any,
  record: any,
  fieldKey: string
): ValidationResult {
  if (value === null) {
    return {}
  }
  const stringValue = String(value)
  const lowercasedValue = stringValue.toLowerCase()
  const acceptableValues = ['true', 'false', 'yes', 'no', '1', '0']

  if (!acceptableValues.includes(lowercasedValue)) {
    return { error: formatError(value, 'does not contain a boolean value.') }
  }

  if (['yes', '1'].includes(lowercasedValue)) {
    record.set(fieldKey, true) // Set the boolean value in the record
    return { info: `Mapped incoming value "${value}" to "true".` }
  }

  if (['no', '0'].includes(lowercasedValue)) {
    record.set(fieldKey, false) // Set the boolean value in the record
    return { info: `Mapped incoming value "${value}" to "false".` }
  }

  return {}
}

// ---------- ERROR CHECK VALIDATIONS ----------

const errorStrings = [
  '#NAME?',
  '#DIV/0',
  '#REF!',
  '#NUM!',
  '#VALUE!',
  '#NULL!',
  'ERROR',
  'Circular Reference',
]

function checkForError(value: any): ValidationResult {
  if (value === null) {
    return {}
  }
  if (typeof value !== 'string' || value === null) {
    return {}
  }
  for (const error of errorStrings) {
    if (value.includes(error)) {
      return { error: formatError(value, 'must not contain any error values.') }
    }
  }
  return {}
}

// ---------- DATE VALIDATIONS ----------

function checkDateFormat(value: string): ValidationResult {
  if (value === null) {
    return {}
  }
  if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
    return {
      error: formatError(
        value,
        'does not match the required date format (yyyy-MM-dd).'
      ),
    }
  }
  return {}
}

// ---------- ALPHANUMERIC VALIDATIONS ----------

function isAlphanumeric(value: string): ValidationResult {
  const alphanumericPattern = /^[a-zA-Z0-9]+$/
  if (value === null) {
    return {}
  }

  if (!alphanumericPattern.test(value)) {
    return { error: formatError(value, 'is not alphanumeric.') }
  }
  return {}
}

// ---------- PASSWORD COMPLEXITY VALIDATIONS ----------

function isComplexPwd(value: string): ValidationResult {
  const hasUppercase = /[A-Z]/.test(value)
  const hasLowercase = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
  const minLength = 8
  if (value === null) {
    return {}
  }

  if (
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSpecialChar ||
    value.length < minLength
  ) {
    return {
      error: formatError(value, 'does not meet the complexity requirements.'),
    }
  }
  return {}
}

// ---------- INTEGER VALIDATIONS ----------

function isInteger(value: any): ValidationResult {
  if (value === null) {
    return {}
  }
  if (Number.isInteger(Number(value))) {
    return {}
  }
  return { error: formatError(value, 'is not a valid integer.') }
}

// ---------- NUMERIC VALIDATIONS ----------

function isNumeric(value: any): ValidationResult {
  if (value === null) {
    return {}
  }
  if (!isNaN(Number(value))) {
    return {}
  }
  return { error: formatError(value, 'is not a valid number.') }
}

// ---------- EMAIL VALIDATIONS ----------

function isValidEmail(value: string): ValidationResult {
  // A basic regular expression for email validation
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  if (value === null) {
    return {}
  }

  if (!emailPattern.test(value)) {
    return { error: formatError(value, 'is not a valid email address.') }
  }
  return {} // The value is a valid email
}

// ---------- PHONE VALIDATIONS ----------

function isValidPhoneNumber(value: string): ValidationResult {
  if (value === null) {
    return {}
  }
  const phonePattern = /^[0-9]{10,15}$/

  if (!phonePattern.test(value) && value !== null && value !== '') {
    return {
      error: formatError(
        value,
        'does not contain a valid Phone Number. Must not have any non-numeric values in Phone Numbers, and must be 10 digits minimum.'
      ),
    }
  }
  return {} // The value is a valid phone number
}

// ---------- URL VALIDATIONS ----------

function isValidUrl(value: string): ValidationResult {
  if (value === null) {
    return {}
  }
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/

  if (!urlPattern.test(value)) {
    return { error: formatError(value, 'is not a valid URL.') }
  }
  return {} // The value is a valid URL
}

// Grouped export
export {
  checkBoolean,
  checkForError,
  checkDateFormat,
  isAlphanumeric,
  isComplexPwd,
  isInteger,
  isNumeric,
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
}
