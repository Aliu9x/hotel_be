import { PartialType } from '@nestjs/swagger';
import { CreateTemporaryLockDto } from './create-temporary-lock.dto';

export class UpdateTemporaryLockDto extends PartialType(CreateTemporaryLockDto) {}
