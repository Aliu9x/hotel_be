import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Put,
  UseInterceptors,
  UploadedFiles,
  Get,
  Query,
  Param,
  ParseIntPipe,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import {
  UpdateApprovalDto,
  UpdateContractDto,
} from './dto/update-contract.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public, User } from 'src/decorator/customize';
import { IUser } from 'src/interfaces/customize.interface';
import { ListHotelsDto } from './dto/list-hotels.dto';

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
  async updateContract(@Body() dto: UpdateContractDto) {
    return await this.service.updateMyHotelContract(dto);
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

    @Body('id_hotel') id: string, 
  ) {
    console.log('id_hotel nhận được:', id);

    const pdfFile = files.contract_pdf?.[0];
    const identityImage = files.identity_doc?.[0];

    if (!pdfFile && !identityImage) {
      throw new BadRequestException('Thiếu file upload');
    }

    return this.service.saveMyHotelContractFiles(id, pdfFile, identityImage);
  }

  @Get('load-images')
  loadImage(@User() user) {
    return this.service.loadImagesFileNames(user);
  }

  @Public()
  @Get('images/:id')
  loadImageByHotel(@Param('id', ParseIntPipe) id: string) {
    return this.service.loadImageByHotel(id);
  }

  @Get()
  async list(@Query() query: ListHotelsDto) {
    const { result, total, page, limit } = await this.service.list(query);
    return {
      result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
  @Get(':id')
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    const hotel = await this.service.getById(id);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  @Patch(':id/approval')
  async updateApproval(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApprovalDto,
  ) {
    const updated = await this.service.updateApprovalStatus(id, dto.status);
    if (!updated) {
      throw new NotFoundException('Hotel not found');
    }
    return updated;
  }
}
