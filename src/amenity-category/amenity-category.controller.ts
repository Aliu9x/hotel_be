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
import { AmenityCategoryService } from './amenity-category.service';
import { CreateAmenityCategoryDto } from './dto/create-amenity-category.dto';
import { UpdateAmenityCategoryDto } from './dto/update-amenity-category.dto';
import { ResponseMessage } from 'src/decorator/customize';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Controller('amenity-category')
export class AmenityCategoryController {
  constructor(private readonly service: AmenityCategoryService) {}

  @Post()
  @ResponseMessage('Tạo loại tiện ích thành công')
  create(@Body() dto: CreateAmenityCategoryDto) {
    return this.service.create(dto);
  }

  @Get('type')
  @ResponseMessage('Lấy danh sách loại tiện ích')
  findAllType(@Query('applies_to') applies_to?: string) {
    return this.service.findAllType(applies_to);
  }

  @Get()
  async findAll(
    @Query()
    query: ListCategoriesDto,
  ) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Chi tiết loại tiện ích')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: UpdateAmenityCategoryDto,
  ) {
    return await this.service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.service.delete(id);
  }
}
