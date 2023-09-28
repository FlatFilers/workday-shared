// Importing necessary modules and objects
import moment from 'moment';
import { momentFormats } from './dateFormats';
import { blueprint } from '../../blueprint/blueprint';

// A helper function to format the given date string
function formatDate(dateString) {
  // Check if the date string is already in 'yyyy-MM-dd' format
  if (
    dateString.length === 10 &&
    moment(dateString, 'YYYY-MM-DD', true).isValid()
  ) {
    return dateString;
  }

  // Check if the date string is in 'MMDDYYYY' format
  if (
    dateString.length === 8 &&
    moment(dateString, 'MMDDYYYY', true).isValid()
  ) {
    // Format the date string as 'yyyy-MM-dd'
    return moment(dateString, 'MMDDYYYY').format('YYYY-MM-DD');
  }
  if (
    dateString.length > 8 &&
    dateString.includes('T')
  ) {
    // Format the date string as 'yyyy-MM-dd'
    return dateString.split('T')[0]
    // return moment(dateString2, 'YYYY-MM-DD').format('YYYY-MM-DD');
  }

  // Iterate through all possible date formats and try to parse the date string
  for (const format of momentFormats) {
    const momentDate = moment(dateString, format, true);
    if (momentDate.isValid()) {
      // If the date string is successfully parsed, format it as 'yyyy-MM-dd'
      return momentDate.format('YYYY-MM-DD');
    }
  }

  // If none of the above cases match, return 'Invalid Date'
  return 'Invalid Date';
}

// A function to format all date fields of a record
function formatRecordDates(record, sheetSlug) {
  // Find the sheet with the given slug from the blueprint sheets
  const sheet = blueprint.find((sheet) => sheet.slug === sheetSlug);
  // Get an array of keys for all fields with type 'date'
  const dateFields = sheet.fields
    .filter((field) => field.type === 'date')
    .map((field) => field.key);

  // Loop through all date fields of the record
  dateFields.forEach((dateField) => {
    // Get the current value of the date field
    const inputDate = record.get(dateField);

    // Check if the current value is a non-empty string
    if (typeof inputDate === 'string' && inputDate.trim().length > 0) {
      // Format the date string using the helper function formatDate
      const formattedDate = formatDate(inputDate.trim());

      // If the formatted date is invalid, add an error to the record
      if (formattedDate === 'Invalid Date') {
        console.log('Invalid Date');
        record.addError(
          dateField,
          'Please check that the date is in yyyy-MM-dd format.'
        );
      }
      // If the formatted date is different from the original value, update the record
      else if (formattedDate !== inputDate.trim()) {
        console.log(formattedDate);
        record.set(dateField, formattedDate);
        record.addComment(dateField, 'Date has been formatted as yyyy-MM-dd');
      }
    } else if (typeof inputDate === 'string' && !inputDate.trim().length) {
      // Skip validation if the current value is an empty string
      return;
    }
  });
}

// Export the formatRecordDates function for use in other modules
export { formatRecordDates };