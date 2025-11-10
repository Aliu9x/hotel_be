import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PricesService } from './prices.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { Price } from './entities/price.entity';
import { ListPricesDto } from './dto/list-prices.dto';

@Controller('prices')
export class PricesController {
    constructor(private readonly service: PricesService) {}

  @Post()
  create(@Body() dto: CreatePriceDto): Promise<Price> {
    return this.service.create(dto);
  }

  @Post('bulk')
  bulk(@Body() items: CreatePriceDto[]) {
    return this.service.bulkUpsert(items);
  }

  @Get()
  findAll(@Query() query: ListPricesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Price> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePriceDto): Promise<Price> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
