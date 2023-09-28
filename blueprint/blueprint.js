export const blueprint = [
  {
    name: 'Worker Data',
    slug: 'workers',
    fields: [
      {
        key: 'Active',
        label: 'Active',
        type: 'boolean',
        description: 'Is the Worker Active?',
        constraints: [{ type: 'required' }],
      },

      {
        key: 'Applicant_ID',
        label: 'Worker ID',
        type: 'string',
        description: "This is the worker's identification number in Workday.",
        constraints: [{ type: 'required', type: 'unique', primary: true }],
      },
      {
        key: 'COUNTRY',
        label: 'Country',
        type: 'enum',
        description:
          'Populate this column with "United State of America" for each worker. Do not abbreviate.',
        config: {
          options: [
            { value: 'USA', label: 'United States of America' },
            { value: 'XXX', label: 'Other' },
          ],
        },
        constraints: [{ type: 'required' }],
      },
      {
        // no key was listed for this in the generator table
        key: 'Legal_Full_Name',
        label: 'Worker Full Name',
        type: 'string',
        description:
          'This field should auto populate as First Name, Middle Name, and Last Name are entered into those columns.',
        // compile from combining F/M/L name in data hook
        // made this editable / mappable for name splitting
      },
      {
        // no key was listed for this in the generator table
        key: 'Preferred_Name',
        label: 'Preferred First Name',
        type: 'string',
        description:
          'If the worker goes by a first name other than their legal one, list it here.',
      },
      {
        key: 'Legal_First_Name',
        label: 'First Name',
        type: 'string',
        description: "Provide the worker's legal first name.",
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Legal_Middle_Name',
        label: 'Middle Name',
        type: 'string',
        description:
          "Please provide the worker's middle name. This is an optional field.",
      },
      {
        key: 'Legal_Last_Name',
        label: 'Last Name',
        type: 'string',
        description: "Provide the worker's legal last name.",
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Email_Address',
        label: 'Email (Work)',
        type: 'string',
        description:
          "Please populate this column with each worker's work email address. Make sure to enter the entire email in a standard email format. (ex. joe.brown@company.com).",
        constraints: [{ type: 'required', type: 'unique' }],
      },
      {
        key: 'Employee_Or_Contingent',
        label: 'Worker Type',
        type: 'enum',
        description:
          'Choose a value from the dropdown menu. Select "Employee" if the worker is paid by your company. Select "Contingent Worker" if the worker is a contracted worker that is not paid by your company.',
        config: {
          options: [
            { value: 'EE', label: 'Employee' },
            { value: 'CW', label: 'Contingent Worker' },
          ],
        },
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Employee_Type_Reference_ID',
        label: 'Worker Subtype',
        type: 'enum',
        description:
          'Choose a value from the dropdown menu. If the SubType has "(with End Date)" in the name, then an end date should be provided in the "Termination/Contract End Date" column.',
        config: {
          options: [
            { value: 'Regular', label: 'Regular' },
            { value: 'Temporary', label: 'Temporary' },
            { value: 'Seasonal', label: 'Seasonal (with End Date)' },
            { value: 'Fixed_Term', label: 'Fixed Term (with End Date)' },
            { value: 'Intern', label: 'Intern (with End Date)' },
            { value: 'Apprentice', label: 'Apprentice (with End Date)' },
            { value: 'Board_Member', label: 'Board Member' },
            { value: 'Consultant', label: 'Consultant' },
            { value: 'Contractor', label: 'Contractor' },
          ],
        },
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Hire_Date',
        label: 'Start Date',
        type: 'date',
        description: 'Provide the worker"s latest date of hire.',
        constraints: [{ type: 'required' }],
        metadata: {
          validateAs: 'date',
        },
      },
      {
        key: 'End_Employment_Date_Reference',
        label: 'Terminated',
        type: 'boolean',
        description: 'Indicate if the worker has been terminated.',
      },
      {
        key: 'End_Employment_Date',
        label: 'Termination/Contract End Date',
        type: 'date',
        description:
          'If the worker has been indicated as Terminated OR they are a contingent worker, a date for end of employemt should be provided here. If none is provided, an end date of 12-31-2099 will be defaulted in and can be manually fixed after loading.',
        metadata: {
          validateAs: 'date',
        },
      },
      {
        key: 'Organization_Reference_ID',
        label: 'Manager ID',
        type: 'reference',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'workers',
          key: 'Applicant_ID',
          relationship: 'has-one',
        },
      },
      {
        key: 'Organization_Descriptor',
        label: 'Manager Name',
        type: 'string',
        readonly: true,
        // this will get set via data hook
      },
      {
        key: 'Job_Profile_Reference_ID',
        label: 'Job Profile',
        type: 'reference',
        description:
          'Choose a job profile from the dropdown menu. The menu consists of Job Profiles you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'jobs',
          key: 'code',
          relationship: 'has-one',
        },
      },
      {
        key: 'Job_Title',
        label: 'Job Title',
        type: 'reference',
        description:
          'Choose a job profile from the dropdown menu. The menu consists of Job Profiles you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'jobs',
          key: 'title',
          relationship: 'has-one',
        },
      },
      {
        // no key was listed for this in the generator table
        key: 'Business_Title',
        label: 'Business Title',
        type: 'string',
      },
      {
        key: 'Position_Time_Type_Reference_ID',
        label: 'Time Type',
        type: 'enum',
        description:
          'Enter whether the worker is a full time worker or part time worker',
        config: {
          options: [
            { value: 'Full_time', label: 'Full time' },
            { value: 'Part_time', label: 'Part time' },
          ],
        },
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Company_Assignments_Reference_ID',
        label: 'Company Name',
        type: 'reference',
        description:
          'Choose a Company from the dropdown menu. The menu consists of Company/Companies you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'companies',
          key: 'name',
          relationship: 'has-one',
        },
        // reference Companies created prior in the process
      },
      {
        key: 'Location_Reference_ID',
        label: 'Location ID',
        type: 'reference',
        description:
          'Choose a Location from the dropdown menu. The menu consists of Locations you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'locations',
          key: 'id',
          relationship: 'has-one',
        },
      },
      {
        key: 'Location_Reference_ID_Name',
        label: 'Location Name',
        type: 'reference',
        description:
          'Choose a Location from the dropdown menu. The menu consists of Locations you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'locations',
          key: 'name',
          relationship: 'has-one',
        },
      },
      {
        key: 'Cost_Center_Assignments_Reference_ID',
        label: 'Cost Center Name',
        type: 'reference',
        description:
          'Choose a Cost Center from the dropdown menu. The menu consists of Cost Centers you entered into the tenant during an earlier journey.',
        constraints: [{ type: 'required' }],
        config: {
          ref: 'cost_centers',
          key: 'name',
          relationship: 'has-one',
        },
      },
      {
        key: 'Pay_Rate_Type_Reference_ID',
        label: 'Pay Rate Type',
        type: 'enum',
        description: 'Indicated if the worker is paid hourly or is on salary.',
        config: {
          options: [
            { value: 'Hourly', label: 'Hourly' },
            { value: 'Salary', label: 'Salary' },
          ],
        },
        constraints: [{ type: 'required' }],
        // Potential data hook: if this is blank and Compensation_Grade_Reference has a value, set to Compensation_Grade_Reference
      },
      {
        key: 'Compensation_Grade_Reference',
        label: 'Compensation Grade',
        type: 'enum',
        description:
          'Choose a Comp Grade from the dropdown menu. The menu consists of Comp Grades you entered into the tenant during an earlier journey.',
        config: {
          options: [
            { value: 'Salary', label: 'Salary' },
            { value: 'Hourly', label: 'Hourly' },
          ],
        },
        constraints: [{ type: 'required' }],
        // Potential data hook: if this is blank and Pay_Rate_Type_Reference_ID has a value, set to Pay_Rate_Type_Reference_ID
      },
      {
        // no key was listed for this in the generator table
        key: 'Scheduled_Weekly_Hours',
        label: 'Scheduled Weekly Hours',
        type: 'number',
        description: "Enter the worker's scheduled weekly hours",
        constraints: [{ type: 'required' }],
      },
      {
        key: 'hourly_rate',
        label: 'Hourly Rate',
        type: 'string',
        description: 'Enter the hourly rate for hourly workers',
      },
      {
        key: 'salary',
        label: 'Salary',
        type: 'number',
        description: 'Enter the salary for salaried workers',
      },
      {
        key: 'Compensation_Element_Amount',
        label: 'Compensation Rate',
        type: 'string',
        readonly: true,
        description:
          "Enter the worker's compensation rate. Enter the hourly rate for hourly workers and the annual salary for salaried workers.",
        constraints: [{ type: 'required' }],
      },
      {
        key: 'User_Name',
        label: 'WD Login UserName',
        type: 'string',
        description:
          'Enter the username that the worker will use to log into Workday.',
        constraints: [{ type: 'required' }],
      },
      {
        key: 'Password',
        label: 'WD Login Password',
        type: 'string',
        description:
          'Enter the password that the worker will use to log into Workday.',
        constraints: [{ type: 'required' }],
        metadata: {
          validateAs: 'complexPwd',
        },
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'EMAIL_REFERENCE_HOME',
        label: 'Email (H)',
        type: 'string',
        description: "The worker's home email can be entered here.",
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'PHONE_REFERENCE_HOME',
        label: 'Phone (H)',
        type: 'string',
        description: "The worker's home phone number can be entered here.",
        // potential data hook: validate phone number
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_COUNTRY',
        label: 'Address Country (H)',
        type: 'enum',
        description:
          'If the worker\'s home address is being provided in the next several columns, enter "United States of America" in this column. Leave it blank if an address is not being provided at this time.',
        config: {
          options: [
            { value: 'USA', label: 'United States of America' },
            { value: 'XXX', label: 'Other' },
          ],
        },
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_REGION',
        label: 'Address State/Prov (H)',
        type: 'enum',
        description:
          "Enter the worker's home address state. Make sure that the value input matched what is available in the dropdown menu of the cell.",
        config: {
          options: [
            { value: 'USA-AL', label: 'Alabama' },
            { value: 'USA-AK', label: 'Alaska' },
            { value: 'USA-AS', label: 'American Samoa' },
            { value: 'USA-AZ', label: 'Arizona' },
            { value: 'USA-AR', label: 'Arkansas' },
            { value: 'USA-CA', label: 'California' },
            { value: 'USA-CO', label: 'Colorado' },
            { value: 'USA-CT', label: 'Connecticut' },
            { value: 'USA-DE', label: 'Delaware' },
            { value: 'USA-DC', label: 'District of Columbia' },
            { value: 'USA-FL', label: 'Florida' },
            { value: 'USA-GA', label: 'Georgia' },
            { value: 'USA-GU', label: 'Guam' },
            { value: 'USA-HI', label: 'Hawaii' },
            { value: 'USA-ID', label: 'Idaho' },
            { value: 'USA-IL', label: 'Illinois' },
            { value: 'USA-IN', label: 'Indiana' },
            { value: 'USA-IA', label: 'Iowa' },
            { value: 'USA-KS', label: 'Kansas' },
            { value: 'USA-KY', label: 'Kentucky' },
            { value: 'USA-LA', label: 'Louisiana' },
            { value: 'USA-ME', label: 'Maine' },
            { value: 'USA-MD', label: 'Maryland' },
            { value: 'USA-MA', label: 'Massachusetts' },
            { value: 'USA-MI', label: 'Michigan' },
            { value: 'USA-MN', label: 'Minnesota' },
            { value: 'USA-MS', label: 'Mississippi' },
            { value: 'USA-MO', label: 'Missouri' },
            { value: 'USA-MT', label: 'Montana' },
            { value: 'USA-NE', label: 'Nebraska' },
            { value: 'USA-NV', label: 'Nevada' },
            { value: 'USA-NH', label: 'New Hampshire' },
            { value: 'USA-NJ', label: 'New Jersey' },
            { value: 'USA-NM', label: 'New Mexico' },
            { value: 'USA-NY', label: 'New York' },
            { value: 'USA-NC', label: 'North Carolina' },
            { value: 'USA-ND', label: 'North Dakota' },
            { value: 'USA-MP', label: 'Northern Mariana Islands' },
            { value: 'USA-OH', label: 'Ohio' },
            { value: 'USA-OK', label: 'Oklahoma' },
            { value: 'USA-OR', label: 'Oregon' },
            { value: 'USA-PA', label: 'Pennsylvania' },
            { value: 'USA-PR', label: 'Puerto Rico' },
            { value: 'USA-RI', label: 'Rhode Island' },
            { value: 'USA-SC', label: 'South Carolina' },
            { value: 'USA-SD', label: 'South Dakota' },
            { value: 'USA-TN', label: 'Tennessee' },
            { value: 'USA-TX', label: 'Texas' },
            { value: 'USA-UT', label: 'Utah' },
            { value: 'USA-VT', label: 'Vermont' },
            { value: 'USA-VI', label: 'Virgin Islands, U.S.' },
            { value: 'USA-VA', label: 'Virginia' },
            { value: 'USA-WA', label: 'Washington' },
            { value: 'USA-WV', label: 'West Virginia' },
            { value: 'USA-WI', label: 'Wisconsin' },
            { value: 'USA-WY', label: 'Wyoming' },
          ],
        },
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_ZIP',
        label: 'Address Zip/Postal (H)',
        type: 'string',
        description: "Enter the worker's home address zipcode.",
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_CITY',
        label: 'Address City (H)',
        type: 'string',
        description: "Enter the worker's home address city.",
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_LINE_1',
        label: 'Address Line 1 (H)',
        type: 'string',
        description: "Enter the worker's home address line 1.",
      },
      {
        // I think this is how the key is built based on the generator table
        key: 'ADDRESS_LINE_2',
        label: 'Address Line 2 (H)',
        type: 'string',
        description: "Enter the worker's home address line 2.",
      },
      {
        key: 'Marital_Status_ID',
        label: 'Marital Status',
        type: 'enum',
        description: "Enter the worker's marital status.",
        config: {
          options: [
            { value: 'USA_Married', label: 'Married' },
            { value: 'USA_Single', label: 'Single' },
            { value: 'USA_Divorced', label: 'Divorced' },
            { value: 'USA_Partnered', label: 'Partnered' },
            { value: 'USA_Separated', label: 'Separated' },
            { value: 'USA_Widowed', label: 'Widowed' },
          ],
        },
      },
      {
        key: 'Gender_Code',
        label: 'Gender',
        type: 'enum',
        description: "Enter the Worker's gender",
        config: {
          options: [
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Not_declared', label: 'Not declared' },
          ],
        },
      },
      {
        // no key was listed for this in the generator table
        key: 'Date_Of_Birth',
        label: 'Birth Date (YYYY-MM-DD)',
        type: 'date',
        description:
          'Enter the worker\'s date of birth formatted as "yyyy-mm-dd".',
        constraints: [{ type: 'required' }],
        metadata: {
          validateAs: 'date',
        },
      },
      {
        key: 'USA_National_ID_Country_Ref_12345_ID',
        label: 'Social Security Number',
        type: 'string',
        description:
          'Enter the worker\'s social security number formatted as "xxx-xx-xxxx".',
        constraints: [{ type: 'required' }],
        // formatting will be checked via data hook
      },
    ],
    actions: [
      {
        //dedupe on worker ID button
        operation: 'dedupeWorkers',
        mode: 'foreground',
        label: 'Merge Worker records',
        description:
          'This will merge duplicate worker IDs together, retaining the most recent value',
        primary: false,
      },
      {
        //validate reporting structure
        operation: 'validateReportingStructure',
        mode: 'background',
        label: 'Validate Reporting Structure',
        description: 'Validates the Employee to Manager reporting structure',
        primary: false,
      },
      {
        //build supervisory organization structure
        operation: 'buildSupOrgStructure',
        mode: 'background',
        label: 'Build Supervisory Org Structure',
        description:
          'Builds the Employee to Manager reporting structure in Supervisory Orgs sheet',
        primary: false,
      },
    ],
  },
  {
    name: 'Supervisory Orgs',
    slug: 'orgs',
    access: ['add', 'edit', 'delete'],
    fields: [
      {
        key: 'code',
        label: 'Sup Org Code',
        type: 'string',
      },
      {
        key: 'manager_name',
        label: 'Sup Org Manager Name',
        type: 'string',
      },
      {
        key: 'manager_id',
        label: 'Sup Org Manager ID',
        type: 'string',
      },
      {
        key: 'manager_position',
        label: 'Sup Org Manager Position ID',
        type: 'string',
      },
      {
        key: 'location',
        label: 'Sup Org Location',
        type: 'string',
      },
      {
        key: 'superior_code',
        label: 'Superior Sup Org Code',
        type: 'string',
      },
    ],
  },
  {
    name: 'Companies',
    slug: 'companies',
    access: [],
    fields: [
      {
        key: 'id',
        label: 'Company ID',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
      {
        key: 'name',
        label: 'Company Name',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
    ],
  },
  {
    name: 'Locations',
    slug: 'locations',
    access: [],
    fields: [
      {
        key: 'id',
        label: 'Location ID',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
      {
        key: 'name',
        label: 'Location Name',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
    ],
  },
  {
    name: 'Cost Centers',
    slug: 'cost_centers',
    access: [],
    fields: [
      {
        key: 'id',
        label: 'Cost Center ID',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
      {
        key: 'name',
        label: 'Cost Center Name',
        type: 'string',
        constraints: [{ type: 'unique' }],
      },
    ],
  },
  {
    name: 'Job Codes',
    slug: 'jobs',
    access: [],
    fields: [
      {
        key: 'code',
        label: 'Job Code',
        type: 'string',
        constraints: [{ type: 'unique', primary: true }],
      },
      {
        key: 'title',
        label: 'Job Title',
        type: 'string',
      },
      {
        key: 'department',
        label: 'Department',
        type: 'string',
      },
      {
        key: 'classification',
        label: 'Classification',
        type: 'string',
      },
      {
        key: 'pay_rate_type',
        label: 'Pay Rate Type',
        type: 'string',
      },
    ],
  },
]

// Step 1: Create a reusable function
function addActionsToSheet(sheet) {
  if (!sheet.actions) {
    sheet.actions = []
  }

  // Define the actions you want to add based on the sheet's name
  const actionToAdd = {
    operation: `refresh${sheet.name.replace(/\s+/g, '')}Data`, // e.g., "refreshCompaniesData"
    mode: 'background',
    label: `Refresh ${sheet.name} Data from Workday`, // e.g., "Refresh Companies Data from Workday"
    description: `Refreshes ${sheet.name} sheet with values from Workday tenant`,
    primary: true,
  }

  // Merge the existing actions with the new one, avoiding duplicates.
  if (!sheet.actions.some((a) => a.operation === actionToAdd.operation)) {
    sheet.actions.push(actionToAdd)
  }
}

// Iterate through the blueprint
for (const sheet of blueprint) {
  // Check the access property
  if (Array.isArray(sheet.access) && sheet.access.length === 0) {
    // Use the function to add the actions
    addActionsToSheet(sheet)
  }
}
