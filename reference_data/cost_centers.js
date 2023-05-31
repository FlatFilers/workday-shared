// call your API to get this
// const locations = await axios.get(
//   'your-api.com/tenant-cost-center-data?tenantId=' + space.metadata.tenantId,
//   {
//     headers: { Authorization: 'Bearer ' + space.metadata.apiKey },
//   }
// );

export const cost_centers = [
    {
        CostCenterName: 'Executive Management',
        CostCenterCode: 'CC1000'
    },
    {
        CostCenterName: 'Human Resources',
        CostCenterCode: 'CC2000'
    },
    {
        CostCenterName: 'Finance',
        CostCenterCode: 'CC3000'
    },
    {
        CostCenterName: 'Marketing',
        CostCenterCode: 'CC4000'
    },
    {
        CostCenterName: 'Information Technology',
        CostCenterCode: 'CC5000'
    },
]