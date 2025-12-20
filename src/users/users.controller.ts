import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

   @Post()
  async create(@Body() dto: CreateUserDto) {
    const exists = await this.usersService.findOneByUsername(dto.email);
    if (exists) {
      throw new ConflictException('Email đã tồn tại');
    }
    const user = await this.usersService.create(dto);
    const { password, ...safe } = user as any;
    return { result: safe };
  }

    @Get()
  async list(@Query() query: ListUsersDto) {
    const { result, total, page, limit } = await this.usersService.list(query);
    return {
      result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

}
