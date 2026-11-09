import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import ChannelService from '#services/channel_service'

const channelService = new ChannelService()

export default class ChannelsController {
  /**
   * Helper: Delete channels inactive for > 30 days
   */
  private async cleanupExpiredChannels() {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQL()
    await Channel.query()
      .where((query) => {
        query.where('last_message_at', '<', thirtyDaysAgo)
          .orWhere((emptyChannel) => {
            emptyChannel.whereNull('last_message_at').where('created_at', '<', thirtyDaysAgo)
          })
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

    const channels = await Channel.query()
      .whereHas('members', (query) => {
        query.where('user_id', user.id).where('is_banned', false)
      })
      .preload('members', (query) => {
        query.where('is_banned', false)
      })
      .orderBy('created_at', 'desc')

    return response.ok(channels)
  }

  /**
   * @store
   * @tags Channels
   * @summary Create a new channel (UI)
   * @requestBody {"name": "general", "isPrivate": false}
   * @responseBody 201 - <Channel>
   * @responseBody 409 - {"message": "Channel with this name already exists"}
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const { name, isPrivate } = request.only(['name', 'isPrivate'])
    if (!name) return response.badRequest({ message: 'Channel name is required' })

    const existing = await Channel.findBy('name', name)
    if (existing) return response.conflict({ message: 'Channel with this name already exists' })

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
   * @summary Leave channel
   * @responseBody 200 - {"message": "Left successfully"}
   */
  async leave({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const channel = await Channel.findOrFail(params.id)

    if (channel.ownerId === user.id) {
      await channel.delete()
      return response.ok({ message: 'Channel deleted because the owner left' })
    }

    await ChannelMember.query().where('channel_id', channel.id).where('user_id', user.id).delete()
    return response.ok({ message: 'Left channel successfully' })
  }

  /**
   * @destroy
   * @tags Channels
   * @summary Delete channel (Owner only)
   * @responseBody 200 - {"message": "Channel deleted"}
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const channel = await Channel.findOrFail(params.id)
    if (channel.ownerId !== user.id) return response.forbidden({ message: 'Only the owner can delete this channel' })

    await channel.delete()
    return response.ok({ message: 'Channel deleted' })
  }

  /**
   * @simulateInactivity
   * @tags Channels
   * @summary Simulate 30 days inactivity (Demo)
   * @responseBody 200 - {"message": "Channel removed"}
   */
  async simulateInactivity({ params, auth, response }: HttpContext) {
    const member = await ChannelMember.query()
      .where('channel_id', params.id)
      .where('user_id', auth.user!.id)
      .where('is_banned', false)
      .first()
    if (!member) return response.forbidden({ message: 'You are not a member of this channel' })
    const channel = await Channel.findOrFail(params.id)
    channel.lastMessageAt = DateTime.now().minus({ days: 31 })
    await channel.save()
    await this.cleanupExpiredChannels()
    return response.ok({ message: 'Channel has been marked inactive and removed' })
  }

  /**
   * @join
   * @tags Channels
   * @summary Join/Create channel (Command: /join)
   * @requestBody {"channelName": "general", "isPrivate": false}
   */
  async join({ request, auth, response }: HttpContext) {
    try {
      const { channelName, isPrivate } = request.only(['channelName', 'isPrivate'])
      const channel = await channelService.joinChannel(auth.user!.id, channelName, isPrivate)
      return response.ok(channel)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' }) }
  }

  /**
   * @invite
   * @tags Channels
   * @summary Invite user (Command: /invite)
   * @requestBody {"nickName": "matej"}
   */
  async invite({ request, params, auth, response }: HttpContext) {
    try {
      const result = await channelService.inviteUser(auth.user!.id, params.id, request.input('nickName'))
      return response.ok(result)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' }) }
  }

  /**
   * @revoke
   * @tags Channels
   * @summary Revoke user (Command: /revoke)
   * @requestBody {"nickName": "matej"}
   */
  async revoke({ request, params, auth, response }: HttpContext) {
    try {
      const result = await channelService.revokeUser(auth.user!.id, params.id, request.input('nickName'))
      return response.ok(result)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' }) }
  }

  /**
   * @kick
   * @tags Channels
   * @summary Kick user (Command: /kick)
   * @requestBody {"nickName": "matej"}
   */
  async kick({ request, params, auth, response }: HttpContext) {
    try {
      const result = await channelService.kickUser(auth.user!.id, params.id, request.input('nickName'))
      return response.ok(result)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' }) }
  }

    /**
   * @getInvitations
   * @tags Invitations
   * @summary Get pending invitations
   * @description Returns all pending invitations sent to the current user.
   */
  async getInvitations({ auth, response }: HttpContext) {
    try {
      const invitations = await channelService.getInvitations(auth.user!.id)
      return response.ok(invitations)
    } catch (e) {
      return response.badRequest({message: e instanceof Error ? e.message : 'An unexpected error occurred' })
    }
  }

  /**
   * @acceptInvitation
   * @tags Invitations
   * @summary Accept an invitation
   */
  async acceptInvitation({ params, auth, response }: HttpContext) {
    try {
      const result = await channelService.acceptInvitation(auth.user!.id, params.id)
      return response.ok(result)
    } catch (e) {
      return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' })
    }
  }

  /**
   * @rejectInvitation
   * @tags Invitations
   * @summary Reject an invitation
   */
  async rejectInvitation({ params, auth, response }: HttpContext) {
    try {
      const result = await channelService.rejectInvitation(auth.user!.id, params.id)
      return response.ok(result)
    } catch (e) {
      return response.badRequest({ message: e instanceof Error ? e.message : 'An unexpected error occurred' })
    }
  }
}
