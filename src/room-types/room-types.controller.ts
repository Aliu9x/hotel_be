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
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ApiTags } from '@nestjs/swagger';
import { RoomType } from './entities/room-type.entity';
import { ListRoomTypesDto } from './dto/list-room-types.dto';
import { Public, Roles, User } from 'src/decorator/customize';

@ApiTags('room-types')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly service: RoomTypesService) {}

  @Post()
  create(@Body() dto: CreateRoomTypeDto, @User() user) {
    return this.service.create(dto, user);
  }

  @Get()
  @Public()
  findAll(@Query() query: ListRoomTypesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<RoomType> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
    @User() user,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.removeHard(id);
  }
}
