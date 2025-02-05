import crypto from 'crypto'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { cosConfig } from '../config/cos'
import { User } from '../models/user.model'
import { uploadToCOS } from '../utils/cos'
import { cos } from '../utils/cos'
import { Email } from '../utils/email'

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '该邮箱已被注册'
      })
    }

    // 创建新用户
    const user = await User.create({
      email,
      password,
      name
    })

    // 生成 token
    const token = signToken(user._id)

    // 移除密码字段
    user.password = undefined

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '注册失败，请重试'
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // 检查是否提供了邮箱和密码
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '请提供邮箱和密码'
      })
    }

    // 查找用户并选择密码字段
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: '邮箱或密码错误'
      })
    }

    // 生成 token
    const token = signToken(user._id)

    // 移除密码字段
    user.password = undefined

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '登录失败，请重试'
    })
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id)

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取用户信息失败'
    })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    // 1) 获取用户邮箱
    const { email } = req.body
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: '请提供邮箱地址'
      })
    }

    // 2) 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '该邮箱地址未注册'
      })
    }

    // 3) 生成重置令牌
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // 4) 发送重置邮件
    try {
      const resetURL = `${req.protocol}://${req.get('host')}${process.env.API_PREFIX}/auth/reset-password/${resetToken}`

      // 使用新的邮件类发送模板邮件
      const emailService = new Email(user.email)
      await emailService.sendPasswordReset(resetURL, user.name)

      res.status(200).json({
        status: 'success',
        message: '重置密码链接已发送到您的邮箱'
      })
    } catch (error) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })

      return res.status(500).json({
        status: 'error',
        message: '发送重置邮件失败，请稍后重试'
      })
    }
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '重置密码请求失败，请重试'
    })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // 1) 获取令牌
    const { token } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: '请提供新密码'
      })
    }

    // 2) 验证令牌并查找用户
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: '重置令牌无效或已过期'
      })
    }

    // 3) 更新密码
    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 4) 生成新的 JWT
    const newToken = signToken(user._id)

    res.status(200).json({
      status: 'success',
      token: newToken,
      message: '密码重置成功'
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '重置密码失败，请重试'
    })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body

    // 不允许更新密码
    if (req.body.password) {
      return res.status(400).json({
        status: 'error',
        message: '此接口不能用于更新密码，请使用专门的密码更新接口'
      })
    }

    // 如果要更新邮箱，检查新邮箱是否已被使用
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: '该邮箱已被其他用户使用'
        })
      }
    }

    // 更新用户资料
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        email: email || req.user.email
      },
      {
        new: true,
        runValidators: true
      }
    )

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新用户资料失败'
    })
  }
}

export const uploadUserAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的头像文件'
      })
    }

    // 上传到腾讯云 COS
    const avatarUrl = await uploadToCOS(req.file)

    // 更新用户头像
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      {
        new: true,
        runValidators: true
      }
    )

    // 返回更新后的用户信息
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    })
  } catch (error) {
    console.error('上传头像失败:', error)
    res.status(400).json({
      status: 'error',
      message: '上传头像失败'
    })
  }
}

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    // 验证请求体
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: '请提供当前密码和新密码'
      })
    }

    // 获取用户（包含密码字段）
    const user = await User.findById(req.user._id).select('+password')
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      })
    }

    // 验证当前密码
    const isPasswordCorrect = await user.comparePassword(currentPassword)
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: '当前密码错误'
      })
    }

    // 更新密码
    user.password = newPassword
    await user.save()

    // 生成新的 token
    const token = signToken(user._id)

    // 返回新的 token
    res.status(200).json({
      status: 'success',
      message: '密码修改成功',
      token
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '修改密码失败'
    })
  }
}

export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const { password } = req.body

    // 验证请求体
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: '请提供密码以确认注销账户'
      })
    }

    // 获取用户（包含密码字段）
    const user = await User.findById(req.user._id).select('+password')
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      })
    }

    // 验证密码
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: '密码错误'
      })
    }

    // 如果用户有头像，删除头像文件
    if (user.avatar) {
      try {
        const avatarKey = user.avatar.split('/').pop() // 获取文件名
        if (avatarKey) {
          await cos.deleteObject({
            Bucket: cosConfig.Bucket,
            Region: cosConfig.Region,
            Key: `avatars/${avatarKey}`
          })
        }
      } catch (error) {
        console.error('删除头像文件失败:', error)
      }
    }

    // 删除用户账户
    await User.findByIdAndDelete(req.user._id)

    res.status(200).json({
      status: 'success',
      message: '账户已成功注销'
    })
  } catch (error) {
    console.error('注销账户失败:', error)
    res.status(400).json({
      status: 'error',
      message: '注销账户失败'
    })
  }
}
