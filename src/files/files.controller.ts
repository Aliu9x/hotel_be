import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  Headers,
  UploadedFiles,
  UseInterceptors,
  Get,
  Query,
  Patch,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { MulterConfigService } from './multer.config';
import { CommitUploadDto } from './dto/create-file.dto';
import { FlaggedImagesQueryDto, UpdateImageStatusDto } from './dto/flagged-images.dto';

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

  @Get('flagged')
  async listFlagged(@Query() query: FlaggedImagesQueryDto) {
    const { result, total, page, limit } = await this.filesService.listFlagged(query);
    return {
      result,
      meta: { total, page, limit },
    };
  }
  @Patch('room-type/:id/status')
  async updateRoomTypeImageStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImageStatusDto,
  ) {
    const updated = await this.filesService.updateRoomTypeImageStatus(String(id), dto.status);
    if (!updated) throw new NotFoundException('Room type image not found');
    return { result: updated };
  }  @Patch('hotel/:id/status')
  async updateHotelImageStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImageStatusDto,
  ) {
    const updated = await this.filesService.updateHotelImageStatus(String(id), dto.status);
    if (!updated) throw new NotFoundException('Hotel image not found');
    return { result: updated };
  }
}
