import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomTypeCategoryService } from './room-type-category.service';
import { CreateRoomTypeCategoryDto } from './dto/create-room-type-category.dto';
import { UpdateRoomTypeCategoryDto } from './dto/update-room-type-category.dto';

@Controller('room-type-category')
export class RoomTypeCategoryController {
  constructor(private readonly service: RoomTypeCategoryService) {}

  @Post()
  create(@Body() dto: CreateRoomTypeCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateRoomTypeCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.service.findOne(id);
  }
}
