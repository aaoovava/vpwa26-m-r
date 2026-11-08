import type { HttpContext } from '@adonisjs/core/http'
import MessageService from '#services/message_service'
import Message from '#models/message'

const messageService = new MessageService()

export default class MessagesController {
  /**
   * @store
   * @tags Messages
   * @summary Send a message
   * @requestBody {"text": "Hello @matej"}
   */
  async store({ request, params, auth, response }: HttpContext) {
    try {
      const message = await messageService.sendMessage(auth.user!.id, params.id, request.input('text'))
      return response.created(message)
    } catch (e) { return response.badRequest({ message: e instanceof Error ? e.message : "An unexpected error occurred" }) }
  }

  /**
   * @index
   * @tags Messages
   * @summary Get channel messages
   */
  async index({ params, response }: HttpContext) {
    const messages = await Message.query()
      .where('channel_id', params.id)
      .preload('author')
      .preload('mentions')
      .orderBy('created_at', 'asc')
    return response.ok(messages)
  }
}