/**
 * Helper function to detect the primary field in a record based on the type.
 * @param {Object} record - The record to inspect.
 * @param {string} type - The type of primary field to look for ('Phone' or 'Email').
 * @returns {string|null} - The detected primary field or null if not found.
 */

function detectPrimaryField(record, type) {
  const typeMap = {
    Phone: 'Phone_Type',
    Email: 'Email_Type',
    Address: 'Address_Type',
  }

  for (let field in record.values) {
    if (field.includes(typeMap[type]) && field.includes('Primary')) {
      return field
    }
  }
  return null // Return null if no field matches the criteria
}

export function validatePrimaryUsage(
  recordsForValidation,
  primaryKeyField,
  type,
  fields,
  record
) {
  //console.log(`Validating for type: ${type}`)
  //console.log(`Records for validation:`, recordsForValidation)

  let validationErrors = []
  let primaryKeySummary = []

  const metadataFlag = `ISPRIMARY_USAGE_SET_${type.toUpperCase()}`

  const groupedByPrimary = recordsForValidation.reduce((acc, currentRecord) => {
    const key = String(currentRecord.values[primaryKeyField].value)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(currentRecord)
    return acc
  }, {})

  console.log('Grouped By Primary:', groupedByPrimary)

  Object.keys(groupedByPrimary).forEach((key) => {
    const group = groupedByPrimary[key]
    console.log(`Processing group for key: ${key}`, group)

    const primaryTrueCount = group.filter((currentRecord) => {
      const primaryFieldName = detectPrimaryField(currentRecord, type)
      return ['TRUE', '1', 'YES'].includes(
        String(
          currentRecord.values[primaryFieldName]?.value || ''
        ).toUpperCase()
      )
    }).length

    //console.log(`For key: ${key}, primary count is: ${primaryTrueCount}`)

    primaryKeySummary.push({
      primaryKey: key,
      primaryTrueCount: primaryTrueCount,
    })

    if (primaryTrueCount !== 1) {
      const errorMessage = `At least one (1) and only one (1) PRIMARY flag ►${key}◄ is not set to TRUE for one of the contact ${type}s.`

      // Use a Set to track which fields have already received an error
      const fieldsWithError = new Set()

      group.forEach((currentRecord) => {
        console.log(
          `Checking fields for record with ${primaryKeyField}: ${currentRecord.values[primaryKeyField].value}`
        )
        console.log('Current Record: ', JSON.stringify(currentRecord, null, 2))
        console.log('Current Record Type: ', typeof record.addError)

        for (let field of fields) {
          if (
            field.metadata?.validations?.includes(metadataFlag) &&
            !fieldsWithError.has(field.key) // Check if error has not been added for this field
          ) {
            console.log(
              `Adding error to record with ${primaryKeyField}: ${currentRecord.values[primaryKeyField].value}, Field: ${field.key}, Error: ${errorMessage}`
            )
            record.addError(field.key, errorMessage)

            // Mark the field as having received an error
            fieldsWithError.add(field.key)

            // No need to continue checking other fields for this record
            break
          }
        }
      })
    }
  })

  console.log('Primary Key Summary:', primaryKeySummary)
  console.log('Final Validation Errors:', validationErrors)

  return validationErrors
}

// Export any additional batch validations as you create them.
