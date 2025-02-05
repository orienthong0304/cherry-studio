import express from 'express'

import {
  deactivateAccount,
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
  uploadUserAvatar
} from '../controllers/auth.controller'
import { protect } from '../middleware/auth.middleware'
import { uploadAvatar } from '../utils/upload'

const router = express.Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 注册新用户
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 用户密码
 *               name:
 *                 type: string
 *                 description: 用户名
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: 注册失败
 */
router.post('/register', register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 用户密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: 登录失败
 */
router.post('/login', login)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 */
router.get('/me', protect, getMe)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: 请求密码重置
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *     responses:
 *       200:
 *         description: 重置链接已发送
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 重置密码链接已发送到您的邮箱
 *       404:
 *         description: 邮箱未注册
 */
router.post('/forgot-password', forgotPassword)

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: 重置密码
 *     tags: [认证]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 重置密码令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码重置成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: 密码重置成功
 *       400:
 *         description: 重置令牌无效或已过期
 */
router.post('/reset-password/:token', resetPassword)

/**
 * @swagger
 * /auth/update-profile:
 *   patch:
 *     summary: 更新用户资料
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 新的用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 新的邮箱地址
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: 更新失败
 *       401:
 *         description: 未授权
 */
router.patch('/update-profile', protect, updateProfile)

/**
 * @swagger
 * /auth/update-password:
 *   patch:
 *     summary: 修改密码
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 密码修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 密码修改成功
 *                 token:
 *                   type: string
 *       400:
 *         description: 修改失败
 *       401:
 *         description: 当前密码错误
 */
router.patch('/update-password', protect, updatePassword)

/**
 * @swagger
 * /auth/upload-avatar:
 *   post:
 *     summary: 上传用户头像
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像图片文件（支持jpg、png等格式，最大5MB）
 *     responses:
 *       200:
 *         description: 上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: 上传失败
 *       401:
 *         description: 未授权
 */
router.post('/upload-avatar', protect, uploadAvatar, uploadUserAvatar)

/**
 * @swagger
 * /auth/deactivate:
 *   delete:
 *     summary: 注销用户账户
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 当前密码，用于确认注销操作
 *     responses:
 *       200:
 *         description: 账户注销成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 账户已成功注销
 *       400:
 *         description: 注销失败
 *       401:
 *         description: 密码错误
 *       404:
 *         description: 用户不存在
 */
router.delete('/deactivate', protect, deactivateAccount)

export default router
