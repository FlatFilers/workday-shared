import * as batchValidations from './batchValidations'
import * as batchFieldRules from './batchFieldRules'

function validateBatch(record, fields, primaryKeyField, recordsForValidation) {
  const batchErrorsMap = new Map()

  fields.forEach((field) => {
    const fieldRules = [
      { type: 'Phone', func: batchFieldRules.shouldValidatePrimaryUsage },
      { type: 'Email', func: batchFieldRules.shouldValidatePrimaryUsage },
      { type: 'Address', func: batchFieldRules.shouldValidatePrimaryUsage },
    ]

    for (const rule of fieldRules) {
      if (rule.func(field, rule.type)) {
        const filteredRecords = recordsForValidation.filter((currentRecord) => {
          return (
            currentRecord.values[primaryKeyField].value ===
            record.get(primaryKeyField)
          )
        })

        const errors = batchValidations.validatePrimaryUsage(
          filteredRecords,
          primaryKeyField,
          rule.type,
          fields
        )

        if (errors.length > 0) {
          const primaryKey = record.get(primaryKeyField)
          if (!batchErrorsMap.has(primaryKey)) {
            batchErrorsMap.set(primaryKey, [])
          }
          batchErrorsMap.get(primaryKey).push(...errors)
        }
      }
    }
  })

  const uniqueBatchErrors = Array.from(batchErrorsMap.values()).flat()

  uniqueBatchErrors.forEach((error) => {
    record.addError(error.field, error.message)
  })

  return uniqueBatchErrors
}

export { validateBatch }
