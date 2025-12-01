import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';

@Module({
  controllers: [CronController],
  providers: [],
})
export class CronModule {}
