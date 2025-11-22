import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Public, Roles, User } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListHotelsDto } from './dto/list-hotels.dto';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo khách sạn mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @Public()
  async create(
    @Body()
    createDto: CreateHotelDto,
  ) {
    return await this.hotelsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách khách sạn với phân trang và tìm kiếm',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khách sạn',
  })
  async findAll(
    @Query()
    query: ListHotelsDto,
  ) {
    return await this.hotelsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user) {
    return this.hotelsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin khách sạn' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khách sạn' })
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: UpdateHotelDto,
  ) {
    return await this.hotelsService.update(id, updateDto);
  }
}
