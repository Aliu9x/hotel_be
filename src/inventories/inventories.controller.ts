import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';
import { ListInventoriesDto } from './dto/list-inventories.dto';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly service: InventoriesService) {}

  @Post()
  create(@Body() dto: CreateInventoryDto): Promise<Inventory> {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListInventoriesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Inventory> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryDto): Promise<Inventory> {
    return this.service.update(id, dto);
  }
}
