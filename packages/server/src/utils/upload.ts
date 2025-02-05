import crypto from 'crypto'
import { Request } from 'express'
import multer from 'multer'
import path from 'path'

import { cos, cosConfig } from '../config/cos'

// 内存存储，用于临时存储文件
const storage = multer.memoryStorage()

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('文件类型检查:', file.mimetype)
  // 只允许上传图片
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('请上传图片文件！'))
  }
}

// 创建上传中间件
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
}).single('avatar')

// 上传到腾讯云 COS
export const uploadToCOS = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('开始上传文件到 COS')
    console.log('文件信息:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })

    // 生成随机文件名
    const randomName = crypto.randomBytes(16).toString('hex')
    const extension = path.extname(file.originalname)
    const key = `avatars/${randomName}${extension}`

    console.log('生成的文件路径:', key)

    // 确保配置存在
    if (!cosConfig.Bucket || !cosConfig.Region) {
      console.error('COS 配置不完整:', {
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region
      })
      reject(new Error('COS configuration is incomplete'))
      return
    }

    const params = {
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }

    console.log('COS 上传参数:', {
      Bucket: params.Bucket,
      Region: params.Region,
      Key: params.Key,
      ContentType: params.ContentType
    })

    cos.putObject(params, (err, data) => {
      if (err) {
        console.error('COS 上传错误:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        })
        reject(err)
      } else {
        const fileUrl = `${cosConfig.BaseUrl}/${key}`
        console.log('文件上传成功:', {
          url: fileUrl,
          cosResponse: data
        })
        resolve(fileUrl)
      }
    })
  })
}
