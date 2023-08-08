// Type for validation errors
type ValidationError = string | null

// Common error message format helper
function formatError(value: any, message: string): string {
  return `►${value}◄ ${message}`
}

// ---------- SSN VALIDATIONS ----------

function isValidSSN(value: string, country: string): ValidationError {
  if (country === 'USA' && !/^[0-9]{9}$/.test(value) && value) {
    return formatError(value, 'is not a valid SSN.')
  }
  return null
}

// ---------- SIN VALIDATIONS ----------

function isValidSIN(value: string, country: string): ValidationError {
  if (country === 'CAN' && !/^[0-9]{9}$/.test(value) && value) {
    return formatError(value, 'is not a valid SIN.')
  }
  return null
}

// ---------- SSID VALIDATIONS ----------

function isValidSSID(value: string): ValidationError {
  if (!/^[0-9]{13}[0-9]{2}$/.test(value) && value) {
    return formatError(value, 'is not a valid SSID.')
  }
  return null
}

// ---------- SVNR VALIDATIONS ----------

function isValidSVNR(value: string): ValidationError {
  if (!/^[0-9]{10}$/.test(value) && value) {
    return formatError(value, 'is not a valid SVNR.')
  }
  return null
}

// Grouped export
export { isValidSSN, isValidSIN, isValidSSID, isValidSVNR }
