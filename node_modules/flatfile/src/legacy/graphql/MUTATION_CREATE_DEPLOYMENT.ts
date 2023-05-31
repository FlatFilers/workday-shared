import { gql } from 'graphql-request'

export const MUTATION_CREATE_DEPLOYMENT = gql`
  mutation CreateDeployment(
    $teamId: ID!
    $version: String
    $workbook: String
    $name: String
    $namespace: String
    $workbookSheets: JSONObject
    $localPackageJSON: JSONObject
    $environment: String
  ) {
    createDeployment(
      teamId: $teamId
      version: $version
      workbook: $workbook
      name: $name
      namespace: $namespace
      workbookSheets: $workbookSheets
      localPackageJSON: $localPackageJSON
      environment: $environment
    ) {
      id
    }
  }
`
