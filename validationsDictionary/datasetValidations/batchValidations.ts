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
  fields
) {
  let validationErrors = []
  const metadataFlag = `ISPRIMARY_USAGE_SET_${type.toUpperCase()}`

  const groupedByPrimary = recordsForValidation.reduce((acc, currentRecord) => {
    const key = String(currentRecord.values[primaryKeyField].value)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(currentRecord)
    return acc
  }, {})

  console.log('Grouped records by primary key:', groupedByPrimary)

  Object.keys(groupedByPrimary).forEach((key) => {
    const group = groupedByPrimary[key]
    const primaryTrueCount = group.filter((currentRecord) => {
      const primaryFieldName = detectPrimaryField(currentRecord, type)
      return ['TRUE', '1', 'YES'].includes(
        String(
          currentRecord.values[primaryFieldName]?.value || ''
        ).toUpperCase()
      )
    }).length

    console.log(
      `For group with key ${key}, primary count is: ${primaryTrueCount}`
    )

    if (primaryTrueCount !== 1) {
      const errorMessage = `At least one (1) and only one (1) PRIMARY flag ►${key}◄ is not set to TRUE for one of the contact ${type}s.`
      const fieldsWithError = new Set()

      group.forEach((currentRecord) => {
        for (let field of fields) {
          if (
            field.metadata?.validations?.includes(metadataFlag) &&
            !fieldsWithError.has(field.key)
          ) {
            validationErrors.push({ field: field.key, message: errorMessage })
            fieldsWithError.add(field.key)

            console.log(
              `Error for record with primary key ${key}, field ${field.key}: ${errorMessage}`
            )
            break
          }
        }
      })
    }
  })

  console.log('Final validation errors:', validationErrors)

  return validationErrors
}

// Export any additional batch validations as you create them.
