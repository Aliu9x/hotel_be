import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MASSAGE } from 'src/decorator/customize';

export interface Response<T> {
  author: string;
  statusCode: number;
  message: string;
  data: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => {
        const response = context.switchToHttp().getResponse();
        const message =
          this.reflector.get<string>(RESPONSE_MASSAGE, context.getHandler()) ||
          '';
        return {
          author: 'API hotel',
          statusCode: response?.statusCode || 200,
          message,
          data: result,
        };
      }),
    );
  }
}
