import Message from '#models/message'
import MessageMention from '#models/message_mention'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import User from '#models/user'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

// The lookbehind skips cases like "user@example.com" (a word char or "@" right before "@").
// The 'g' flag ensures we find ALL mentions in the message.
const MENTION_REGEX = /(?<![\w@])@([\w-]+)/g;

export default class MessageService {
  /**
   * Send a message to a channel and handle @mentions.
   */
  async sendMessage(userId: string, channelId: string, text: string) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Message cannot be empty.')
    text = text.trim()
    const isMember = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', userId)
      .where('is_banned', false)
      .first()

    if (!isMember) throw new Error('You are not a member of this channel.')

    // Extract @mentions using the improved regex
    const mentionNicks = [...new Set([...text.matchAll(MENTION_REGEX)].map((match) => match[1].toLowerCase()))]
    return await db.transaction(async (trx) => {
      // Create the message
      const message = new Message()
      message.useTransaction(trx)
      message.channelId = channelId
      message.authorId = userId
      message.text = text
      await message.save()

      // Update channel's last activity timestamp
      const channel = await Channel.findOrFail(channelId)
      channel.useTransaction(trx)
      channel.lastMessageAt = DateTime.now()
      await channel.save()

      // Save mentions
      if (mentionNicks.length > 0) {
        for (const nick of mentionNicks) {
          const targetUser = await User.query()
            .whereRaw('LOWER(nick_name) = ?', [nick])
            .whereHas('channelMemberships', (members) => {
              members.where('channel_id', channelId).where('is_banned', false)
            }).first()
          if (targetUser) {
            const mention = new MessageMention()
            mention.useTransaction(trx)
            mention.messageId = message.id
            mention.userId = targetUser.id
            await mention.save()
          }
        }
      }
      return message
    })
  }
}