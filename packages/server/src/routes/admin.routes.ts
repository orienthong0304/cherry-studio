import express from 'express'

import { deleteUser, getAllUsers, getUser, updateUser } from '../controllers/admin.controller'
import { protect, restrictTo } from '../middleware/auth.middleware'

const router = express.Router()

// 所有路由都需要登录和管理员权限
router.use(protect, restrictTo('admin'))

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: 获取用户列表（支持搜索和筛选）
 *     tags: [管理员]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（搜索用户名和邮箱）
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: 用户角色筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *           default: createdAt
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   description: 当前页用户数量
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: 总用户数
 *                     page:
 *                       type: number
 *                       description: 当前页码
 *                     pages:
 *                       type: number
 *                       description: 总页数
 *                     limit:
 *                       type: number
 *                       description: 每页数量
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 */
router.get('/users', getAllUsers)

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: 获取单个用户详情
 *     tags: [管理员]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
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
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 用户不存在
 */
router.get('/users/:id', getUser)

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: 更新用户信息
 *     tags: [管理员]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: 用户角色
 *     responses:
 *       200:
 *         description: 成功更新用户信息
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
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 用户不存在
 */
router.patch('/users/:id', updateUser)

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [管理员]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       204:
 *         description: 成功删除用户
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 用户不存在
 */
router.delete('/users/:id', deleteUser)

export default router
