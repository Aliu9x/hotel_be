import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import { ulid } from 'ulid';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  getRootPath = () => process.cwd();

  ensureExists(targetDirectory: string) {
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }
  }

  private readonly MIMETYPE_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  createTempMulterOptions(): MulterModuleOptions {
    const tmpDir = join(this.getRootPath(), 'public', 'images', 'tmp');
    this.ensureExists(tmpDir);

    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, tmpDir),
        filename: (_req, file, cb) => {
          const extFromMime = this.MIMETYPE_EXT[file.mimetype?.toLowerCase() || ''];
          let ext = extFromMime || path.extname(file.originalname).toLowerCase() || '.jpg';
          if (!ext.startsWith('.')) ext = `.${ext}`;

          const finalName = `${ulid()}${ext}`;
          cb(null, finalName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (!ext || !allowed.includes(ext)) {
          return cb(new HttpException('Invalid file type', HttpStatus.UNPROCESSABLE_ENTITY), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, 
      },
    };
  }

  createMulterOptions(): MulterModuleOptions {
    return this.createTempMulterOptions();
  }
}