import { gql } from 'graphql-request'

export const MUTATION_UPSERT_EMBED = gql`
  mutation UpsertEmbed(
    $name: String!
    $teamId: ID!
    $schemaIds: [ID!]!
    $environmentId: UUID!
    $archived: Boolean
    $helpContent: String
  ) {
    upsertEmbed(
      name: $name
      teamId: $teamId
      schemaIds: $schemaIds
      environmentId: $environmentId
      archived: $archived
      helpContent: $helpContent
    ) {
      embed {
        id
        name
        team {
          id
          name
        }
        teamId
        privateKey {
          id
        }
        privateKeyId
      }
      privateKeyString
    }
  }
`
