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

export const companiesMetadata = {
  serviceName: 'Get_Company_Organizations', // Name of the SOAP service to call
  // SOAP endpoint to send requests to
  soapEndpoint:
    'https://wd2-impl-services1.workday.com/ccx/service/flatfile_dpt1/Financial_Management/v41.0',
  soapNamespace: 'urn:com.workday/bsvc', // SOAP namespace used in the service
  version: 'v41.0', // Version of the SOAP service
  requestReferences: {
    companyReference: 'Company_Reference', // Reference for the company
    id: ['ID', 'type'], // Keys for the id field
  },
  responseFilter: {
    asOfEffectiveDate: 'As_Of_Effective_Date', // Filter for the effective date
    asOfEntryDateTime: 'As_Of_Entry_DateTime', // Filter for the entry datetime
    pageTag: 'Page', // Tag that contains the page number in the response
    countTag: 'Count', // Tag that contains the count of records in the response
  },
  responseParseKeys: {
    responseData: 'wd:Response_Data', // Key to extract the response data
    data: 'wd:Company_Organization', // Key to extract the actual data
    id: ['wd:Company_Reference', 'wd:ID', 1, '_'], // Keys to extract the id field
    name: [
      'wd:Company_Organization_Data',
      'wd:Organization_Data',
      'wd:Organization_Name',
    ], // Keys to extract the name field
  },
}

export const jobsMetadata = {
  serviceName: 'Get_Job_Profiles', // Name of the SOAP service to call
  // SOAP endpoint to send requests to
  soapEndpoint:
    'https://wd2-impl-services1.workday.com/ccx/service/flatfile_dpt1/Human_Resources/v41.0',
  soapNamespace: 'urn:com.workday/bsvc', // SOAP namespace used in the service
  version: 'v41.0', // Version of the SOAP service
  requestReferences: {
    jobProfileReference: 'Job_Profile_Reference', // Reference for the job profile
    id: ['ID', 'type'], // Keys for the id field
  },
  responseFilter: {
    asOfEffectiveDate: 'As_Of_Effective_Date', // Filter for the effective date
    asOfEntryDateTime: 'As_Of_Entry_DateTime', // Filter for the entry datetime
    pageTag: 'Page', // Tag that contains the page number in the response
    countTag: 'Count', // Tag that contains the count of records in the response
  },
  responseParseKeys: {
    responseData: 'wd:Response_Data', // Key to extract the response data
    data: 'wd:Job_Profile', // Key to extract the actual data
    jobCode: ['wd:Job_Profile_Data', 'wd:Job_Code'], // Keys to extract the job code field
    jobTitle: [
      'wd:Job_Profile_Data',
      'wd:Job_Profile_Basic_Data',
      'wd:Job_Title',
    ], // Keys to extract the job title field
    jobClassification: [
      'wd:Job_Profile_Data',
      'wd:Job_Classification_Data',
      'wd:Job_Classifications_Reference',
      'wd:ID',
      1,
      '_',
    ],
    jobPayRate: [
      'wd:Job_Profile_Data',
      'wd:Job_Profile_Pay_Rate_Data',
      'wd:Pay_Rate_Type_Reference',
      'wd:ID',
      1,
      '_',
    ], // Keys to extract the job pay rate field
  },
}
