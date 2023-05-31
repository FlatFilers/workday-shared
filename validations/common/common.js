const { isNotNil } = require('../common/helpers');

/**
Performs a vlookup-like operation on a record by retrieving a value from a linked record
and setting it to a target field on the original record. The linked record is specified
by a reference field on the original record, and the lookup value is specified by a
lookup field on the linked record. If a lookup value is found, it is set to the target
field on the original record and an info message is added to the record indicating
the source of the value.
@param {Object} record - The record to perform the vlookup on.
@param {string} referenceFieldKey - The name of the reference field on the original record
that links to the linked record.
@param {string} lookupFieldKey - The name of the field on the linked record that contains
the value to be looked up.
@param {string} targetFieldKey - The name of the field on the original record that the
lookup value should be set to.
*/
const vlookup = (record, referenceFieldKey, lookupFieldKey, targetFieldKey) => {
  console.log('Initial Record: ' + JSON.stringify(record));
  const links = record.getLinks(referenceFieldKey);
  console.log('Linked Record: ' + JSON.stringify(links));
  const lookupValue = links?.[0]?.[lookupFieldKey];
  console.log(
    'Reference Fields Key: ' +
      referenceFieldKey +
      ' : ' +
      'LookUpValue: ' +
      lookupValue
  );

  if (isNotNil(lookupValue)) {
    record.set(targetFieldKey, lookupValue);
    record.addInfo(
      targetFieldKey,
      `${targetFieldKey} set based on ${referenceFieldKey}.`
    );
  }
};

// Export Values
module.exports = { vlookup };