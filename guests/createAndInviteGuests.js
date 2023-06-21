import { createGuest, inviteGuest } from './guestUtils'

export async function createAndInviteGuests(space, event) {
  const guests = space.data.metadata?.guests || []
  const { environmentId, spaceId } = event.context

  for (const guest of guests) {
    const guestData = await createGuest(guest, environmentId, spaceId)

    if (guestData) {
      console.log('Guest created:', guestData)
      const inviteMessage = 'You have been invited to our space.' // customize this message as needed
      const inviteData = await inviteGuest(guestData.id, spaceId, inviteMessage)
      if (inviteData) {
        console.log('Guest invited:', inviteData)
      }
    }
  }
}
