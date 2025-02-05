import { Multer as MulterType } from 'multer'

import { IUser } from '../models/user.model'

declare global {
  namespace Express {
    interface Multer extends MulterType {}
    interface Request {
      user?: IUser
      file?: Express.Multer.File
    }
  }
}

export {}
