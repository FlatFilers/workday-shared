import api from '@flatfile/api'
import { mockFetchSecretsFromGUI } from './mockFetchSecrets'

export async function addSecrets(spaceId, environmentId) {
  const mockedSecrets = await mockFetchSecretsFromGUI()

  const secrets = [
    { name: 'Workday Username', value: mockedSecrets['Workday Username'] },
    { name: 'Workday Password', value: mockedSecrets['Workday Password'] },
    {
      name: 'Workday Data Center',
      value: mockedSecrets['Workday Data Center'],
    },
    { name: 'Workday Tenant', value: mockedSecrets['Workday Tenant'] },
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
