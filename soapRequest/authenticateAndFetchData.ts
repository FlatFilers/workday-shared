const axios = require('axios')
const xml2js = require('xml2js')
import api from '@flatfile/api'
require('dotenv').config()

// Function to authenticate and fetch data
async function authenticateAndFetchData(spaceId, metadata) {
  const pageSize = 100 // Number of records to retrieve per page
  let offset = 0 // Initial offset
  const allData = [] // Array to store all data
  const space = await api.spaces.get(spaceId)
  // const { username, password, tenantUrl } = space.data.metadata?.creds
  const username = "cfrederickson-impl";
  const password = "ezx2XDM@zdj.rgy-jqd";
  const tenantUrl = "flatfile_dpt1";


  try {
    while (true) {
      console.log(`Fetching data with offset: ${offset}`)

      console.log(
        'Step 1: Building the SOAP request payload for authentication'
      )
      const soapNs = 'http://schemas.xmlsoap.org/soap/envelope/'
      // Construct SOAP request payload
      const requestPayload = `
          <soapenv:Envelope xmlns:soapenv="${soapNs}">
            <soapenv:Header>
              <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
                <wsse:UsernameToken>
                  <wsse:Username>${username}@${tenantUrl}</wsse:Username>
                  <wsse:Password>${password}</wsse:Password>
                </wsse:UsernameToken>
              </wsse:Security>
            </soapenv:Header>
            <soapenv:Body>
              <wd:${metadata.serviceName}_Request xmlns:wd="${
        metadata.soapNamespace
      }" version="${metadata.version}">
                <wd:Response_Filter>
                  <wd:${metadata.responseFilter.pageTag}>${
        offset / pageSize + 1
      }</wd:${metadata.responseFilter.pageTag}>
                  <wd:${metadata.responseFilter.countTag}>${pageSize}</wd:${
        metadata.responseFilter.countTag
      }>
                </wd:Response_Filter>
              </wd:${metadata.serviceName}_Request>
            </soapenv:Body>
          </soapenv:Envelope>
        `

      console.log(`Step 2: Making the ${metadata.serviceName} request`)
      // Make SOAP request
      const response = await axios.post(metadata.soapEndpoint, requestPayload, {
        headers: { 'Content-Type': 'text/xml' },
      })

      console.log(
        `Step 3: Parsing and processing the ${metadata.serviceName} response`
      )
      console.log('Raw Response:', response.data)

      // If no response data, log error and break loop
      if (!response.data) {
        console.error('Error: Empty response received')
        break
      }

      // Parse SOAP response
      const parsedResponse = await parseResponse(response.data, metadata)
      // If parsing fails, log error and break loop
      if (!parsedResponse) {
        console.error('Error: Failed to extract data from the response')
        break
      }

      const dataInfo = parsedResponse.data
      console.log('Data Info:', dataInfo)

      allData.push(...dataInfo) // Append current data to allData array

      // If fetched data is less than page size, return allData
      if (dataInfo.length < pageSize) {
        return allData
      }

      // Increase offset for the next fetch
      offset += pageSize
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Error Details:', error)
    console.error('Response Data:', error.response ? error.response.data : null)
  }
  return null // Return null in case of an error
}

// Function to parse SOAP response
async function parseResponse(response, metadata) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false })
    const parsedResponse = await parser.parseStringPromise(response)

    // Extract relevant data from parsed response
    const envelope = parsedResponse['env:Envelope']
    const body = envelope['env:Body']
    const responseServiceName = body[`wd:${metadata.serviceName}_Response`]

    // If responseServiceName not present, log error and return null
    if (!responseServiceName) {
      console.error('Error: Failed to extract data from the response')
      return null
    }

    console.log('responseServiceName:', responseServiceName)

    // Extract response data
    const responseData =
      responseServiceName[metadata.responseParseKeys.responseData]

    // If responseData not present, log error and return null
    if (!responseData) {
      console.error('Error: Failed to extract data from the response')
      return null
    }

    console.log('responseData:', responseData)

    // Extract data
    const data = responseData[metadata.responseParseKeys.data]

    // If data not present, log error and return null
    if (!data) {
      console.error('Error: Failed to extract data from the response')
      return null
    }

    console.log('data:', data)

    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [data]

    // Extract desired fields from data
    const extractedData = dataArray.map((item) => {
      const dataItem = {}

      // For each key in responseParseKeys, extract value from item
      Object.keys(metadata.responseParseKeys).forEach((key) => {
        let path = metadata.responseParseKeys[key]

        // If path is an array, navigate through item
        if (Array.isArray(path)) {
          let value = item
          for (let i = 0; i < path.length; i++) {
            if (value !== undefined) {
              value = value[path[i]]
            } else {
              break
            }
          }
          dataItem[key] = value
        } else {
          // If path is a string, navigate through item
          let value = item
          path.split('.').forEach((p) => {
            if (value[p] !== undefined) {
              value = value[p]
            }
          })
          dataItem[key] = value
        }
      })

      return dataItem
    })

    console.log('Extracted Data:', extractedData)

    // Return extracted data
    return { data: extractedData }
  } catch (error) {
    console.error('Error: Failed to parse the response')
    console.error('Raw Response:', response)
    console.error('Error Details:', error)
    return null
  }
}

export { authenticateAndFetchData, parseResponse }
