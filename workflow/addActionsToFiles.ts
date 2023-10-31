import { FlatfileEvent, FlatfileListener } from '@flatfile/listener'
import api from '@flatfile/api'

export function addActionsToFiles(listener: FlatfileListener) {
  listener.on(
    'file:created',
    async ({ context: { fileId } }: FlatfileEvent) => {
      const file = await api.files.get(fileId)
      const actions = file.data?.actions || []
      const newActions = [
        ...actions,
        {
          operation: 'logFileContents',
          label: 'Log File Metadata',
          description: 'This will log the file metadata.',
        },
        {
          operation: 'decryptAction',
          label: 'Decrypt File',
          description: 'This will create a new decrypted file.',
        },
      ]
      await api.files.update(fileId, {
        actions: newActions,
      })
    }
  )
}
