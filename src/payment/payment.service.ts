import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentRequestDto,
  CreatePaymentResponseDto,
  QueryPaymentDto,
} from './dto/create-payment.dto';
import { HttpService } from '@nestjs/axios';
import { createHmac } from 'node:crypto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from 'src/bookings/entities/booking.entity';
import { InventoriesService } from 'src/inventories/inventories.service';
import { MailService } from 'src/mail/mail.service';
import { bookingConfirmationTemplate } from 'src/mail/booking-confirmation.template';
export interface MomoQueryResult {
  status: number;
  body: any;
}

@Injectable()
export class PaymentService {
  private readonly partnerCode = process.env.MOMO_PARTNER_CODE ?? 'MOMO';
  private readonly accessKey = process.env.MOMO_ACCESS_KEY ?? 'F8BBA842ECF85';
  private readonly secretKey =
    process.env.MOMO_SECRET_KEY ?? 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  private readonly hostname = process.env.MOMO_HOST ?? 'test-payment.momo.vn';
  private readonly pathCreate =
    process.env.MOMO_CREATE_PATH ?? '/v2/gateway/api/create';

  private readonly lang = process.env.MOMO_LANG ?? 'en';

  private readonly inventoriesService: InventoriesService;
  private readonly mailService: MailService;

  @InjectRepository(Booking) private readonly bookings: Repository<Booking>;
  constructor(
    private readonly http: HttpService,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  private buildCreateSignature(params: {
    amount: string;
    extraData: string;
    ipnUrl: string;
    orderId: string;
    orderInfo: string;
    partnerCode: string;
    redirectUrl: string;
    requestId: string;
    requestType: string;
    accessKey: string;
    secretKey: string;
  }) {
    const rawSignature =
      `accessKey=${params.accessKey}` +
      `&amount=${params.amount}` +
      `&extraData=${params.extraData}` +
      `&ipnUrl=${params.ipnUrl}` +
      `&orderId=${params.orderId}` +
      `&orderInfo=${params.orderInfo}` +
      `&partnerCode=${params.partnerCode}` +
      `&redirectUrl=${params.redirectUrl}` +
      `&requestId=${params.requestId}` +
      `&requestType=${params.requestType}`;
    const signature = createHmac('sha256', params.secretKey)
      .update(rawSignature)
      .digest('hex');
    return signature;
  }

  async createPayment(
    input: CreatePaymentRequestDto,
  ): Promise<CreatePaymentResponseDto> {
    const requestType = input.requestType ?? 'captureWallet';
    const redirectUrl = input.redirectUrl ?? 'https://momo.vn/return';
    const ipnUrl =
      input.ipnUrl ?? process.env.MOMO_IPN_URL ?? 'https://callback.url/notify';
    const extraData = input.extraData ?? '';
    const requestId = this.partnerCode + new Date().getTime();
    const orderId = requestId;

    const signature = this.buildCreateSignature({
      amount: input.amount,
      extraData,
      ipnUrl,
      orderId,
      orderInfo: input.orderInfo,
      partnerCode: this.partnerCode,
      redirectUrl,
      requestId,
      requestType,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
    });

    const payload = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: input.amount,
      orderId,
      orderInfo: input.orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: this.lang,
    };

    const url = `https://${this.hostname}${this.pathCreate}`;
    try {
      const response = await this.http.axiosRef.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response.data as any;

      const payment = this.payments.create({
        booking_id: input.bookingId,
        orderId,
        amount: Number(input.amount),
        orderInfo: input.orderInfo,
        status: PaymentStatus.PENDING,
      });
      await this.payments.save(payment);

      return {
        payUrl: data?.payUrl,
        orderId,
        requestId,
        bookingId: input.bookingId,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data ?? 'MoMo create failed',
        );
      }
      throw error;
    }
  }

  async handleIpn(payload: any) {
    const raw =
      `accessKey=${this.accessKey}` +
      `&amount=${payload.amount ?? ''}` +
      `&extraData=${payload.extraData ?? ''}` +
      `&message=${payload.message ?? ''}` +
      `&orderId=${payload.orderId ?? ''}` +
      `&orderInfo=${payload.orderInfo ?? ''}` +
      `&orderType=${payload.orderType ?? ''}` +
      `&partnerCode=${payload.partnerCode ?? ''}` +
      `&payType=${payload.payType ?? ''}` +
      `&requestId=${payload.requestId ?? ''}` +
      `&responseTime=${payload.responseTime ?? ''}` +
      `&resultCode=${payload.resultCode ?? ''}` +
      `&transId=${payload.transId ?? ''}`;

    const expected = createHmac('sha256', this.secretKey)
      .update(raw)
      .digest('hex');

    if (expected !== payload.signature) {
      return { ok: false, reason: 'invalid_signature' };
    }

    const payment = await this.payments.findOne({
      where: { orderId: payload.orderId },
    });
    if (!payment) {
      return { ok: false, reason: 'payment_not_found' };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { ok: true, reason: 'already_success' };
    }

    payment.message = payload.message;
    payment.transId = payload.transId;

    if (payload.resultCode === 0) payment.status = PaymentStatus.SUCCESS;
    else if (
      String(payload.message ?? '')
        .toLowerCase()
        .includes('cancel')
    )
      payment.status = PaymentStatus.CANCELLED;
    else if (
      String(payload.message ?? '')
        .toLowerCase()
        .includes('expire')
    )
      payment.status = PaymentStatus.EXPIRED;
    else payment.status = PaymentStatus.FAILED;

    const booking = await this.bookings.findOne({
      where: { id: payment.booking_id },
    });
    if (booking) {
      if (payment.status === PaymentStatus.SUCCESS) {
        booking.status = BookingStatus.PAID;

        await this.inventoriesService.confirmBookingRange(
          String(booking.hotel_id),
          String(booking.room_type_id),
          booking.checkin_date,
          booking.checkout_date,
          booking.rooms,
        );

      } else if (payment.status === PaymentStatus.CANCELLED)
        booking.status = BookingStatus.CANCELLED;
      else if (payment.status === PaymentStatus.EXPIRED)
        booking.status = BookingStatus.EXPIRED;
      await this.bookings.save(booking);
    }

    await this.payments.save(payment);

    return { ok: true, orderId: payment.orderId, status: payment.status };
  }

  async getPaymentStatus(orderId: string) {
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) throw new BadRequestException('Payment not found');
    return {
      orderId: payment.orderId,
      bookingId: payment.booking_id,
      amount: payment.amount,
      status: payment.status,
      message: payment.message,
      transId: payment.transId,
      updatedAt: payment.updated_at,
    };
  }
}
