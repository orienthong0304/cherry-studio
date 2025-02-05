import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { User } from '../models/user.model'

interface JwtPayload {
  id: string
}

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) 获取 token
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '您未登录，请先登录'
      })
    }

    // 2) 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    // 3) 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: '此 token 所属的用户不存在'
      })
    }

    // 4) 将用户信息添加到请求对象中
    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: '认证失败，请重新登录'
    })
  }
}

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '您没有权限执行此操作'
      })
    }
    next()
  }
}
