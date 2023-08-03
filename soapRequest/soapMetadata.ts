// Metadata for fetching location data
export const locationsMetadata = {
  serviceName: 'Get_Locations', // Name of the SOAP service to call
  // SOAP endpoint to send requests to
  soapEndpoint:
    'https://wd2-impl-services1.workday.com/ccx/service/flatfile_dpt1/Human_Resources/v41.0',
  soapNamespace: 'urn:com.workday/bsvc', // SOAP namespace used in the service
  version: 'v40.1', // Version of the SOAP service
  responseFilter: {
    pageTag: 'Page', // Tag that contains the page number in the response
    countTag: 'Count', // Tag that contains the count of records in the response
  },
  responseParseKeys: {
    responseData: 'wd:Response_Data', // Key to extract the response data
    data: 'wd:Location', // Key to extract the actual data
    id: ['wd:Location_Reference', 'wd:ID', 1, '_'], // Keys to extract the id field
    name: ['wd:Location_Data', 'wd:Location_Name'], // Keys to extract the name field
  },
}

// Metadata for fetching cost center data
export const costCentersMetadata = {
  serviceName: 'Get_Cost_Centers', // Name of the SOAP service to call
  // SOAP endpoint to send requests to
  soapEndpoint:
    'https://wd2-impl-services1.workday.com/ccx/service/flatfile_dpt1/Financial_Management/v41.0',
  soapNamespace: 'urn:com.workday/bsvc', // SOAP namespace used in the service
  version: 'v41.0', // Version of the SOAP service
  responseFilter: {
    asOfEffectiveDate: 'As_Of_Effective_Date', // Filter for the effective date
    asOfEntryDateTime: 'As_Of_Entry_DateTime', // Filter for the entry datetime
    pageTag: 'Page', // Tag that contains the page number in the response
    countTag: 'Count', // Tag that contains the count of records in the response
  },
  requestReferences: {
    costCenterReference: 'Cost_Center_Reference', // Reference for the cost center
    id: ['ID', 'type'], // Keys for the id field
  },
  requestCriteria: {
    updatedFromDate: 'Updated_From_Date', // Criteria for the updated from date
    updatedToDate: 'Updated_To_Date', // Criteria for the updated to date
  },
  responseGroup: {
    includeReference: 'Include_Reference', // Group that includes the reference
    includeCostCenterData: 'Include_Cost_Center_Data', // Group that includes the cost center data
    includeSimpleCostCenterData: 'Include_Simple_Cost_Center_Data', // Group that includes the simple cost center data
  },
  responseParseKeys: {
    responseData: 'wd:Response_Data', // Key to extract the response data
    data: 'wd:Cost_Center', // Key to extract the actual data
    id: ['wd:Cost_Center_Reference', 'wd:ID', 1, '_'], // Keys to extract the id field
    name: [
      // Keys to extract the name field
      'wd:Cost_Center_Data',
      'wd:Organization_Data',
      'wd:Organization_Name',
    ],
  },
}
