import { Module } from '@nestjs/common';
import { RatePlanCategoryService } from './rate-plan-category.service';
import { RatePlanCategoryController } from './rate-plan-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanCategory } from './entities/rate-plan-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanCategory])],
  controllers: [RatePlanCategoryController],
  providers: [RatePlanCategoryService],
})
export class RatePlanCategoryModule {}
