import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SuggestQueryDto } from './dto/create-search.dto';
import { Public } from 'src/decorator/customize';
import { AvailabilitySearchDto } from './dto/availability-search.dto';
import { HotelRoomTypesQueryDto } from './dto/hotel-room-types.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Public()
  @Get('suggest')
  async suggest(@Query() q: SuggestQueryDto) {
    const data = await this.service.suggest(q);
    return data;
  }

  @Get('availability')
  @Public()
  async search(@Query() query: AvailabilitySearchDto) {
    const data = await this.service.search(query);
    return data;
  }
  @Get('hotel-room-types')
  @Public()
  async list(@Query() query: HotelRoomTypesQueryDto) {
    const data = await this.service.getRoomTypesAvailability(query);
    return data;
  }
}
