import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRatePlansDto } from './dto/list-rate-plans.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { RatePlanService } from './rate-plans.service';
import { IUser } from 'src/interfaces/customize.interface';
import { User } from 'src/decorator/customize';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';

@ApiTags('Rate Plans')
@Controller('rate-plans')
export class RatePlanController {
  constructor(private readonly service: RatePlanService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách rate plan của khách sạn của user (search theo tên & room_type_id)' })
  list(
    @Query(new ValidationPipe({ transform: true })) query: ListRatePlansDto,
    @User() user: IUser,
  ) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 rate plan thuộc hotel của user' })
  detail(@Param('id') id: string, @User() user: IUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo rate plan cho hotel của user' })
  create(@Body() dto: CreateRatePlanDto, @User() user: IUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật rate plan (thuộc hotel của user)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRatePlanDto,
    @User() user: IUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa rate plan (thuộc hotel của user)' })
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.service.remove(id, user);
  }
}