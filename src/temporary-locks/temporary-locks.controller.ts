import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TemporaryLocksService } from './temporary-locks.service';
import { CreateTemporaryLockDto } from './dto/create-temporary-lock.dto';
import { UpdateTemporaryLockDto } from './dto/update-temporary-lock.dto';
import { TemporaryLock } from './entities/temporary-lock.entity';

@Controller('temporary-locks')
export class TemporaryLocksController {
  constructor(private readonly service: TemporaryLocksService) {}

  @Post()
  create(@Body() dto: CreateTemporaryLockDto): Promise<TemporaryLock> {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemporaryLockDto): Promise<TemporaryLock> {
    return this.service.update(id, dto);
  }
}
