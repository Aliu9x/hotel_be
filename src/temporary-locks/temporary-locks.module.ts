import { Module } from '@nestjs/common';
import { TemporaryLocksService } from './temporary-locks.service';
import { TemporaryLocksController } from './temporary-locks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemporaryLock } from './entities/temporary-lock.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TemporaryLock, RoomType])],
  controllers: [TemporaryLocksController],
  providers: [TemporaryLocksService],
})
export class TemporaryLocksModule {}
