import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import Message from '#models/message'
import ChannelMember from '#models/channel_member'

const messageService = new MessageService()

export default class MessagesController {
  /**
   * @store
   * @tags Messages
   * @summary Send a message
   * @requestBody {"text": "Hello @matej"}
   */
  async store({ request, params, auth, response }: HttpContext) {
    const member = await ChannelMember.query().where('channel_id', params.id)
      .where('user_id', auth.user!.id).where('is_banned', false).first()
    if (!member) return response.forbidden({ message: 'You are not a member of this channel.' })
    try {
      const message = await messageService.sendMessage(auth.user!.id, params.id, request.input('text'))
      await message.load('author')
      await message.load('mentions')
      return response.created(message)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : "An unexpected error occurred" }) }
  }

  /**
   * @index
   * @tags Messages
   * @summary Get channel messages
   */
  async index({ params, auth, response }: HttpContext) {
    const member = await ChannelMember.query().where('channel_id', params.id)
      .where('user_id', auth.user!.id).where('is_banned', false).first()
    if (!member) return response.forbidden({ message: 'You are not a member of this channel.' })
    const messages = await Message.query()
      .where('channel_id', params.id)
      .preload('author')
      .preload('mentions')
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
    return response.ok(messages)
  }
}