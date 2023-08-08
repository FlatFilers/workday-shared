import * as moment from 'moment'

// Type for validation errors
type ValidationError = string | null

// Common error message format helper
function formatError(value: any, message: string): string {
  return `►${value}◄ ${message}`
}

// ---------- BOOLEAN VALIDATIONS ----------

function checkBoolean(value: string): { error?: string; info?: string } {
  const acceptableValues = ['true', 'false', 'yes', 'no', '1', '0']

  if (!acceptableValues.includes(value.toLowerCase())) {
    return { error: formatError(value, 'does not contain a boolean value.') }
  }

  if (['yes', '1'].includes(value.toLowerCase())) {
    return { info: `Mapped incoming value "${value}" to "true".` }
  }

  if (['no', '0'].includes(value.toLowerCase())) {
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

function checkForError(value: string): ValidationError {
  for (const error of errorStrings) {
    if (value.includes(error)) {
      return formatError(value, 'must not contain any error values.')
    }
  }
  return null
}

// ---------- DATE VALIDATIONS ----------

function checkDateFormat(value: string): ValidationError {
  if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
    return formatError(
      value,
      'does not match the required date format (yyyy-MM-dd).'
    )
  }
  return null
}

// ---------- ALPHANUMERIC VALIDATIONS ----------

function isAlphanumeric(value: string): ValidationError {
  const alphanumericPattern = /^[a-zA-Z0-9]+$/

  if (!alphanumericPattern.test(value)) {
    return formatError(value, 'is not alphanumeric.')
  }
  return null
}

// ---------- PASSWORD COMPLEXITY VALIDATIONS ----------

function isComplexPwd(value: string): ValidationError {
  const hasUppercase = /[A-Z]/.test(value)
  const hasLowercase = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
  const minLength = 8

  if (
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSpecialChar ||
    value.length < minLength
  ) {
    return formatError(value, 'does not meet the complexity requirements.')
  }
  return null
}

// ---------- INTEGER VALIDATIONS ----------

function isInteger(value: any): ValidationError {
  if (Number.isInteger(Number(value))) {
    return null
  }
  return formatError(value, 'is not a valid integer.')
}

// ---------- NUMERIC VALIDATIONS ----------

function isNumeric(value: any): ValidationError {
  if (!isNaN(Number(value))) {
    return null
  }
  return formatError(value, 'is not a valid number.')
}

// ---------- EMAIL VALIDATIONS ----------

function isValidEmail(value: string): ValidationError {
  // A basic regular expression for email validation
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/

  if (!emailPattern.test(value)) {
    return formatError(value, 'is not a valid email address.')
  }
  return null // The value is a valid email
}

// ---------- PHONE VALIDATIONS ----------

function isValidPhoneNumber(value: string): ValidationError {
  const phonePattern = /^[0-9]{10,15}$/

  if (!phonePattern.test(value) && value !== null && value !== '') {
    return formatError(
      value,
      'does not contain a valid Phone Number. Must not have any non-numeric values in Phone Numbers, and must be 10 digits minimum.'
    )
  }
  return null // The value is a valid phone number
}

// ---------- URL VALIDATIONS ----------

function isValidUrl(value: string): ValidationError {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/

  if (urlPattern.test(value)) {
    return null // The value is a valid URL
  } else {
    return formatError(value, 'is not a valid URL.')
  }
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
