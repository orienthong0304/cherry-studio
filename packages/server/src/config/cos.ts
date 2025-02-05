import COS from 'cos-nodejs-sdk-v5'

// 打印环境变量
console.log('COS Environment Variables:', {
  SecretId: process.env.COS_SECRET_ID ? '已设置' : '未设置',
  SecretKey: process.env.COS_SECRET_KEY ? '已设置' : '未设置',
  Bucket: process.env.COS_BUCKET,
  Region: process.env.COS_REGION,
  BaseUrl: process.env.COS_BASE_URL
})

// COS 配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET!, // 存储桶名称
  Region: process.env.COS_REGION!, // 存储桶所在地域
  BaseUrl: process.env.COS_BASE_URL || `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com` // 访问地址
}

console.log('COS Config:', cosConfig)

// 创建 COS 实例
export const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
  Protocol: 'https:',
  Domain: `${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com`,
  Proxy: false,
  FileParallelLimit: 3,
  ChunkParallelLimit: 8,
  ChunkSize: 1024 * 1024,
  ProgressInterval: 1000,
  ChunkRetryTimes: 3,
  UploadQueueSize: 10000,
  UseAccelerate: false
})
