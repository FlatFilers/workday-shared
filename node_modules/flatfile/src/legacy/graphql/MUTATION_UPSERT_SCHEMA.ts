import { gql } from 'graphql-request'

export const MUTATION_UPSERT_SCHEMA = gql`
  mutation UpsertSchema(
    $slug: String
    $teamId: ID!
    $archived: Boolean
    $jsonSchema: JsonSchemaDto
    $sheetCompute: JSONObject
    $name: String
    $previewFieldKey: String
    $deploymentId: String
    $environment: String
    $code: String
  ) {
    upsertSchema(
      slug: $slug
      teamId: $teamId
      archived: $archived
      jsonSchema: $jsonSchema
      sheetCompute: $sheetCompute
      name: $name
      previewFieldKey: $previewFieldKey
      deploymentId: $deploymentId
      environment: $environment
      code: $code
    ) {
      id
      slug
      environmentId
    }
  }
`
