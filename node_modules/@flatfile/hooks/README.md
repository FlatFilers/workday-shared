# @flatfile/hooks

### FlatfileRecord

The `FlatfileRecord` class represents a record with methods for manipulating and retrieving field values, metadata, and handling record information such as errors, warnings, and comments. Overall, it provides a convenient way to work with individual records of data and perform operations on them.

- FlatfileRecord has various getter and setter methods for accessing and modifying the record's data.
- It also provides methods for adding information, comments, errors, and warnings to the record.
- The compute, computeIfPresent, and validate methods perform computations and validations on specific fields of the record.
- The toJSON method returns a JSON representation of the record with associated information.

### FlatfileRecords

The `FlatfileRecords` class represents a collection of `FlatfileRecord` instances. It takes an array of raw records (IRawRecord) as input and creates an array of `FlatfileRecord` objects by mapping each raw record to a `FlatfileRecord` instance. The `FlatfileRecords` class provides a records property to access the array of records and a toJSON method that converts the collection of records to JSON format by calling the toJSON method on each individual `FlatfileRecord`.

### FlatfileSession

The `FlatfileSession` class encapsulates an instance of the IPayload interface. It has various getter methods that allow accessing different properties of the payload.

- workspaceId: Retrieves the workspace ID from the payload.
- workbookId: Retrieves the workbook ID from the payload.
- schemaId: Retrieves the schema ID from the payload.
- schemaSlug: Retrieves the schema slug from the payload.
- uploads: Retrieves the uploads array from the payload.
- endUser: Retrieves the endUser object from the payload.
- rows: Retrieves the rows array from the payload.
- env: Retrieves the env object from the payload.
- envSignature: Retrieves the envSignature value from the payload.

By creating an instance of the `FlatfileSession` class with a payload, you can conveniently access the payload properties using the provided getter methods.

### Get started

`FlatfileRecord` is now folded into the [@flatfile/plugin-record-hook](https://flatfile.com/docs/plugins/transform/record-hook) and most commonly used there.
