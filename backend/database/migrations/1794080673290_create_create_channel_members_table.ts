import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').references('users.id').onDelete('CASCADE')
      table.uuid('channel_id').references('channels.id').onDelete('CASCADE')
      table.boolean('is_banned').defaultTo(false)
      table.integer('ban_count').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['user_id', 'channel_id']) // Юзер не може бути двічі в одному каналі
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}