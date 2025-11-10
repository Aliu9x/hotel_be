import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CancellationPolicyRulesService } from './cancellation-policy-rules.service';
import { CreateCancellationPolicyRuleDto } from './dto/create-cancellation-policy-rule.dto';
import { UpdateCancellationPolicyRuleDto } from './dto/update-cancellation-policy-rule.dto';
import { CancellationPolicyRule } from './entities/cancellation-policy-rule.entity';
import { ListCancellationPolicyRulesDto } from './dto/list-cancellation-policy-rules.dto';

@Controller('cancellation-policy-rules')
export class CancellationPolicyRulesController {
   constructor(private readonly service: CancellationPolicyRulesService) {}

  @Post()
  create(@Body() dto: CreateCancellationPolicyRuleDto): Promise<CancellationPolicyRule> {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCancellationPolicyRulesDto) {
    return this.service.findAll(query);
  }

  @Get('policy/:policy_id')
  getPolicyRules(@Param('policy_id') policy_id: string) {
    return this.service.getPolicyRules(policy_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CancellationPolicyRule> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCancellationPolicyRuleDto,
  ): Promise<CancellationPolicyRule> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
