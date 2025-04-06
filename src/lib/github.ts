import { gql, GraphQLClient } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
  }
})

const ORG = 'montekkundan'
const REPO = 'lab'
const BRANCH = 'main'

export interface GitHubUser {
  id: string
  url: string
  name: string
  avatarUrl: string
  email: string
  company: string
}

interface GitHubCommitAuthor {
  user: GitHubUser
}

interface GitHubCommitNode {
  author: GitHubCommitAuthor
}

interface GitHubCommitHistory {
  nodes: GitHubCommitNode[]
}

interface GitHubObject {
  history: GitHubCommitHistory
}

interface GitHubRepository {
  object: GitHubObject
}

interface GitHubResponse {
  repository?: GitHubRepository
}

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

    const data = await client.request<GitHubResponse>(query)
    
    // Check if all required properties exist
    if (!data?.repository?.object?.history?.nodes) {
      console.log(`No contributors found for ${file}`)
      return []
    }

    // Filter out nodes that don't have valid user data
    const validNodes = data.repository.object.history.nodes.filter(
      (n) => n?.author?.user?.id
    )

    const uniqueContributors = uniqBy(
      validNodes,
      (n) => {
        return n.author.user.id
      }
    ).map((n) => n.author.user)

    return uniqueContributors
  } catch (error) {
    console.log(`Error fetching contributors for ${file}:`, error)
    return []
  }
}