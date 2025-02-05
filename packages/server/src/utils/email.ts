import ejs from 'ejs'
import nodemailer from 'nodemailer'
import path from 'path'

interface EmailOptions {
  subject: string
  template?: string
  data?: Record<string, any>
  message?: string
}

export class Email {
  private to: string
  private from: string

  constructor(email: string) {
    this.to = email
    this.from = `Cherry Studio <${process.env.EMAIL_FROM}>`
  }

  private createTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  private async renderTemplate(template: string, data: Record<string, any>) {
    const templatePath = path.join(__dirname, '..', 'templates', `${template}.ejs`)
    return await ejs.renderFile(templatePath, {
      ...data,
      logo: 'https://example.com/logo.png' // 替换为实际的 logo URL
    })
  }

  async send(options: EmailOptions) {
    try {
      // 1) 创建邮件选项
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.from,
        to: this.to,
        subject: options.subject
      }

      // 2) 如果提供了模板，则渲染模板
      if (options.template && options.data) {
        mailOptions.html = await this.renderTemplate(options.template, options.data)
      } else if (options.message) {
        mailOptions.text = options.message
      }

      // 3) 发送邮件
      await this.createTransport().sendMail(mailOptions)
    } catch (error) {
      console.error('发送邮件失败:', error)
      throw new Error('发送邮件失败')
    }
  }

  async sendPasswordReset(resetURL: string, name: string) {
    await this.send({
      subject: 'Cherry Studio 密码重置',
      template: 'resetPassword',
      data: {
        name,
        resetURL
      }
    })
  }
}
