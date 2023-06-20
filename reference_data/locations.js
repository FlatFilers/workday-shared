const axios = require('axios')
const xml2js = require('xml2js')
import api from '@flatfile/api'
require('dotenv').config()

//will need to be dynamically updated based on tenant URL
const soapEndpoint =
  'https://wd2-impl-services1.workday.com/ccx/service/flatfile_dpt1/Human_Resources/v41.0'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForJobCompletion(jobId) {
  const maxRetries = 10
  const retryInterval = 2000
  let retries = 0

  while (retries < maxRetries) {
    const jobDetails = await api.jobs.get(jobId)
    const jobStatus = jobDetails.data.status

    if (jobStatus === 'completed') {
      console.log('Job completed')
      return
    }

    if (jobStatus === 'failed') {
      console.error('Job failed')
      throw new Error('Location job failed')
    }

    await sleep(retryInterval)
    retries++
  }

  console.error('Job did not complete within the expected timeframe')
  throw new Error('Location job timed out')
}

async function authenticateAndFetchLocations(spaceId) {
  const pageSize = 100 // Number of records to retrieve per page
  let offset = 0 // Initial offset
  const allLocations = [] // Array to store all locations
  const space = await api.spaces.get(spaceId)
  const { username, password } = space.data.metadata?.creds
  const { tenantUrl } = space.data.metadata?.tenantUrl
  // Extract the tenant name from the Tenant URL
  const tenantName = tenantUrl.split('.')[1]
  // Append the tenant name to the username
  const soapUsername = `${username}@${tenantName}`

  try {
    while (true) {
      console.log(`Fetching locations with offset: ${offset}`)

      console.log(
        'Step 1: Building the SOAP request payload for authentication'
      )
      const soapNs = 'http://schemas.xmlsoap.org/soap/envelope/'
      const requestPayload = `
        <soapenv:Envelope xmlns:soapenv="${soapNs}">
          <soapenv:Header>
            <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
              <wsse:UsernameToken>
                <wsse:Username>${soapUsername}</wsse:Username>
                <wsse:Password>${password}</wsse:Password>
              </wsse:UsernameToken>
            </wsse:Security>
          </soapenv:Header>
          <soapenv:Body>
            <wd:Get_Locations_Request xmlns:wd="urn:com.workday/bsvc" version="v40.1">
              <wd:Response_Filter>
                <wd:Page>${offset / pageSize + 1}</wd:Page>
                <wd:Count>${pageSize}</wd:Count>
              </wd:Response_Filter>
            </wd:Get_Locations_Request>
          </soapenv:Body>
        </soapenv:Envelope>
      `

      console.log('Step 2: Making the locations request')
      const response = await axios.post(soapEndpoint, requestPayload, {
        headers: { 'Content-Type': 'text/xml' },
      })

      console.log('Step 3: Parsing and processing the locations response')
      console.log('Raw Response:', response.data)

      if (!response.data) {
        console.error('Error: Empty response received')
        break
      }

      const parsedResponse = await parseLocationsResponse(response.data)
      if (!parsedResponse) {
        console.error(
          'Error: Failed to extract location data from the response'
        )
        break
      }

      const locationInfo = parsedResponse.locationData
      console.log('Location Info:', locationInfo)

      allLocations.push(...locationInfo) // Append current locations to allLocations array

      if (locationInfo.length < pageSize) {
        // Reached the end of locations, return allLocations
        return allLocations
      }

      offset += pageSize // Increment the offset for the next page
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Error Details:', error)
    console.error('Response Data:', error.response ? error.response.data : null) // Log the response data
  }
  return null // Return null in case of an error
}

async function parseLocationsResponse(response) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false })
    const parsedResponse = await parser.parseStringPromise(response)

    const envelope = parsedResponse['env:Envelope']
    const body = envelope['env:Body']
    const locationsResponse = body['wd:Get_Locations_Response']

    if (!locationsResponse) {
      console.error('Error: Failed to extract location data from the response')
      return null
    }

    const responseData = locationsResponse['wd:Response_Data']

    if (!responseData) {
      console.error('Error: Failed to extract location data from the response')
      return null
    }

    const locationData = responseData['wd:Location']

    if (!locationData) {
      console.error('Error: Failed to extract location data from the response')
      return null
    }

    const locations = Array.isArray(locationData)
      ? locationData
      : [locationData]

    const extractedLocations = locations.map((location) => {
      const locationID = location['wd:Location_Reference']['wd:ID'][1]['_']
      const locationName = location['wd:Location_Data']['wd:Location_Name']

      return {
        locationID,
        locationName,
      }
    })

    console.log('Extracted Locations:', extractedLocations) // Log the extracted locations

    return { locationData: extractedLocations }
  } catch (error) {
    console.error('Error: Failed to parse the locations response')
    console.error('Raw Response:', response)
    console.error('Error Details:', error)
    return null
  }
}

export { authenticateAndFetchLocations, parseLocationsResponse }
