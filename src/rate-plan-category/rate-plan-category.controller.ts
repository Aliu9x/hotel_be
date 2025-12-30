import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { RatePlanCategoryService } from './rate-plan-category.service';
import { CreateRatePlanCategoryDto } from './dto/create-rate-plan-category.dto';
import { UpdateRatePlanCategoryDto } from './dto/update-rate-plan-category.dto';

@Controller('rate-plan-category')
export class RatePlanCategoryController {
  constructor(private readonly service: RatePlanCategoryService) {}
 
   @Post()
   create(@Body() dto: CreateRatePlanCategoryDto) {
     return this.service.create(dto);
   }
 
   @Patch(':id')
   update(
     @Param('id', ParseIntPipe) id: string,
     @Body() dto: UpdateRatePlanCategoryDto,
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
