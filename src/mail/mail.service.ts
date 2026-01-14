import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
      filename: string;
      content?: Buffer;
      path?: string;
      contentType?: string;
    }>;
  }) {
    return this.transporter.sendMail({
      from: `"Booking System" <${process.env.MAIL_USER}>`,
      ...options,
    });
  }
}
