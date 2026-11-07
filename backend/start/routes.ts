import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
import { middleware } from '#start/kernel'

// Lazy load the controller to avoid circular dependencies
const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')

// Swagger Docs
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// --- PUBLIC ROUTES (Without token) ---
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])

// --- PROTECTED ROUTES (Token is needed) ---
router.group(() => {
  router.get('/auth/me', [AuthController, 'me'])
  router.post('/auth/logout', [AuthController, 'logout'])

  router.get('/channels', [ChannelsController, 'index'])
  router.post('/channels', [ChannelsController, 'store'])
  router.delete('/channels/:id/leave', [ChannelsController, 'leave'])
  router.delete('/channels/:id/destroy', [ChannelsController, 'destroy'])
  router.post('/channels/:id/simulate-inactivity', [ChannelsController, 'simulateInactivity'])
}).use(middleware.auth())