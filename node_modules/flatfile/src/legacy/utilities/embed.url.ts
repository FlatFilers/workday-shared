import { PublishEmbed } from './types'

export const embedURL = ({ team, embedId, apiURL, env }: PublishEmbed) => {
  const { hostname } = new URL(apiURL)

  if (hostname === 'localhost') {
    return `http://localhost:8080/a/${team}/env/${env}/setup/embeds/${embedId}`
  }

  // onprem follows a different url pattern than all others
  if (hostname === 'onprem.flatfile.com') {
    return `https://onprem.flatfile.com/a/${team}/env/${env}/setup/embeds/${embedId}`
  }

  const region = hostname.split('.')[1]
  const url: Record<string, string> = {
    uk0: 'https://app.uk0.flatfile.com',
    de0: 'https://app.de0.flatfile.com',
    eu0: 'https://app.eu0.flatfile.com',
    ca0: 'https://app.ca0.flatfile.com',
    us: 'https://app.flatfile.com',
  }

  const baseURL = url[region]

  return `${baseURL}/a/${team}/env/${env}/setup/embeds/${embedId}`
}
