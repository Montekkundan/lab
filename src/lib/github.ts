import { gql, GraphQLClient } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
  }
})

const ORG = 'montekkundan'
const REPO = 'montek-lab' // Updated to match your repository name
const BRANCH = 'main' // Updated to main since you're on main branch

export const getFileContributors = async (file: string) => {
  try {
    const query = gql`
      query {
        repository(owner: "${ORG}", name: "${REPO}") {
          object(expression: "${BRANCH}") {
            ... on Commit {
              history(path: "${file}") {
                nodes {
                  author {
                    user {
                      id
                      url
                      name
                      avatarUrl
                      email
                      company
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const data = await client.request(query)
    
    // Check if all required properties exist
    if (!data?.repository?.object?.history?.nodes) {
      console.log(`No contributors found for ${file}`)
      return []
    }

    // Filter out nodes that don't have valid user data
    const validNodes = data.repository.object.history.nodes.filter(
      (n: any) => n?.author?.user?.id
    )

    const uniqueContributors = uniqBy(
      validNodes,
      (n: any) => {
        return n.author.user.id
      }
    ).map((n: any) => n.author.user)

    return uniqueContributors
  } catch (error) {
    console.log(`Error fetching contributors for ${file}:`, error)
    return []
  }
}