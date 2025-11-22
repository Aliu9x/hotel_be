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
import { LocationsService } from './locations.service';

import { PaginationQueryDto } from './dto/query.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get('provinces')
  async provinces(@Query() q: PaginationQueryDto) {
    const data = await this.service.listProvinces(q);
    return data;
  }

  @Get('districts')
  async districts(@Query() q: PaginationQueryDto) {
    const data = await this.service.listDistricts(q);
    return data;
  }

  @Get('wards')
  async wards(@Query() q: PaginationQueryDto) {
    const data = await this.service.listWards(q);
    return data;
  }
}
