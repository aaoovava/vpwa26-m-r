// app/controllers/auth_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
 /**
   * @register
   * @tags Authentication
   * @summary Register a new user
   * @description Creates a new user account and returns an access token
   * @requestBody {"nickName": "johndoe", "firstName": "John", "lastName": "Doe", "email": "john@example.com", "password": "password123"}
   * @responseBody 201 - {"user": {"id": "uuid", "nickName": "johndoe", "email": "john@example.com"}, "token": "oat_..."}
   * @responseBody 400 - {"message": "Missing required fields"}
   * @responseBody 409 - {"message": "Nickname or email already exists"}
   */
  async register({ request, response }: HttpContext) {
    const data = request.only(['nickName', 'firstName', 'lastName', 'email', 'password'])

    if (!data.nickName || !data.email || !data.password) {
      return response.badRequest({ message: 'Missing required fields' })
    }

    const existingUser = await User.query()
      .where('nick_name', data.nickName)
      .orWhere('email', data.email)
      .first()

    if (existingUser) {
      return response.conflict({ message: 'Nickname or email already exists' })
    }

    const user = await User.create({
      nickName: data.nickName,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      status: 'online',
      notificationPreference: 'all',
    })

    const token = await User.accessTokens.create(user)

    return response.created({
      user: user.toJSON(),
      token: token.value!.release(),
    })
  }

  /**
   * @login
   * @tags Authentication
   * @summary Login a user
   * @description Authenticates the user and returns a new access token
   * @requestBody {"nickName": "johndoe", "password": "password123"}
   * @responseBody 200 - {"user": {"id": "uuid", "nickName": "johndoe"}, "token": "oat_..."}
   * @responseBody 400 - {"message": "Nickname and password are required"}
   * @responseBody 401 - {"message": "Invalid nickname or password"}
   */
  async login({ request, response }: HttpContext) {
    const { nickName, password } = request.only(['nickName', 'password'])

    if (!nickName || !password) {
      return response.badRequest({ message: 'Nickname and password are required' })
    }

    try {
      const user = await User.verifyCredentials(nickName, password)
      const token = await User.accessTokens.create(user)

      return response.ok({
        user: user.toJSON(),
        token: token.value!.release(),
      })
    } catch (error) {
      return response.unauthorized({ message: 'Invalid nickname or password' })
    }
  }

/**
   * @me
   * @tags Authentication
   * @summary Get current user
   * @description Returns the currently authenticated user. Requires a valid Bearer token.
   * @responseBody 200 - <User>
   * @responseBody 401 - Unauthorized
   */
  async me({ auth, response }: HttpContext) {
    return response.ok(auth.user)
  }

/**
   * @logout
   * @tags Authentication
   * @summary Logout user
   * @description Invalidates the current access token. Requires a valid Bearer token.
   * @responseBody 200 - {"message": "Logged out successfully"}
   * @responseBody 401 - Unauthorized
   */
  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.ok({ message: 'Logged out successfully' })
  }
}