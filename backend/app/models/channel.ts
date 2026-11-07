import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import ChannelMember from './channel_member.js'
import Message from './message.js'
import ChannelInvitation from './channel_invitation.js'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare isPrivate: boolean

  @column()
  declare ownerId: string

  @column.dateTime()
  declare lastMessageAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(channel: Channel) {
    channel.id = randomUUID()
  }

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => ChannelMember, { foreignKey: 'channelId' })
  declare members: HasMany<typeof ChannelMember>

  @hasMany(() => Message, { foreignKey: 'channelId' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => ChannelInvitation, { foreignKey: 'channelId' })
  declare invitations: HasMany<typeof ChannelInvitation>
}