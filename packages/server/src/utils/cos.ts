import COS from 'cos-nodejs-sdk-v5'
import crypto from 'crypto'
import path from 'path'

// 创建 COS 实例
export const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!
})

// COS 配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET!, // 存储桶名称
  Region: process.env.COS_REGION!, // 存储桶所在地域
  BaseUrl: process.env.COS_BASE_URL || `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com` // 访问地址
}

// 上传到腾讯云 COS
export const uploadToCOS = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 生成随机文件名
    const randomName = crypto.randomBytes(16).toString('hex')
    const extension = path.extname(file.originalname)
    const key = `avatars/${randomName}${extension}`

    cos.putObject(
      {
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      },
      (err) => {
        if (err) {
          reject(err)
        } else {
          // 返回文件访问地址
          resolve(`${cosConfig.BaseUrl}/${key}`)
        }
      }
    )
  })
}
