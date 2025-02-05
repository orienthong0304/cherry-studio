import mongoose, { Document, Schema } from 'mongoose'

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           description: 公告ID
 *         title:
 *           type: string
 *           description: 公告标题
 *         content:
 *           type: string
 *           description: 公告内容（Markdown格式）
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: 公告状态
 *         priority:
 *           type: number
 *           description: 优先级（用于排序，数字越大优先级越高）
 *         isSticky:
 *           type: boolean
 *           description: 是否置顶
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: 发布时间
 *         expireDate:
 *           type: string
 *           format: date-time
 *           description: 过期时间
 *         createdBy:
 *           type: string
 *           description: 创建者ID
 *         updatedBy:
 *           type: string
 *           description: 最后更新者ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

export interface IAnnouncement extends Document {
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  priority: number
  isSticky: boolean
  publishDate?: Date
  expireDate?: Date
  createdBy: mongoose.Types.ObjectId
  updatedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, '公告标题是必需的'],
      trim: true,
      maxlength: [100, '标题不能超过100个字符']
    },
    content: {
      type: String,
      required: [true, '公告内容是必需的']
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, '优先级不能小于0'],
      max: [10, '优先级不能大于10']
    },
    isSticky: {
      type: Boolean,
      default: false
    },
    publishDate: {
      type: Date
    },
    expireDate: {
      type: Date,
      validate: {
        validator: function (this: IAnnouncement, value: Date) {
          if (!value) return true
          if (!this.publishDate) return true
          return value > this.publishDate
        },
        message: '过期时间必须晚于发布时间'
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

// 创建索引
announcementSchema.index({ status: 1, publishDate: -1 })
announcementSchema.index({ isSticky: -1, priority: -1, publishDate: -1 })

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema)
