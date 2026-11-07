import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import Channel from './channel.js'

export default class KickVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare channelId: string

  @column()
  declare targetId: string

  @column()
  declare voterId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(vote: KickVote) {
    vote.id = randomUUID()
  }

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'targetId' })
  declare target: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'voterId' })
  declare voter: BelongsTo<typeof User>
}