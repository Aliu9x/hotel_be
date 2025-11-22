import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';


@Controller('admin/locations')
export class AdminLocationsController {
  constructor(private readonly importer: ImportService) {}

  @Post('provinces/import')
  @UseInterceptors(FileInterceptor('file'))
  async importProvinces(@UploadedFile() file: Express.Multer.File) {
    const data = await this.importer.importProvinces(file);
    return data;
  }

  @Post('districts/import')
  @UseInterceptors(FileInterceptor('file'))
  async importDistricts(@UploadedFile() file: Express.Multer.File) {
    const data = await this.importer.importDistricts(file);
    return data;
  }

  @Post('wards/import')
  @UseInterceptors(FileInterceptor('file'))
  async importWards(@UploadedFile() file: Express.Multer.File) {
    const data = await this.importer.importWards(file);
    return data;
  }
}