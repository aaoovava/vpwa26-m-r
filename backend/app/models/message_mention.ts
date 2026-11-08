import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Message from './message.js'
import User from './user.js'

export default class MessageMention extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare messageId: string

  @column()
  declare userId: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(mention: MessageMention) {
    mention.id = randomUUID()
  }

  @belongsTo(() => Message, { foreignKey: 'messageId' })
  declare message: BelongsTo<typeof Message>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}