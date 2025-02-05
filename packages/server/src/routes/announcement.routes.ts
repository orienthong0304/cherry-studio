import express from 'express'

import {
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  getAnnouncement,
  getPublishedAnnouncements,
  updateAnnouncement,
  updateAnnouncementStatus
} from '../controllers/announcement.controller'
import { protect, restrictTo } from '../middleware/auth.middleware'

const router = express.Router()

// 公开路由
/**
 * @swagger
 * /announcements/published:
 *   get:
 *     summary: 获取已发布的公告列表
 *     tags: [公告]
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
 *     responses:
 *       200:
 *         description: 成功获取公告列表
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
 *                   description: 当前页公告数量
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: 总公告数
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 */
router.get('/published', getPublishedAnnouncements)

// 管理员路由
router.use(protect, restrictTo('admin'))

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: 创建新公告
 *     tags: [公告]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 公告标题
 *               content:
 *                 type: string
 *                 description: 公告内容（Markdown格式）
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: 公告状态
 *               priority:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: 优先级
 *               isSticky:
 *                 type: boolean
 *                 description: 是否置顶
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 description: 发布时间
 *               expireDate:
 *                 type: string
 *                 format: date-time
 *                 description: 过期时间
 *     responses:
 *       201:
 *         description: 成功创建公告
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
 *                     announcement:
 *                       $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: 创建失败
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 */
router.post('/', createAnnouncement)

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: 获取所有公告列表（管理员）
 *     tags: [公告]
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
 *         description: 搜索关键词（搜索标题和内容）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: 公告状态筛选
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
 *           enum: [createdAt, title, priority]
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
 *         description: 成功获取公告列表
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
 *                   description: 当前页公告数量
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: 总公告数
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 */
router.get('/', getAllAnnouncements)

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: 获取单个公告详情
 *     tags: [公告]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 公告ID
 *     responses:
 *       200:
 *         description: 成功获取公告详情
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
 *                     announcement:
 *                       $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 公告不存在
 */
router.get('/:id', getAnnouncement)

/**
 * @swagger
 * /announcements/{id}:
 *   patch:
 *     summary: 更新公告
 *     tags: [公告]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 公告ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 公告标题
 *               content:
 *                 type: string
 *                 description: 公告内容（Markdown格式）
 *               priority:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: 优先级
 *               isSticky:
 *                 type: boolean
 *                 description: 是否置顶
 *               expireDate:
 *                 type: string
 *                 format: date-time
 *                 description: 过期时间
 *     responses:
 *       200:
 *         description: 成功更新公告
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
 *                     announcement:
 *                       $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 公告不存在
 */
router.patch('/:id', updateAnnouncement)

/**
 * @swagger
 * /announcements/{id}/status:
 *   patch:
 *     summary: 更新公告状态
 *     tags: [公告]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 公告ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: 公告状态
 *     responses:
 *       200:
 *         description: 成功更新公告状态
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
 *                     announcement:
 *                       $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 公告不存在
 */
router.patch('/:id/status', updateAnnouncementStatus)

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: 删除公告
 *     tags: [公告]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 公告ID
 *     responses:
 *       204:
 *         description: 成功删除公告
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限访问
 *       404:
 *         description: 公告不存在
 */
router.delete('/:id', deleteAnnouncement)

export default router
