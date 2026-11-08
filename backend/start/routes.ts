import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
import { middleware } from '#start/kernel'

// Lazy load controllers
const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const MessagesController = () => import('#controllers/messages_controller')

// Swagger Docs
router.get('/swagger', async () => AutoSwagger.default.docs(router.toJSON(), swagger))
router.get('/docs', async () => AutoSwagger.default.ui('/swagger', swagger))

router.get('/', async () => ({ hello: 'world' }))

// --- PUBLIC ROUTES ---
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])

// --- PROTECTED ROUTES ---
router.group(() => {
  // Auth
  router.get('/auth/me', [AuthController, 'me'])
  router.post('/auth/logout', [AuthController, 'logout'])

  // Channels (UI based)
  router.get('/channels', [ChannelsController, 'index'])
  router.post('/channels', [ChannelsController, 'store'])
  router.delete('/channels/:id/leave', [ChannelsController, 'leave'])
  router.delete('/channels/:id/destroy', [ChannelsController, 'destroy'])
  router.post('/channels/:id/simulate-inactivity', [ChannelsController, 'simulateInactivity'])

  // Channels (Command line based)
  router.post('/channels/join', [ChannelsController, 'join'])
  router.post('/channels/:id/invite', [ChannelsController, 'invite'])
  router.post('/channels/:id/revoke', [ChannelsController, 'revoke'])
  router.post('/channels/:id/kick', [ChannelsController, 'kick'])

  // Messages
  router.get('/channels/:id/messages', [MessagesController, 'index'])
  router.post('/channels/:id/messages', [MessagesController, 'store'])

  // Invitations
  router.get('/invitations', [ChannelsController, 'getInvitations'])
  router.post('/invitations/:id/accept', [ChannelsController, 'acceptInvitation'])
  router.post('/invitations/:id/reject', [ChannelsController, 'rejectInvitation'])
}).use(middleware.auth())