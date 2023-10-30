/**
 * Determines if the dataset should undergo primary usage validation based on the provided type.
 *
 * @param {Object} field - The field to check.
 * @param {string} type - The type of validation to check for (e.g., 'PHONE' or 'EMAIL').
 * @returns {boolean} - Whether the dataset should undergo primary usage validation for the specified type.
 */
function shouldValidatePrimaryUsage(field, type) {
  const shouldValidate =
    field.metadata?.validations?.includes(
      `ISPRIMARY_USAGE_SET_${type.toUpperCase()}`
    ) ?? false
  // console.log(
  //   `Checking field: ${field.key} for type: ${type} - Result: ${shouldValidate}`
  // )
  return shouldValidate
}

export {
  // ... (other exported functions)
  shouldValidatePrimaryUsage,
}
