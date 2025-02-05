import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import mongoose, { Document, Schema } from 'mongoose'

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: 用户ID
 *         email:
 *           type: string
 *           format: email
 *           description: 用户邮箱
 *         name:
 *           type: string
 *           description: 用户名
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: 用户角色
 *         avatar:
 *           type: string
 *           description: 用户头像
 *         passwordResetToken:
 *           type: string
 *           description: 密码重置令牌
 *         passwordResetExpires:
 *           type: string
 *           format: date-time
 *           description: 密码重置令牌过期时间
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */
export interface IUser extends Document {
  email: string
  password: string | undefined
  name: string
  role: 'user' | 'admin'
  avatar?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  createPasswordResetToken(): string
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, '邮箱是必需的'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, '密码是必需的'],
      minlength: [6, '密码长度至少为6位'],
      select: false
    },
    name: {
      type: String,
      required: [true, '用户名是必需的'],
      trim: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String,
      default: null
    },
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true
  }
)

// 保存前加密密码
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// 比较密码
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    return false
  }
}

// 创建密码重置令牌
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  return resetToken
}

export const User = mongoose.model<IUser>('User', userSchema)
