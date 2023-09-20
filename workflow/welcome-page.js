import api from '@flatfile/api'

export function createPage(spaceId) {
  return api.documents.create(spaceId, {
    title: 'Getting Started',
    body:
      '# Welcome\n' +
      "### We're so excited to welcome you to Workday!\n" +
      "We've set up this data migration space to support your launch.\n" +
      'Your teammates from Workday have been added to this space.\n' +
      'Please reach out to your implementation partner if you have any questions.\n' +
      'Otherwise, you can get started by uploading an Excel or CSV file by navigating to Files -> Upload file.\n' +
      '---\n',
  })
}
