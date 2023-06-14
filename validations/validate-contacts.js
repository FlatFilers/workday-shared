// checks format of contact info
// potential extensions: address validation, phone validations, birthdate

import EmailValidator from 'email-validator'
import { isNotNil, isNil } from './common/helpers'

const validateContactInfo = (record) => {
  // work email validation
  try {
    const emailAddress = record.get('Email_Address')

    if (isNotNil(emailAddress)) {
      // Use the EmailValidator library to check if the email address is in a valid format
      const isValid = EmailValidator.validate(emailAddress)

      // If the email address is not valid, add an error message to the record
      if (!isValid) {
        record.addError(
          'Email_Address',
          "Email addresses must be in the format of 'xxx@yy.com'. Valid examples: john.doe@aol.com, jane@aol.com."
        )
      }
    } else {
      // If the email address is null or undefined, add a warning message to the record indicating that the field is recommended
      record.addError('Email_Address', 'Work Email Address is required.')
    }
  } catch (error) {
    // If an exception occurs during execution of the function, add an error message to the record with the error details
    record.addError(
      'Email_Address',
      `Error validating contact information: ${error.message}`
    )
  }
  // contact email validation
  try {
    const personalEmail = record.get('EMAIL_REFERENCE_HOME')

    if (isNotNil(personalEmail)) {
      // Use the EmailValidator library to check if the email address is in a valid format
      const isValid = EmailValidator.validate(personalEmail)

      // If the email address is not valid, add an error message to the record
      if (!isValid) {
        record.addError(
          'EMAIL_REFERENCE_HOME',
          "Email addresses must be in the format of 'xxx@yy.com'. Valid examples: john.doe@aol.com, jane@aol.com."
        )
      }
    } else {
      // If the email address is null or undefined, add a warning message to the record indicating that the field is recommended
      record.addInfo(
        'EMAIL_REFERENCE_HOME',
        'Home Email Address is not required but it is preferred.'
      )
    }
  } catch (error) {
    // If an exception occurs during execution of the function, add an error message to the record with the error details
    record.addError(
      'EMAIL_REFERENCE_HOME',
      `Error validating contact information: ${error.message}`
    )
  }
}

export default validateContactInfo
