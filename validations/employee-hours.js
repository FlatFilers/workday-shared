import { isNil, isNotNil } from './common/helpers'

export const employeeHours = (record) => {
  try {
    const empType = record.get('employeeType')
    const defHours = record.get('defaultWeeklyHours')
    const schedHours = record.get('scheduledWeeklyHours')
    const message = 'Scheduled Weekly Hours calculated based on Employee Type'

    if (typeof schedHours === 'number' && isNotNil(schedHours)) {
      if (schedHours > 168) {
        record.addError(
          'scheduledWeeklyHours',
          'Scheduled Hours cannot exceed 168 hours'
        )
      }
    }

    if (typeof defHours === 'number' && isNotNil(defHours)) {
      if (defHours > 168) {
        record.addError(
          'defaultWeeklyHours',
          'Default Weekly Hours cannot exceed 168 hours'
        )
      }
    }

    if (schedHours > defHours && schedHours <= 168) {
      record.addWarning(
        'scheduledWeeklyHours',
        'Scheduled Hours exceeds Default Hours'
      )
    }

    if (isNil(schedHours) && empType === 'ft') {
      record.set('scheduledWeeklyHours', 40)
      record.addInfo('scheduledWeeklyHours', message)
    }

    if (isNil(schedHours) && empType === 'pt') {
      record.set('scheduledWeeklyHours', 20)
      record.addInfo('scheduledWeeklyHours', message)
    }

    if (isNil(schedHours) && empType === 'tm') {
      record.set('scheduledWeeklyHours', 40)
      record.addInfo('scheduledWeeklyHours', message)
    }

    if (isNil(schedHours) && empType === 'ct') {
      record.set('scheduledWeeklyHours', 0)
      record.addInfo('scheduledWeeklyHours', message)
    }

    if (
      typeof defHours === 'number' &&
      isNotNil(defHours) &&
      typeof schedHours === 'number' &&
      isNotNil(schedHours)
    ) {
      const fte = schedHours / defHours

      if (fte > 999) {
        record.addError(
          'scheduledWeeklyHours',
          `FTE must be 999 or less. FTE is calculated by dividing Scheduled Weekly Hours by Default Weekly Hours. Current FTE is ${fte}.`
        )
      }
    }
  } catch (error) {
    console.error(error)
    record.addError(
      'Applicant_ID',
      `An error occurred while validating employee hours: ${error.message}`
    )
  }
}