import { FlatfileEvent, FlatfileListener } from '@flatfile/listener'
import api from '@flatfile/api'
import axios from 'axios'
import * as FormData from 'form-data'

const apiUrl =
  process.env.FLATFILE_API_URL || 'https://platform.flatfile.com/api'
const apiKey = process.env.FLATFILE_API_KEY

/**
 * Download file data from Flatfile
 */
const getFileBufferFromApi = async (fileId) => {
  const file = await api.files.download(fileId)
  const chunks = []

  for await (const chunk of file) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

export function executeActionsOnFiles(listener: FlatfileListener) {
  listener.on(
    'job:ready',
    { job: 'file:logFileContents' },
    async ({ context: { fileId, jobId } }: FlatfileEvent) => {
      await acknowledgeJob(jobId, 'Gettin started.', 10)

      const file = await api.files.get(fileId)
      console.log({ file })

      await completeJob(jobId, 'Logging file contents is complete.')
    }
  )

  listener.on(
    'job:ready',
    { job: 'file:decryptAction' },
    async ({
      context: { spaceId, fileId, jobId, environmentId },
    }: FlatfileEvent) => {
      try {
        await acknowledgeJob(jobId, 'Gettin started.', 10)

        const fileResponse = await api.files.get(fileId)

        const buffer = await getFileBufferFromApi(fileId)
        const { name, ext } = fileResponse.data
        const newFileName = name
          ? name.split('.')[0] + '[Decrypted].' + ext
          : 'DecryptedFile.csv'

        const formData = new FormData()
        formData.append('file', buffer, { filename: newFileName })
        formData.append('spaceId', spaceId)
        formData.append('environmentId', environmentId)

        await axios.post(`${apiUrl}/v1/files/`, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
          },
          transformRequest: () => formData,
        })

        await completeJob(jobId, 'Decrypting is now complete.')
      } catch (e) {
        await failJob(jobId, 'The decryption job failed.')
      }
    }
  )

  async function acknowledgeJob(jobId: string, info: string, progress: number) {
    await api.jobs.ack(jobId, {
      info,
      progress,
    })
  }

  async function completeJob(jobId: string, message: string) {
    await api.jobs.complete(jobId, {
      outcome: {
        message,
      },
    })
  }

  async function failJob(jobId: string, message: string) {
    await api.jobs.fail(jobId, {
      outcome: {
        message,
      },
    })
  }
}
