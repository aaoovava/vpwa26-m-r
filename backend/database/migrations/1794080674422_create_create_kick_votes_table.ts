import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kick_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').references('channels.id').onDelete('CASCADE')
      table.uuid('target_id').references('users.id').onDelete('CASCADE')
      table.uuid('voter_id').references('users.id').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['channel_id', 'target_id', 'voter_id']) // Один юзер = один голос
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}