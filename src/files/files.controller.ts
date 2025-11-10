import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  Headers,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MulterConfigService } from './multer.config';
import {
  CommitUploadDto,
  DeleteTempOneDto,
  SaveChangesDto,
} from './dto/create-file.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_ROOT = join(process.cwd(), 'public', 'images');
const FOLDER_WHITELIST = ['book', 'avatar', 'slider', 'thumbnail']; // tùy chỉnh

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function customFilename(originalName: string) {
  const ext = extname(originalName); // .jpg, .png ...
  const base = Date.now().toString(36); // thời gian
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}${ext}`;
}

@Controller('files')
@Public()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly multerConfig: MulterConfigService,
  ) {}
  @Post('upload-temp')
  @ResponseMessage('Tải lên tệp tạm thời để xem trước')
  @UseInterceptors(FilesInterceptor('fileUpload', 10))
  uploadTemp(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map((f) => {
      const tmpRelative = `/images/tmp/${f.filename}`;
      return {
        tmpFileName: f.filename,
        originalName: f.originalname,
        size: f.size,
        mimeType: f.mimetype,
        tmpRelativePath: tmpRelative,
      };
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('fileImg'))
  uploadToTmp(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      fileUploaded: file.filename,
    };
  }

  @Post('commit')
  @ResponseMessage('tải và lưu ảnh thành công')
  async commit(@Body() body: CommitUploadDto) {
    const results = await this.filesService.commitUploads(body);
    return { committed: results };
  }

  @Post('delete-temp-one')
  @ResponseMessage('Delete a single temporary file by tmpFileName')
  async deleteTempOne(@Body() body: DeleteTempOneDto) {
    const result = await this.filesService.deleteTempOne(body);
    return result;
  }

  @Post('save-changes')
  @ResponseMessage('Save add/remove changes for images in a single operation')
  async saveChanges(@Body() body: SaveChangesDto) {
    const result = await this.filesService.saveChanges(body);
    return result;
  }
}
