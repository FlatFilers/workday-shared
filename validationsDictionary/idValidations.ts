// Type for ValidationResult
type ValidationResult = {
  error?: string
  info?: string
}

// Common error message format helper
function formatError(value: any, message: string): string {
  return `►${value}◄ ${message}`
}

// ---------- SSN VALIDATIONS ----------

function isValidSSN(value: string, country: string): ValidationResult {
  if (country === 'USA' && !/^[0-9]{9}$/.test(value) && value) {
    return { error: formatError(value, 'is not a valid SSN.') }
  }
  return {}
}

// ---------- SIN VALIDATIONS ----------

function isValidSIN(value: string, country: string): ValidationResult {
  if (country === 'CAN' && !/^[0-9]{9}$/.test(value) && value) {
    return { error: formatError(value, 'is not a valid SIN.') }
  }
  return {}
}

// ---------- SSID VALIDATIONS ----------

function isValidSSID(value: string, country: string): ValidationResult {
  if (
    country !== 'USA' &&
    country !== 'CAN' &&
    !/^[0-9]{13}[0-9]{2}$/.test(value) &&
    value
  ) {
    return { error: formatError(value, 'is not a valid SSID.') }
  }
  return {}
}

// ---------- SVNR VALIDATIONS ----------

function isValidSVNR(value: string, country: string): ValidationResult {
  if (
    country !== 'USA' &&
    country !== 'CAN' &&
    !/^[0-9]{10}$/.test(value) &&
    value
  ) {
    return { error: formatError(value, 'is not a valid SVNR.') }
  }
  return {}
}

// Grouped export
export { isValidSSN, isValidSIN, isValidSSID, isValidSVNR }
