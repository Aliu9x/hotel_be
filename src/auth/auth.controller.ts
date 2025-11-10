import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
//import { RegisterUserDTo } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { Request, Response } from 'express';
import { IUser } from 'src/interfaces/customize.interface';
import { RegisterUserDTo, UserLoginDto } from 'src/users/dto/create-user.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: UserLoginDto })
  @ResponseMessage('User login ')
  @Post('/login')
  handleLogin(@Req() res: any, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(res.user, response);
  }

  @Public()
  @ResponseMessage('Đăng ký thành công')
  @Post('/register')
  register(@Body() registerUserDTo: RegisterUserDTo) {
    return this.usersService.register(registerUserDTo);
  }

  @ResponseMessage('Đăng ký thành công')
  @Get('/account')
  handleGetAccount(@User() user: IUser) {
    return { user };
  }

  // @Public()
  // @ResponseMessage('Lấy người dùng bằng mã token mới ')
  // @Get('/refresh')
  // handleRefresh(
  //   @Req() request: Request,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   const refreshToken = request.cookies['refresh_token'];
  //   return this.authService.processNewToken(refreshToken, response);
  // }

  @ResponseMessage('Logout User')
  @Post('/logout')
  handleLogout(
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser,
  ) {
    return this.authService.logout(response, user);
  }
}
