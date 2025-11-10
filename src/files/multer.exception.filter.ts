import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(HttpException)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    const message =
      exception.getResponse()['message'] || exception.message || 'Error';

    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return response.status(status).json({
        statusCode: status,
        message:
          'Ảnh bạn tải lên quá lớn, vui lòng chọn file nhỏ hơn 5MB!',
      });
    }

    return response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
