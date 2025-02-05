import dotenv from 'dotenv'
import path from 'path'

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env')
console.log('Loading environment variables from:', envPath)
dotenv.config({ path: envPath })

// 验证必要的环境变量
// const requiredEnvVars = ['COS_SECRET_ID', 'COS_SECRET_KEY', 'COS_BUCKET', 'COS_REGION', 'COS_BASE_URL']

// requiredEnvVars.forEach((varName) => {
//   if (!process.env[varName]) {
//     console.error(`Missing required environment variable: ${varName}`)
//   } else {
//     console.log(`Environment variable ${varName} is set`)
//   }
// })

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import swaggerUi from 'swagger-ui-express'

import { specs } from './config/swagger'
import adminRoutes from './routes/admin.routes'
import announcementRoutes from './routes/announcement.routes'
import authRoutes from './routes/auth.routes'

const app = express()

// 中间件
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cherry Studio API 文档'
  }) as express.RequestHandler
)

// API 路由
const API_PREFIX = process.env.API_PREFIX || '/api/v1'
app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/admin`, adminRoutes)
app.use(`${API_PREFIX}/announcements`, announcementRoutes)

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Cherry Studio API' })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '未找到请求的资源'
  })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response) => {
  console.error(err.stack)
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  })
})

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cherry-ai'
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  })

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`)
})
