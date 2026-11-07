import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class ChannelsController {
  /**
   * Helper: Delete channels inactive for > 30 days
   */
  private async cleanupExpiredChannels() {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQL()
    await Channel.query()
      .where((query) => {
        query.where('last_message_at', '<', thirtyDaysAgo)
          .orWhereNull('last_message_at')
          .where('created_at', '<', thirtyDaysAgo)
      })
      .delete()
  }

  /**
   * @index
   * @tags Channels
   * @summary Get user channels
   * @description Returns a list of channels the current user is a member of.
   * @responseBody 200 - <Channel[]>
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    await this.cleanupExpiredChannels()

    // Get channels where the user is a member, load members to show count
    const channels = await Channel.query()
      .whereHas('members', (query) => {
        query.where('user_id', user.id)
      })
      .preload('members')
      .orderBy('created_at', 'desc')

    return response.ok(channels)
  }

  /**
   * @store
   * @tags Channels
   * @summary Create a new channel
   * @description Creates a new channel and automatically joins the creator as the owner.
   * @requestBody {"name": "general", "isPrivate": false}
   * @responseBody 201 - <Channel>
   * @responseBody 409 - {"message": "Channel with this name already exists"}
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const { name, isPrivate } = request.only(['name', 'isPrivate'])

    if (!name) {
      return response.badRequest({ message: 'Channel name is required' })
    }

    const existing = await Channel.findBy('name', name)
    if (existing) {
      return response.conflict({ message: 'Channel with this name already exists' })
    }

    // Use transaction to ensure both Channel and ChannelMember are created
    const channel = await db.transaction(async (trx) => {
      const newChannel = new Channel()
      newChannel.useTransaction(trx)
      newChannel.name = name
      newChannel.isPrivate = isPrivate ?? false
      newChannel.ownerId = user.id
      await newChannel.save()

      const member = new ChannelMember()
      member.useTransaction(trx)
      member.channelId = newChannel.id
      member.userId = user.id
      member.isBanned = false
      member.banCount = 0
      await member.save()

      return newChannel
    })

    return response.created(channel)
  }

  /**
   * @leave
   * @tags Channels
   * @summary Leave a channel
   * @description Leaves the channel. If the user is the owner, the channel is completely deleted.
   * @responseBody 200 - {"message": "Left successfully"}
   */
  async leave({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const channel = await Channel.findOrFail(params.id)

    if (channel.ownerId === user.id) {
      // Owner leaves -> delete the whole channel
      await channel.delete()
      return response.ok({ message: 'Channel deleted because the owner left' })
    }

    // Regular member leaves
    await ChannelMember.query()
      .where('channel_id', channel.id)
      .where('user_id', user.id)
      .delete()

    return response.ok({ message: 'Left channel successfully' })
  }

  /**
   * @destroy
   * @tags Channels
   * @summary Delete a channel
   * @description Deletes the channel permanently. Only the owner can do this.
   * @responseBody 200 - {"message": "Channel deleted"}
   * @responseBody 403 - {"message": "Only the owner can delete this channel"}
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const channel = await Channel.findOrFail(params.id)

    if (channel.ownerId !== user.id) {
      return response.forbidden({ message: 'Only the owner can delete this channel' })
    }

    await channel.delete()
    return response.ok({ message: 'Channel deleted' })
  }

  /**
   * @simulateInactivity
   * @tags Channels
   * @summary Simulate 30 days of inactivity (Demo)
   * @description Sets the last_message_at to 31 days ago to trigger auto-deletion.
   * @responseBody 200 - {"message": "Channel expired"}
   */
  async simulateInactivity({ params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    channel.lastMessageAt = DateTime.now().minus({ days: 31 })
    await channel.save()

    // Trigger cleanup immediately
    await this.cleanupExpiredChannels()

    return response.ok({ message: 'Channel has been marked inactive and removed' })
  }
}