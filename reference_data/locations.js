// call your API to get this
// const locations = await axios.get(
//   'your-api.com/tenant-location-data?tenantId=' + space.metadata.tenantId,
//   {
//     headers: { Authorization: 'Bearer ' + space.metadata.apiKey },
//   }
// );

export const locations = [
    {
        LocationName: 'GlobalTech Solutions HQ',
        LocationId: 'L001'
    },
    {
        LocationName: 'GlobalTech Solutions East Office',
        LocationId: 'L002'
    },
    {
        LocationName: 'GlobalTech Solutions West Office',
        LocationId: 'L003'
    },
    {
        LocationName: 'GlobalTech Solutions Remote',
        LocationId: 'L004'
    },
]