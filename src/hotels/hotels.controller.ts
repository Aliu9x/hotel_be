import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Put,
  UseInterceptors,
  UploadedFiles,
  Get,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from 'src/decorator/customize';
import { IUser } from 'src/interfaces/customize.interface';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly service: HotelsService) {}
  @Post()
  async createHotel(@Body() dto: CreateHotelDto, @User() user: IUser) {
    if (!/^[0-9]+$/.test(dto.registration_code)) {
      throw new BadRequestException('registration_code phải là số');
    }
    return this.service.createHotel(dto, user);
  }

  @Get('me')
  async getMyHotel(@User() user: IUser) {
    return await this.service.getCurrentUsersHotelOrThrow(user);
  }

  @Put('contract')
  async updateContract(@Body() dto: UpdateContractDto, @User() user: IUser) {
    return await this.service.updateMyHotelContract(dto, user);
  }

  @Post('contract/files')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'contract_pdf', maxCount: 1 },
      { name: 'identity_doc', maxCount: 1 },
    ]),
  )
  async uploadContractFiles(
    @UploadedFiles()
    files: {
      contract_pdf?: Express.Multer.File[];
      identity_doc?: Express.Multer.File[];
    },
    @User() user: IUser,
  ) {
    const pdfFile = files.contract_pdf?.[0];
    const identityImage = files.identity_doc?.[0];
    if (!pdfFile && !identityImage) {
      throw new BadRequestException('Thiếu file upload');
    }
    return await this.service.saveMyHotelContractFiles(
      user,
      pdfFile,
      identityImage,
    );
  }
}
