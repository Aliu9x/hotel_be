import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public, User } from 'src/decorator/customize';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateUserDto, @User() user) {
    return this.usersService.create(dto, user);
  }

  // @Get()
  // findAll(@User() user) {
  //   return this.usersService.findAll(user);
  // }

  // @Get('me')
  // me(@User() user) {
  //   return this.usersService.me(user);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string, @User() user) {
  //   return this.usersService.findOne(id,user);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() dto: UpdateUserDto, @User() user) {
  //   return this.usersService.update(id, dto, user);
  // }
}
