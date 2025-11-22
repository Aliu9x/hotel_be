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
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { MulterConfigService } from './multer.config';
import { CommitUploadDto } from './dto/create-file.dto';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly multerConfig: MulterConfigService,
  ) {}

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
  async commit(@Body() body: CommitUploadDto, @User() user) {
    const results = await this.filesService.commitAndApplyUploads(body, user);
    return { committed: results };
  }
}
