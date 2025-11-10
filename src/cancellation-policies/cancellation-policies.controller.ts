import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CancellationPoliciesService } from './cancellation-policies.service';
import { CreateCancellationPolicyDto } from './dto/create-cancellation-policy.dto';
import { UpdateCancellationPolicyDto } from './dto/update-cancellation-policy.dto';
import { ListCancellationPoliciesDto } from './dto/list-cancellation-policies.dto';
import { CancellationPolicy } from './entities/cancellation-policy.entity';

@Controller('cancellation-policies')
export class CancellationPoliciesController {
    constructor(private readonly service: CancellationPoliciesService) {}

  @Post()
  create(@Body() dto: CreateCancellationPolicyDto): Promise<CancellationPolicy> {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCancellationPoliciesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CancellationPolicy> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCancellationPolicyDto): Promise<CancellationPolicy> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
