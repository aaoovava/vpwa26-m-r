import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import Channel from './channel.js'
import MessageMention from './message_mention.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare channelId: string

  @column()
  declare authorId: string

  @column()
  declare text: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(message: Message) {
    message.id = randomUUID()
  }

  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => MessageMention)
  declare mentions: HasMany<typeof MessageMention>
}