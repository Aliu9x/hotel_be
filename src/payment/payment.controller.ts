import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from 'src/decorator/customize';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('ipn')
  @Public()
  async ipn(@Req() req: any) {
    const payload = req.body;
    return this.paymentService.handleIpn(payload);
  }

  @Get('status/:orderId')
  async getStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }
}
