import api from '@flatfile/api'

export async function createGuest(guest, environmentId, spaceId) {
  try {
    const response = await api.guests.create({
      name: guest.name,
      email: guest.email,
      environmentId: environmentId,
      spaces: [{ id: spaceId }],
      // add workbooks if necessary
    })
    return response.data
  } catch (error) {
    console.error(`Error creating guest (${guest.email}):`, error.message)
    return null
  }
}

export async function inviteGuest(guestId, spaceId, message) {
  try {
    const response = await api.guests.invite({
      guestId: guestId,
      spaceId: spaceId,
      message: message,
    })
    return response.data
  } catch (error) {
    console.error(`Error inviting guest (ID: ${guestId}):`, error.message)
    return null
  }
}
