import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    // 1. Створюємо користувачів (пароль: 'password123')
    const password = await hash.make('password123')

    const roman = await User.create({
      id: randomUUID(),
      nickName: 'roman',
      firstName: 'Roman',
      lastName: 'Kováč',
      email: 'roman@test.sk',
      password,
      status: 'online',
      notificationPreference: 'all',
    })

    const matej = await User.create({
      id: randomUUID(),
      nickName: 'matej',
      firstName: 'Matej',
      lastName: 'Horváth',
      email: 'matej@test.sk',
      password,
      status: 'online',
      notificationPreference: 'all',
    })

    const carol = await User.create({
      id: randomUUID(),
      nickName: 'carol',
      firstName: 'Carol',
      lastName: 'Smith',
      email: 'carol@test.sk',
      password,
      status: 'online',
      notificationPreference: 'mention',
    })

    // 2. Створюємо канали
    const general = await Channel.create({
      id: randomUUID(),
      name: 'general',
      isPrivate: false,
      ownerId: matej.id,
    })

    const project = await Channel.create({
      id: randomUUID(),
      name: 'project',
      isPrivate: true,
      ownerId: roman.id,
    })

    // 3. Додаємо учасників
    await ChannelMember.createMany([
      { id: randomUUID(), channelId: general.id, userId: matej.id },
      { id: randomUUID(), channelId: general.id, userId: roman.id },
      { id: randomUUID(), channelId: general.id, userId: carol.id },
      
      { id: randomUUID(), channelId: project.id, userId: roman.id },
      { id: randomUUID(), channelId: project.id, userId: matej.id },
    ])

    console.log('✅ Seed completed! Users: roman, matej, carol. Password: password123')
  }
}