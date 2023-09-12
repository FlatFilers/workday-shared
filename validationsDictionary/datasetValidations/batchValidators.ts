import * as batchValidations from './batchValidations'
import * as batchFieldRules from './batchFieldRules'

function validateBatch(record, fields, primaryKeyField, recordsForValidation) {
  console.log('Inside validateBatch function')
  console.log(`Number of records: ${recordsForValidation.length}`)
  console.log(`Number of fields: ${fields.length}`)
  console.log(`Primary key field: ${primaryKeyField}`)

  // Log the initial state of the record before batch validations
  console.log(
    `Initial state of record before validateBatch (ID: ${
      record.id || 'unknown'
    }):`,
    record
  )

  // Use a Map to store errors for each primary key
  const batchErrorsMap = new Map()

  fields.forEach((field) => {
    //console.log(`Field: ${field.key}, Metadata:`, field.metadata)

    // Check for phone validation
    if (batchFieldRules.shouldValidatePrimaryUsage(field, 'Phone')) {
      // console.log(
      //   `Validating field: ${field.key} with rule: shouldValidatePrimaryUsageForPhone`
      // )

      // Filter records for primary usage validation based on the primary key
      const filteredRecords = recordsForValidation.filter((currentRecord) => {
        return (
          currentRecord.values[primaryKeyField].value ===
          record.get(primaryKeyField)
        )
      })

      const phoneErrors = batchValidations.validatePrimaryUsage(
        filteredRecords,
        primaryKeyField,
        'Phone',
        fields,
        record
      )

      // Add phoneErrors to batchErrorsMap using the primary key as the key
      if (phoneErrors.length > 0) {
        const primaryKey = record.get(primaryKeyField)
        if (!batchErrorsMap.has(primaryKey)) {
          batchErrorsMap.set(primaryKey, [])
        }
        batchErrorsMap.get(primaryKey).push(...phoneErrors)
      }
    }

    // Check for email validation
    if (batchFieldRules.shouldValidatePrimaryUsage(field, 'Email')) {
      // console.log(
      //   `Validating field: ${field.key} with rule: shouldValidatePrimaryUsageForEmail`
      // )

      // Filter records for primary usage validation based on the primary key
      const filteredRecords = recordsForValidation.filter((currentRecord) => {
        return (
          currentRecord.values[primaryKeyField].value ===
          record.get(primaryKeyField)
        )
      })

      const emailErrors = batchValidations.validatePrimaryUsage(
        filteredRecords,
        primaryKeyField,
        'Email',
        fields,
        record
      )

      // Add emailErrors to batchErrorsMap using the primary key as the key
      if (emailErrors.length > 0) {
        const primaryKey = record.get(primaryKeyField)
        if (!batchErrorsMap.has(primaryKey)) {
          batchErrorsMap.set(primaryKey, [])
        }
        batchErrorsMap.get(primaryKey).push(...emailErrors)
      }
    }

    // Check for address validation
    if (batchFieldRules.shouldValidatePrimaryUsage(field, 'Address')) {
      // console.log(
      //   `Validating field: ${field.key} with rule: shouldValidatePrimaryUsageForAddress`
      // )

      // Filter records for primary usage validation based on the primary key
      const filteredRecords = recordsForValidation.filter((currentRecord) => {
        return (
          currentRecord.values[primaryKeyField].value ===
          record.get(primaryKeyField)
        )
      })

      const addressErrors = batchValidations.validatePrimaryUsage(
        filteredRecords,
        primaryKeyField,
        'Address',
        fields,
        record
      )

      // Add phoneErrors to batchErrorsMap using the primary key as the key
      if (addressErrors.length > 0) {
        const primaryKey = record.get(primaryKeyField)
        if (!batchErrorsMap.has(primaryKey)) {
          batchErrorsMap.set(primaryKey, [])
        }
        batchErrorsMap.get(primaryKey).push(...addressErrors)
      }
    }
  })

  // Convert batchErrorsMap to an array of error messages
  const uniqueBatchErrors = Array.from(batchErrorsMap.values()).flat()

  // Log the state of the record after all validations
  console.log(
    `Final state of record after validateBatch (ID: ${
      record.id || 'unknown'
    }):`,
    record
  )

  //console.log('Batch errors detected:', uniqueBatchErrors)
  //console.log('Exiting validateBatch function')
  return uniqueBatchErrors
}

export { validateBatch }
