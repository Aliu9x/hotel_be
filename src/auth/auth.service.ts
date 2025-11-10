import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import ms from 'ms';
import { HotelsService } from 'src/hotels/hotels.service';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private hotelsService: HotelsService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { id, email, role } = user;
    let hotel_id: string | null = null;

    if (role === Role.HOTEL_OWNER) {
      hotel_id = await this.hotelsService.findHotelIdByOwner(id);
    }

    const payload = {
      sub: 'token login',
      iss: 'from server',
      id,
      email,
      role,
      hotel_id,
    };

    const refresh_token = this.createRefreshToken(payload);
    await this.usersService.updateUserToken(refresh_token, id);

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRE'),
        10,
      ),
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token,
      user: {
        id,
        email,
        role,
        hotel_id,
      },
    };
  }

  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRE'),
        10,
      ),
    });
    return refresh_token;
  };

  // processNewToken = async (refreshToken: string, response: Response) => {
  //   try {
  //     this.jwtService.verify(refreshToken, {
  //       secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
  //     });
  //     let user = await this.usersService.findUserByToken(refreshToken);
  //     if (user) {
  //       const { id, name, email, role ,hotelId} = user;
  //       const payload = {
  //         sub: 'token refresh',
  //         iss: 'from server',
  //         id,
  //         name,
  //         email,
  //         role,
  //       };
  //       const refresh_token = this.createRefreshToken(payload);
  //       //update user with refresh token
  //       await this.usersService.updateUserToken(refresh_token, id);

  //       response.clearCookie('refresh_token');

  //       //set refresh token as cookies
  //       response.cookie('refresh_token', refresh_token, {
  //         httpOnly: true,
  //         maxAge: parseInt(
  //           this.configService.get<string>('JWT_REFRESH_EXPIRE'),
  //           10,
  //         ),
  //       });

  //       return {
  //         access_token: this.jwtService.sign(payload),
  //         user: {
  //           id,
  //           name,
  //           email,
  //           role,
  //         },
  //       };
  //     } else {
  //       throw new BadRequestException('Refresh token không hợp lệ ');
  //     }
  //   } catch (error) {
  //     throw new BadRequestException('Refresh token không hợp lệ ');
  //   }
  // };

  logout = async (response: Response, user: IUser) => {
    await this.usersService.updateUserToken('', user.id);
    response.clearCookie('refresh_token');
    return 'ok';
  };
}
