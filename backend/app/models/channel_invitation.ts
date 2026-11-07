import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import Channel from './channel.js'

export default class ChannelInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare channelId: string

  @column()
  declare inviterId: string

  @column()
  declare inviteeId: string

  @column()
  declare acknowledged: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(invitation: ChannelInvitation) {
    invitation.id = randomUUID()
  }

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'inviterId' })
  declare inviter: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'inviteeId' })
  declare invitee: BelongsTo<typeof User>
}