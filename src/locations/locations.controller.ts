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
import { Public } from 'src/decorator/customize';

@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get('provinces')
  @Public()
  async provinces(@Query() q: PaginationQueryDto) {
    const data = await this.service.listProvinces(q);
    return data;
  }

  @Get('districts')
  @Public()
  async districts(@Query() q: PaginationQueryDto) {
    const data = await this.service.listDistricts(q);
    return data;
  }

  @Get('wards')
  @Public()
  async wards(@Query() q: PaginationQueryDto) {
    const data = await this.service.listWards(q);
    return data;
  }
}
