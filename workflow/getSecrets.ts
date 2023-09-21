import api from '@flatfile/api'

export async function listSecrets(environmentId, spaceId) {
  try {
    const params = {
      environmentId: environmentId,
      spaceId: spaceId,
    }
    const secretsList = await api.secrets.list(params)
    return secretsList.data // Return the data property containing the array of secrets
  } catch (error) {
    console.error('Error fetching secrets:', error)
    return [] // Return an empty array or handle the error as appropriate
  }
}
