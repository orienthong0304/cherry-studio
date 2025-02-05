import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cherry Studio API 文档',
      version: '1.0.0',
      description: 'Cherry Studio 后端 API 接口文档',
      contact: {
        name: 'API Support',
        email: 'support@cherry-studio.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'] // 路由文件的路径
}

export const specs = swaggerJsdoc(options)
