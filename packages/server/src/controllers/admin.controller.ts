import { Request, Response } from 'express'

import { User } from '../models/user.model'

interface QueryParams {
  page?: string
  limit?: string
  search?: string
  role?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  order?: string
}

// 获取所有用户（支持搜索和筛选）
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      role,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query as QueryParams

    // 构建查询条件
    const query: any = {}

    // 关键词搜索（搜索名称和邮箱）
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    }

    // 角色筛选
    if (role) {
      query.role = role
    }

    // 时间范围筛选
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    // 计算分页
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // 获取总数
    const total = await User.countDocuments(query)

    // 执行查询
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)

    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      data: {
        users
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取用户列表失败'
    })
  }
}

// 获取单个用户详情
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该用户'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取用户详情失败'
    })
  }
}

// 更新用户状态（包括角色）
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { role } = req.body

    // 不允许更新密码
    if (req.body.password) {
      return res.status(400).json({
        status: 'error',
        message: '不能通过此接口更新密码'
      })
    }

    // 不允许将最后一个管理员降级为普通用户
    if (role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      const currentUser = await User.findById(req.params.id)
      if (adminCount === 1 && currentUser?.role === 'admin') {
        return res.status(400).json({
          status: 'error',
          message: '系统必须保留至少一个管理员账户'
        })
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      {
        new: true,
        runValidators: true
      }
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该用户'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新用户状态失败'
    })
  }
}

// 删除用户
export const deleteUser = async (req: Request, res: Response) => {
  try {
    // 检查是否为最后一个管理员
    const userToDelete = await User.findById(req.params.id)
    if (!userToDelete) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该用户'
      })
    }

    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount === 1) {
        return res.status(400).json({
          status: 'error',
          message: '不能删除最后一个管理员账户'
        })
      }
    }

    await User.findByIdAndDelete(req.params.id)

    res.status(204).json({
      status: 'success',
      data: null
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '删除用户失败'
    })
  }
}
