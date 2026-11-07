import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

import ChannelMember from './channel_member.js'
import Message from './message.js'
import ChannelInvitation from './channel_invitation.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['nickName'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nickName: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare status: 'online' | 'dnd' | 'offline'

  @column()
  declare notificationPreference: 'all' | 'mention'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @hasMany(() => Message, { foreignKey: 'authorId' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => ChannelMember, { foreignKey: 'userId' })
  declare channelMemberships: HasMany<typeof ChannelMember>

  @hasMany(() => ChannelInvitation, { foreignKey: 'inviteeId' })
  declare receivedInvitations: HasMany<typeof ChannelInvitation>

  @manyToMany(() => ChannelMember, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
  })
  declare channels: ManyToMany<typeof ChannelMember>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}