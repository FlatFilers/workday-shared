import api from '@flatfile/api'

export function addSecrets(spaceId, environmentId) {
  const secrets = [
    { name: 'Workday Username', value: 'cfrederickson-impl' },
    { name: 'Workday Password ', value: 'rgx4uvr4bdk4KDA!yqy' },
    { name: 'Workday Data Center', value: 'wd2-impl-services1' },
    { name: 'Workday Tenant', value: 'flatfile_dpt1' },
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
