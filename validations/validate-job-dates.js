import { isNil, isNotNil } from './common/helpers'

// This function validates dates and details related to an employee's job, including the hire date,
// employment end date for temp employees, the job title, and the pay rate type
export const validateJobAndDates = (record) => {
  try {
    // Get relevant fields from record
    const hireDate = record.get('Hire_Date')
    const endEmploymentDate = record.get('End_Employment_Date')
    const code = record.get('Job_Profile_Reference_ID')
    const title = record.get('Job_Title')
    const empType = record.get('Employee_Or_Contingent')
    const terminated = record.get('End_Employment_Date_Reference')
    const payRate = record.get('Pay_Rate_Type_Reference_ID')
    const subType = record.get('Employee_Type_Reference_ID')

    // Error if the termination date occurs before the employment date
    if (isNotNil(endEmploymentDate) && hireDate > endEmploymentDate) {
      const message =
        'The End Employment Date cannot be earlier than the Hire Date'
      record.addError('End_Employment_Date', message)
    }

    // If job title is not provided but code is, get it from the job sheet and add info message
    if (isNil(title) && isNotNil(code)) {
      const linkedJob = record.getLinks('Job_Profile_Reference_ID');
      const jobTitle = linkedJob[0]?.title;
      record.set('Job_Title', jobTitle);
      record.addInfo('Job_Title', 'Title pulled from job profile.');
    }

    // If job title is provided but code is not, get it from the job sheet and add info message
    if (isNil(code) && isNotNil(title)) {
      const linkedJob = record.getLinks('Job_Title');
      const jobCode = linkedJob[0]?.code;
      record.set('Job_Profile_Reference_ID', jobCode);
      record.addInfo('Job_Profile_Reference_ID', 'Code pulled from job profile.');
    }

    // if there is a Job Code and a Job Title, but those do not match to the same code/title pair from the linked Job Profile, surface a warning
    if (isNotNil(code) && isNotNil(title)) {
      const linkedJobfromTitle = record.getLinks('Job_Title');
      const jobCode = linkedJobfromTitle[0]?.code;
      const linkedJobfromCode = record.getLinks('Job_Profile_Reference_ID');
      const jobTitle = linkedJobfromCode[0]?.title;
      if (jobCode !== code || jobTitle !== title) {
        record.addWarning(['Job_Profile_Reference_ID', 'Job_Title'], 'Job code and title match different jobs from the list of codes you previously entered.');
      }
    }

    // Warning + default if contingent worker employee does not have an employment end date
    if (empType === 'CW' || terminated === true) {
      if (isNil(endEmploymentDate)) {
        const message = 'Temp or Terminated Employees must have an Employment End Date, auto-set to 2099-12-31'
        record.addWarning('End_Employment_Date', message);
        record.set('End_Employment_Date', '2099-12-31')
      }
    } else {
      // Error if employment end date is provided for non-temp employee
      if (isNotNil(endEmploymentDate)) {
        const message = 'Employment End Date is only valid for Temp or Terminated Employees'
        record.addError('End_Employment_Date', message)
      }
    }

    // get pay rate from Job Profile and validate against worker data provided
    const codeLookup = record.getLinks('Job_Profile_Reference_ID');
    const payRateFromCode = codeLookup[0]?.pay_rate_type
    if (!payRate) {
      record.set('Pay_Rate_Type_Reference_ID', payRateFromCode)
    } else {
      if (payRate !== payRateFromCode) {
        const message = 'Pay Rate doesn\'t match the pay rate from the linked job code.'
        record.addWarning('Pay_Rate_Type_Reference_ID', message)
      }
    }

    // make sure employee type aligns with subtype
    const cwArray = ['Board_Member','Consultant','Contractor']
    const eeArray = ['Regular','Temporary','Seasonal','Fixed_Term','Intern','Apprentice']
    if (empType === 'CW' && !cwArray.includes(subType)) {
      const message = 'Subtype not valid for Contingent Worker.'
      record.addError('Employee_Type_Reference_ID', message)
    } 
    if (empType === 'EE' && !eeArray.includes(subType)) {
      const message = 'Subtype not valid for Employee.'
      record.addError('Employee_Type_Reference_ID', message)
    }

  } catch (err) {
    // If an error occurs during execution of the function, add an error message to the record with the error details
    console.error(err)
    record.addError('Applicant_ID', `An error occurred: ${err.message}`)
  }
}