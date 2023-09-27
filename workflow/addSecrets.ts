import api from '@flatfile/api'
import { mockFetchSecretsFromGUI } from './mockFetchSecrets'

export async function addSecrets(spaceId, environmentId) {
  const mockedSecrets = await mockFetchSecretsFromGUI()

  const secrets = [
    { name: 'WORKDAY_USERNAME', value: mockedSecrets['Workday Username'] },
    { name: 'WORKDAY_PASSWORD', value: mockedSecrets['Workday Password'] },
    {
      name: 'WORKDAY_DATA_CENTER',
      value: mockedSecrets['Workday Data Center'],
    },
    { name: 'WORKDAY_TENANT_URL', value: mockedSecrets['Workday Tenant'] },
  ]

  const promises = secrets.map(async (secret) => {
    const response = await api.secrets.upsert({
      name: secret.name,
      value: secret.value,
      environmentId: environmentId,
      spaceId: spaceId,
    })

    console.log('Response for', secret.name, ':', response)
    return response
  })

  return Promise.all(promises)
}
