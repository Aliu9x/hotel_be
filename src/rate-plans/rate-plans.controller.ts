import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RatePlansService } from './rate-plans.service';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { ListRatePlansDto } from './dto/list-rate-plans.dto';
import { RatePlan } from './entities/rate-plan.entity';

@Controller('rate-plans')
export class RatePlansController {
 constructor(private readonly service: RatePlansService) {}

  @Post()
  create(@Body() dto: CreateRatePlanDto): Promise<RatePlan> {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListRatePlansDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<RatePlan> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRatePlanDto): Promise<RatePlan> {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string): Promise<RatePlan> {
    return this.service.deactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
