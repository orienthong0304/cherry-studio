import { Request, Response } from 'express'

import { Announcement } from '../models/announcement.model'

interface QueryParams {
  page?: string
  limit?: string
  search?: string
  status?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  order?: string
}

// 创建公告
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    })

    res.status(201).json({
      status: 'success',
      data: {
        announcement
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '创建公告失败'
    })
  }
}

// 获取公告列表（管理员）
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query as QueryParams

    // 构建查询条件
    const query: any = {}

    // 关键词搜索（搜索标题和内容）
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }]
    }

    // 状态筛选
    if (status) {
      query.status = status
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
    const total = await Announcement.countDocuments(query)

    // 执行查询
    const announcements = await Announcement.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    res.status(200).json({
      status: 'success',
      results: announcements.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      data: {
        announcements
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取公告列表失败'
    })
  }
}

// 获取已发布的公告列表（用户）
export const getPublishedAnnouncements = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query as QueryParams

    // 构建查询条件
    const query = {
      status: 'published',
      $or: [{ expireDate: { $gt: new Date() } }, { expireDate: null }],
      publishDate: { $lte: new Date() }
    }

    // 计算分页
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // 获取总数
    const total = await Announcement.countDocuments(query)

    // 执行查询
    const announcements = await Announcement.find(query)
      .sort({ isSticky: -1, priority: -1, publishDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-createdBy -updatedBy')

    res.status(200).json({
      status: 'success',
      results: announcements.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      data: {
        announcements
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取公告列表失败'
    })
  }
}

// 获取单个公告详情
export const getAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该公告'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        announcement
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '获取公告详情失败'
    })
  }
}

// 更新公告
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该公告'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        announcement
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新公告失败'
    })
  }
}

// 删除公告
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该公告'
      })
    }

    res.status(204).json({
      status: 'success',
      data: null
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '删除公告失败'
    })
  }
}

// 更新公告状态
export const updateAnnouncementStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: '无效的状态值'
      })
    }

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedBy: req.user._id,
        ...(status === 'published' && { publishDate: new Date() })
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该公告'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        announcement
      }
    })
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新公告状态失败'
    })
  }
}
