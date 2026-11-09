import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import ChannelInvitation from '#models/channel_invitation'
import KickVote from '#models/kick_vote'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

export default class ChannelService {
  /**
   * Join an existing channel or create a new one.
   */
  async joinChannel(userId: string, channelName: string, isPrivate: boolean = false) {
    if (typeof channelName !== 'string' || !channelName.trim() || /\s/.test(channelName.trim())) {
      throw new Error('Channel name is required and cannot contain spaces.')
    }
    channelName = channelName.trim()
    const existing = await Channel.query().whereRaw('LOWER(name) = ?', [channelName.toLowerCase()]).first()

    if (existing) {
      const isMember = await ChannelMember.query()
        .where('channel_id', existing.id)
        .where('user_id', userId)
        .first()

      if (isMember?.isBanned) throw new Error('You are banned from this channel.')
      if (!isMember) {
        if (existing.isPrivate) throw new Error('Channel is private. Accept an invitation first.')
        await ChannelMember.create({ channelId: existing.id, userId, isBanned: false, banCount: 0 })
      }
      await ChannelInvitation.query().where('channel_id', existing.id).where('invitee_id', userId).delete()
      return existing
    }

    // Create a new channel if it doesn't exist
    return await db.transaction(async (trx) => {
      const newChannel = new Channel()
      newChannel.useTransaction(trx)
      newChannel.name = channelName
      newChannel.isPrivate = isPrivate
      newChannel.ownerId = userId
      await newChannel.save()

      const member = new ChannelMember()
      member.useTransaction(trx)
      member.channelId = newChannel.id
      member.userId = userId
      await member.save()

      return newChannel
    })
  }

  /**
   * Invite a user to a channel. Also used by the owner to unban a user.
   */
  async inviteUser(inviterId: string, channelId: string, targetNickName: string) {
    const channel = await Channel.findOrFail(channelId)
    const inviter = await ChannelMember.query().where('channel_id', channelId)
      .where('user_id', inviterId).where('is_banned', false).first()
    if (!inviter) throw new Error('You are not a member of this channel.')

    if (channel.isPrivate && channel.ownerId !== inviterId) {
      throw new Error('Only the owner can invite users to a private channel.')
    }
    if (typeof targetNickName !== 'string' || !targetNickName.trim()) {
      throw new Error('Nickname is required.')
    }
    const target = await User.query()
      .whereRaw('LOWER(nick_name) = ?', [targetNickName.trim().toLowerCase()]).first()
    if (!target) throw new Error('User does not exist.')

    const member = await ChannelMember.query()
      .where('channel_id', channel.id)
      .where('user_id', target.id)
      .first()

    if (member) {
      if (member.isBanned) {
        if (channel.ownerId !== inviterId) throw new Error('Only the owner can restore access for a banned user.')
        // Owner can unban a user
        member.isBanned = false
        member.banCount = 0
        await member.save()
        await KickVote.query().where('channel_id', channel.id).where('target_id', target.id).delete()
        await ChannelInvitation.query().where('channel_id', channel.id).where('invitee_id', target.id).delete()
        return { message: 'User unbanned and added back.' }
      }
      throw new Error('User is already a member.')
    }

    const pending = await ChannelInvitation.query().where('channel_id', channel.id)
      .where('invitee_id', target.id).where('acknowledged', false).first()
    if (pending) throw new Error('User already has a pending invitation.')
    await ChannelInvitation.create({
      channelId: channel.id,
      inviterId,
      inviteeId: target.id,
      acknowledged: false,
    })
    return { message: 'Invitation sent.' }
  }

  /**
   * Get pending invitations for a user.
   */
  async getInvitations(userId: string) {
    return await ChannelInvitation.query()
      .where('invitee_id', userId)
      .where('acknowledged', false)
      .preload('channel')
      .preload('inviter')
      .orderBy('created_at', 'desc')
  }

  /**
   * Accept an invitation. Adds user to the channel and deletes the invitation.
   */
    async acceptInvitation(userId: string, invitationId: string) {
    const invitation = await ChannelInvitation.findOrFail(invitationId)

    if (invitation.inviteeId !== userId) {
      throw new Error('This invitation is not for you.')
    }

    return await db.transaction(async (trx) => {
      // 1. Add to channel members
      const existingMember = await ChannelMember.query()
        .useTransaction(trx)
        .where('channel_id', invitation.channelId)
        .where('user_id', userId)
        .first()

      if (!existingMember) {
        const member = new ChannelMember()
        member.useTransaction(trx)
        member.channelId = invitation.channelId
        member.userId = userId
        member.isBanned = false
        member.banCount = 0
        await member.save()
      } else if (existingMember.isBanned) {
        throw new Error('You are banned from this channel. Ask the owner to restore access.')
      }

      // 2. Delete the invitation
      invitation.useTransaction(trx)
      await invitation.delete()

      return { message: 'Invitation accepted.' }
    })
  }

  /**
   * Reject (decline) an invitation. Simply deletes it.
   */
  async rejectInvitation(userId: string, invitationId: string) {
    const invitation = await ChannelInvitation.findOrFail(invitationId)

    if (invitation.inviteeId !== userId) {
      throw new Error('This invitation is not for you.')
    }

    await invitation.delete()
    return { message: 'Invitation rejected.' }
  }

  /**
   * Remove a user from a private channel (Owner only).
   */
  async revokeUser(ownerId: string, channelId: string, targetNickName: string) {
    const channel = await Channel.findOrFail(channelId)
    if (channel.ownerId !== ownerId) throw new Error('Only the owner can revoke users.')
    if (!channel.isPrivate) throw new Error('This action is only for private channels.')
    if (typeof targetNickName !== 'string' || !targetNickName.trim()) {
      throw new Error('Nickname is required.')
    }

    const target = await User.query().whereRaw('LOWER(nick_name) = ?', [targetNickName.trim().toLowerCase()]).first()
    if (!target) throw new Error('User does not exist.')

    if(target.id === ownerId) throw new Error('Owner cannot revoke themselves.')

    return await db.transaction(async (trx) => {
      // 1. Remove from channel members
      const member = await ChannelMember.query({ client: trx })
        .where('channel_id', channel.id)
        .where('user_id', target.id)
        .forUpdate()
        .first()

      if (!member) throw new Error('User is not a member of this channel.')

      await member.delete()

      // 2. Delete any pending invitations
      await ChannelInvitation.query({ client: trx })
        .where('channel_id', channel.id)
        .where('invitee_id', target.id)
        .delete()

      return { message: 'User revoked from the channel.' }
    })
  }

  /**
   * Kick a user. Owner kicks instantly. Members vote (3+ for ban).
   */
  async kickUser(voterId: string, channelId: string, targetNickName: string) {
    const channel = await Channel.findOrFail(channelId)

    if (channel.isPrivate) throw new Error('Members cannot kick in private channels.')
    if (typeof targetNickName !== 'string' || !targetNickName.trim()) {
      throw new Error('Nickname is required.')
    }

    const target = await User.query().whereRaw('LOWER(nick_name) = ?', [targetNickName.trim().toLowerCase()]).first()
    if (!target) throw new Error('User does not exist.')
    if (target.id === voterId) throw new Error('You cannot kick yourself.')
    if (channel.ownerId === target.id) throw new Error('You cannot kick the owner.')

    if (voterId === target.id) throw new Error('You cannot kick yourself.')
    if (channel.ownerId === target.id) throw new Error('You cannot kick the owner.')

    return await db.transaction(async (trx) => {
      const voterMember = await ChannelMember.query({ client: trx })
        .where('channel_id', channel.id)
        .where('user_id', voterId)
        .where('is_banned', false)
        .first()

      if (!voterMember) throw new Error('You are not a member of this channel.')

      const targetMember = await ChannelMember.query({ client: trx })
        .where('channel_id', channel.id)
        .where('user_id', target.id)
        .forUpdate()
        .first()

      if (!targetMember) throw new Error('Target user is not a member of this channel.')
      if (targetMember.isBanned) throw new Error('Target user is already banned.')

      const isOwner = channel.ownerId === voterId
      if (!isOwner) {
        const existingVote = await KickVote.query({ client: trx })
          .where('channel_id', channel.id)
          .where('target_id', target.id)
          .where('voter_id', voterId)
          .first()

        if (existingVote) throw new Error('You have already voted to kick this user.')

        await KickVote.create({
          channelId: channel.id,
          targetId: target.id,
          voterId,
        }, { client: trx })
      }

      const votes = await KickVote.query({ client: trx })
        .where('channel_id', channel.id)
        .where('target_id', target.id)

      targetMember.banCount = votes.length
      targetMember.isBanned = isOwner || votes.length >= 3
      await targetMember.save()

      if (targetMember.isBanned) {
        await ChannelInvitation.query({ client: trx })
          .where('channel_id', channel.id)
          .where('invitee_id', target.id)
          .delete()
        return { message: isOwner ? 'User has been banned by owner.' : "User has been banned. (3 votes reached)" }
      }


      return { message: `Vote registered (${votes.length}/3).` }
    })
  }
}
