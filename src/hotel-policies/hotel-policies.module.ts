import { Module } from '@nestjs/common';
import { HotelPoliciesService } from './hotel-policies.service';
import { HotelPoliciesController } from './hotel-policies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelPolicy } from './entities/hotel-policy.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { HotelMember } from 'src/hotel-members/entities/hotel-member.entity';
import { HotelMembersModule } from 'src/hotel-members/hotel-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelPolicy, Hotel, HotelMember]),
    HotelMembersModule,
  ],
  controllers: [HotelPoliciesController],
  providers: [HotelPoliciesService],
  exports: [TypeOrmModule, HotelPoliciesService],
})
export class HotelPoliciesModule {}
