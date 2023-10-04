import { listSecrets } from './getSecrets'

export async function fetchWorkdaySecrets(spaceId, environmentId) {
  const secretMap = {}

  try {
    // Fetch all secrets for the space and environment
    const allSecrets = await listSecrets(environmentId, spaceId)

    // Ensure that the 'data' property exists and is an array
    if (!allSecrets || !Array.isArray(allSecrets)) {
      console.error('Unexpected structure from listSecrets response.')
      return
    }

    // Populate the secretMap with name-value pairs
    allSecrets.forEach((secret) => {
      secretMap[secret.name] = secret.value
    })
  } catch (error) {
    console.error('Error fetching secrets:', error.message)
    return
  }

  // Fetch values from the secretMap with fallbacks to environment variables
  const secrets = {
    username:
      secretMap['WORKDAY_USERNAME'] || process.env.USERNAME?.split('@')[0],
    password: secretMap['WORKDAY_PASSWORD'] || process.env.PASSWORD,
    tenantUrl:
      secretMap['WORKDAY_TENANT_URL'] || process.env.USERNAME?.split('@')[1],
    dataCenter: secretMap['WORKDAY_DATA_CENTER'] || '',
  }

  // Log the status of fetching secrets in a generic way
  console.log(
    secrets.username
      ? 'Secret for Workday username retrieved successfully.'
      : 'Failed to retrieve secret for Workday username.'
  )
  console.log(
    secrets.password
      ? 'Secret for Workday password retrieved successfully.'
      : 'Failed to retrieve secret for Workday password.'
  )
  console.log(
    secrets.tenantUrl
      ? 'Secret for Workday tenant URL retrieved successfully.'
      : 'Failed to retrieve secret for Workday tenant URL.'
  )
  console.log(
    secrets.dataCenter
      ? 'Secret for Workday data center retrieved successfully.'
      : 'Failed to retrieve secret for Workday data center.'
  )

  return secrets
}
