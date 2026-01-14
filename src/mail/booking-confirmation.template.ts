export const bookingConfirmationTemplate = (data: {
  guestName: string;
  hotelName: string;
  hotelAddress: string;
  hotelStars: number;
  hotelImage: string;
  hotelDirectionsUrl: string;
  checkin: string;
  checkinNote: string;
  checkout: string;
  checkoutNote: string;
  rooms: number;
  nights: number;
  roomType: string;
  mainGuest: string;
  adults: number;
  children: number;
  specialRequests: string;
  reservationCode: string;
  manageBookingUrl: string;
  hotelPhone: string;
  hotelEmail: string;
  priceRoom: string;
  priceTax: number;
  priceTotal: string;
  paymentNote: string;
  paymentDetail: string;
}) => `
<body style="margin:0;padding:0;background:#eef3f8">
  <div style="padding:42px 0;">
    <!-- Header -->
    <div style="max-width:620px;margin:0 auto;">
      <!-- Card 1 -->
      <div style="background:#fff;border-radius:8px;box-shadow:0 0 4px #c3d3e4;overflow:hidden;border:1px solid #d1e2f3;padding:0 0 24px 0;">
        <div style="height:5px;width:100%;background:#249e5b;border-radius:8px 8px 0 0;"></div>
        <div style="padding:32px 32px 0 32px;">
          <h2 style="font-weight:700;color:#249e5b;text-align:center;">Đơn đặt của quý khách hiện đã được xác nhận!</h2>
          <div style="font-size:16px;color:#333;text-align:left;margin:24px 0 18px 0;">
            Thân gửi <span style="text-transform:capitalize">${data.guestName}</span>,<br><br>
            Để tham khảo, mã đặt chỗ của quý khách là <b>${data.reservationCode}</b>. 
            Để xem, hủy, hoặc sửa đổi đơn đặt chỗ của quý khách, hãy sử dụng dịch vụ tự phục vụ dễ dàng của chúng tôi.<br><br>
            Chúng tôi đã xác nhận thời gian quý khách ở lại khách sạn. 
            Vui lòng xem chi tiết xác nhận đặt chỗ đính kèm để tham khảo. Chúng tôi sẽ gửi cho quý khách mọi tin cập nhật thiết yếu đối với đơn đặt chỗ qua thư điện tử.
          </div>
          <div style="text-align:center;">
            <a href="${data.manageBookingUrl}" style="display:inline-block;padding:14px 32px;background:#1769ff;color:#fff;font-weight:600;text-decoration:none;border-radius:10px;box-shadow:0 1px 4px #d0d8ea; font-size:17px;">Quản lý đặt chỗ của tôi</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Thông tin khách sạn -->
    <div style="max-width:620px;margin:32px auto 0 auto;">
      <div style="background:#fff;border-radius:10px;box-shadow:0 0 4px #c3d3e4;border:1px solid #d1e2f3; padding:28px 20px 24px 28px;">
        <div style="display:flex;align-items:flex-start;">
          <div>
            <div style="font-size:20px;font-weight:700;color:#20232a;">${data.hotelName} 
              <span style="color:#ffb400;">${'★'.repeat(data.hotelStars)}${'☆'.repeat(5 - data.hotelStars)}</span>
            </div>
            <div style="font-size:15px;margin-top:2px;color:#40454b;">Khách sạn ${data.hotelName}</div>
            <div style="display:flex;margin-top:14px;">
              <img src="${data.hotelImage}" width="100" height="75" style="border-radius:7px;object-fit:cover;border:1px solid #d1e2f3;margin-right:15px;" alt="Hotel photo"/>
              <div>
                <div style="font-size:14px;line-height:20px;">${data.hotelAddress}</div>
                <a href="${data.hotelDirectionsUrl}" style="color:#1769ff;font-size:14px;">Chỉ đường</a>
              </div>
            </div>
          </div>
        </div>
       <div style="border-top:1px solid #e5e6eb;margin-top:18px;padding-top:16px;display:flex;justify-content:space-between;">
  <div style="width:45%;text-align:left;">
    <div style="color:#767980;">Nhận phòng</div>
    <div style="font-weight:600;margin-top:3px;">${data.checkin}</div>
    <div style="font-size:13px;color:#767980;margin-top:4px;">
      (sau ${data.checkinNote})
    </div>
  </div>

  <div style="width:45%;text-align:right;">
    <div style="color:#767980;">Trả phòng</div>
    <div style="font-weight:600;margin-top:3px;">${data.checkout}</div>
    <div style="font-size:13px;color:#767980;margin-top:4px;">
      (trước ${data.checkoutNote})
    </div>
  </div>
</div>

        <div style="margin-top:22px;font-size:14px;">
          Quý khách cũng có thể dễ dàng tìm hiểu về các quy định và tiện nghi của chỗ nghỉ tại 
          <a href="${data.manageBookingUrl}" style="color:#1769ff;text-decoration:underline;">Quản lý đặt chỗ của tôi</a>
        </div>
        <div style="margin-top:28px;">
          <b style="font-size:15px;">Liên hệ nơi ở <span style="font-size:18px;">📍</span></b>
          <div style="margin-top:8px;color:#40454b;font-size:14px;">
            Mọi câu hỏi liên quan đến chỗ nghỉ, vui lòng liên hệ trực tiếp với chỗ nghỉ.
          </div>
         <div style="display:flex;justify-content:space-between;margin-top:10px;">
  <div style="width:48%;border:1px solid #1769ff;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:21px;color:#0a71eb;">📞</div>
    <a href="tel:${data.hotelPhone}"
       style="font-size:15px;color:#111;text-decoration:none;display:block;margin-top:6px;">
      ${data.hotelPhone}
    </a>
  </div>

  <div style="width:48%;border:1px solid #1769ff;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:21px;color:#0a71eb;">✉️</div>
    <a href="mailto:${data.hotelEmail}"
       style="font-size:15px;color:#111;text-decoration:none;display:block;margin-top:6px;">
      ${data.hotelEmail}
    </a>
  </div>
</div>

        </div>
      </div>
    </div>

    <!-- Card 3: Thông tin về Đơn đặt phòng -->
    <div style="max-width:620px;margin:32px auto 0 auto;">
      <div style="background:#fff;border-radius:10px;box-shadow:0 0 4px #c3d3e4;border:1px solid #d1e2f3;padding:18px 32px;">
        <div style="font-weight:700;font-size:17px;margin-bottom:16px;">Thông tin về Đơn đặt phòng</div>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr>
            <td style="width:140px;border-bottom:1px solid #eee;padding:7px 0;">Đặt phòng</td>
            <td style="border-bottom:1px solid #eee;">${data.rooms} phòng, ${data.nights} đêm</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;">Loại phòng</td>
            <td style="border-bottom:1px solid #eee;">${data.roomType}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;">Khách chính</td>
            <td style="border-bottom:1px solid #eee;">${data.mainGuest}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;">Số người ở</td>
            <td style="border-bottom:1px solid #eee;">${data.adults} người lớn x ${data.children} trẻ em</td>
          </tr>
          <tr>
            <td style="vertical-align:top;">Yêu cầu đặc biệt</td>
            <td>
              ${data.specialRequests || '(Mọi yêu cầu đặc biệt đều lệ thuộc vào khả năng cung cấp khi đến.)'}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Card 4: Thông tin chi tiết thanh toán -->
    <div style="max-width:620px;margin:32px auto;">
      <div style="background:#fff;border-radius:10px;box-shadow:0 0 4px #c3d3e4;border:1px solid #d1e2f3;">
        <div style="background:#e6faeb;border-radius:10px 10px 0 0;padding:10px 24px;font-weight:500;color:#249e5b;font-size:15px;">
          <span style="font-size:17px;position:relative;top:2px;">&#10003;</span> Đã xác nhận đơn đặt phòng
        </div>
        <div style="padding:20px 32px 26px 32px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px;">Thông tin chi tiết thanh toán</div>
          <table style="width:100%;font-size:15px;">
            <tr>
              <td>Phòng</td>
              <td style="text-align:right">${data.rooms} phòng x ${data.nights} đêm</td>
              <td style="text-align:right">${data.priceRoom} </td>
            </tr>
            <tr>
              <td>Thuế Và Phí</td>
              <td></td>
              <td style="text-align:right">${data.priceTax.toLocaleString('vi-VN')} đ</td>
            </tr>
            <tr>
              <td colspan="2" style="font-weight:700;padding-top:12px;">Tổng Tiền <div style="font-size:12px;font-weight:400;">Bao gồm thuế và phí</div></td>
              <td style="text-align:right;color:#e82217;font-size:18px;padding-top:12px;">
                ${data.priceTotal} 
              </td>
            </tr>
          </table>
          <div style="margin-top:18px;font-weight:600">${data.paymentNote}</div>
          <div style="color:#767980;margin-top:6px;font-size:14px;">${data.paymentDetail}</div>
        </div>
      </div>
    </div>
  </div>
</body>
`;
