// This is just a mock function. In a real-world scenario,
// this would make an actual API call to your server or GUI to retrieve the secrets.

require('dotenv').config()

export function mockFetchSecretsFromGUI() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        'Workday Username': process.env.WORKDAY_USERNAME,
        'Workday Password': process.env.WORKDAY_PASSWORD,
        'Workday Data Center': process.env.WORKDAY_DATA_CENTER,
        'Workday Tenant': process.env.WORKDAY_TENANT,
      })
    }, 1000) // Simulating a 1-second network delay
  })
}
