import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').references('channels.id').onDelete('CASCADE')
      table.uuid('inviter_id').references('users.id').onDelete('CASCADE')
      table.uuid('invitee_id').references('users.id').onDelete('CASCADE')
      table.boolean('acknowledged').defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}