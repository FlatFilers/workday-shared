import { gql } from 'graphql-request'

export const MUTATION_UPDATE_DEPLOYMENT = gql`
  mutation UpdateDeployment(
    $deploymentId: ID!
    $teamId: ID!
    $workbookSheets: JSONObject
  ) {
    updateDeployment(
      teamId: $teamId
      deploymentId: $deploymentId
      workbookSheets: $workbookSheets
    ) {
      id
    }
  }
`
