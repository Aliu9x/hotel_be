import { Module } from '@nestjs/common';
import { HotelMembersService } from './hotel-members.service';
import { HotelMembersController } from './hotel-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelMember } from './entities/hotel-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelMember])],
  controllers: [HotelMembersController],
  providers: [HotelMembersService],
  exports:[HotelMembersModule,HotelMembersService]
})
export class HotelMembersModule {}
