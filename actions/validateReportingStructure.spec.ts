import { validateReportingStructure } from '../actions/validateReportingStructure'

describe('validateReportingStructure', () => {
  it('should not raise an error if all managers exist as employees', () => {
    const records = [
      {
        id: 'us_rc_12345',
        valid: false,
        values: {
          Applicant_ID: {
            value: '12345',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          Organization_Reference_ID: {
            value: '67890',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          // ...other fields
        },
      },
      {
        id: 'us_rc_67890',
        valid: false,
        values: {
          Applicant_ID: {
            value: '67890',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          Organization_Reference_ID: {
            value: '',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          // ...other fields
        },
      },
    ]

    const reportingErrors = validateReportingStructure(records)

    expect(reportingErrors).toHaveLength(1)
    expect(reportingErrors[0].id).toBe('us_rc_12345')
    expect(
      reportingErrors[0].values.Organization_Reference_ID.messages
    ).toEqual([
      {
        message: 'Manager with ID: 67890 does not exist as an employee',
        source: 'custom-logic',
        type: 'error',
      },
    ])
  })

  it('should identify reporting to non-existing manager', () => {
    const records = [
      {
        id: 'us_rc_12345',
        valid: false,
        values: {
          Applicant_ID: {
            value: '12345',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          Organization_Reference_ID: {
            value: '67890',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          // ...other fields
        },
      },
    ]

    const reportingErrors = validateReportingStructure(records)

    expect(reportingErrors).toHaveLength(1)
    expect(reportingErrors[0].id).toBe('us_rc_12345')
    expect(
      reportingErrors[0].values.Organization_Reference_ID.messages
    ).toEqual([
      {
        message: 'Manager with ID: 67890 does not exist as an employee',
        source: 'custom-logic',
        type: 'error',
      },
    ])
  })

  it('should identify circular dependency errors', () => {
    const records = [
      {
        id: 'us_rc_12345',
        valid: false,
        values: {
          Applicant_ID: {
            value: '12345',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          Organization_Reference_ID: {
            value: '67890',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          // ...other fields
        },
      },
      {
        id: 'us_rc_67890',
        valid: false,
        values: {
          Applicant_ID: {
            value: '67890',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          Organization_Reference_ID: {
            value: '12345',
            valid: true,
            messages: [],
            updatedAt: null,
          },
          // ...other fields
        },
      },
    ]

    const reportingErrors = validateReportingStructure(records)

    expect(reportingErrors).toHaveLength(3)
    expect(reportingErrors[0].id).toBe('us_rc_12345')
    expect(reportingErrors[1].id).toBe('us_rc_12345')
    expect(reportingErrors[2].id).toBe('us_rc_67890')
    expect(reportingErrors[0].values.Applicant_ID.messages).toEqual([
      {
        message: 'Circular dependency detected: 12345 -> 67890 -> 12345',
        source: 'custom-logic',
        type: 'error',
      },
    ])
    expect(reportingErrors[1].values.Applicant_ID.messages).toEqual([
      {
        message: 'Circular dependency detected: 12345 -> 67890 -> 12345',
        source: 'custom-logic',
        type: 'error',
      },
    ])
    expect(reportingErrors[2].values.Applicant_ID.messages).toEqual([
      {
        message: 'Circular dependency detected: 67890 -> 12345 -> 67890',
        source: 'custom-logic',
        type: 'error',
      },
    ])
  })
})
