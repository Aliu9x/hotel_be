export const hotelBookingOwnerNotificationTemplate = (data: {
  hotelName: string;
  bookingCode: string;
  bookingTime: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkin: string;
  checkinNote?: string;
  checkout: string;
  checkoutNote?: string;
  rooms: number;
  nights: number;
  roomType: string;
  adults: number;
  children: number;
  specialRequests?: string;
  totalPrice: string;
  paymentType: string;
}) => `
<body style="margin:0;padding:0; background:#f5f8fc;">
  <div style="max-width:650px;margin:32px auto;border-radius:12px;background:#fff;box-shadow:0 2px 8px #d3dde9;border:1px solid #e0e8f0;overflow:hidden;">
    <div style="background:#2596ff; color:#fff; padding:28px 32px; border-radius:12px 12px 0 0;">
      <h2 style="margin:0;font-size:26px;">🛎️ Đơn đặt phòng mới tại <span style="color:#ffdb52">${data.hotelName}</span></h2>
      <div style="font-size:18px;">
        <b>Mã đơn:</b> ${data.bookingCode}
      </div>
      <div style="font-size:15px;">Thời gian đặt: ${data.bookingTime}</div>
    </div>
    <div style="padding:30px 32px 22px 32px; font-size:16px; color:#333;">
      <h3 style="color:#2596ff; margin-top:0;">Thông tin khách đặt phòng</h3>
      <table style="width:100%;font-size:1em;">
        <tr>
          <td style="width:160px;color:#555">Tên khách:</td>
          <td><b>${data.guestName}</b></td>
        </tr>
        <tr>
          <td style="color:#555">Số điện thoại:</td>
          <td><a href="tel:${data.guestPhone}" style="color:#2596ff;text-decoration:none">${data.guestPhone}</a></td>
        </tr>
        <tr>
          <td style="color:#555">Email khách:</td>
          <td><a href="mailto:${data.guestEmail}" style="color:#2596ff;text-decoration:none">${data.guestEmail}</a></td>
        </tr>
      </table>
      <div style="height:18px"></div>
      <h3 style="color:#2596ff;">Chi tiết đơn đặt phòng</h3>
      <table style="width:100%;font-size:1em;">
        <tr>
          <td style="width:160px;color:#555">Nhận phòng:</td>
          <td><b>${data.checkin}</b> ${data.checkinNote ? `<span style="color:#888;font-size:13px;">(${data.checkinNote})</span>` : ''}</td>
        </tr>
        <tr>
          <td style="color:#555">Trả phòng:</td>
          <td><b>${data.checkout}</b> ${data.checkoutNote ? `<span style="color:#888;font-size:13px;">(${data.checkoutNote})</span>` : ''}</td>
        </tr>
        <tr>
          <td style="color:#555">Loại phòng:</td>
          <td>${data.roomType}</td>
        </tr>
        <tr>
          <td style="color:#555">Số lượng phòng:</td>
          <td>${data.rooms}</td>
        </tr>
        <tr>
          <td style="color:#555">Số đêm:</td>
          <td>${data.nights}</td>
        </tr>
        <tr>
          <td style="color:#555">Số người lớn:</td>
          <td>${data.adults}</td>
        </tr>
        <tr>
          <td style="color:#555">Số trẻ em:</td>
          <td>${data.children}</td>
        </tr>
        <tr>
          <td style="color:#555">Yêu cầu đặc biệt:</td>
          <td>${data.specialRequests ? data.specialRequests : '<span style="color:#888">(Không)</span>'}</td>
        </tr>
      </table>
      <div style="height:22px"></div>
      <div style="font-size:17px;color:#37b137;">
        <b>Tổng giá trị đơn: </b> 
        <span>${data.totalPrice}</span>
        <span style="font-size:15px; color:#666;">(${data.paymentType})</span>
      </div>
    </div>
    <div style="padding:14px 32px 18px 32px; background:#f3f8fc; font-size:14px; color:#888;">
      <div>Vui lòng kiểm tra thông tin và liên hệ khách khi cần xác nhận/trao đổi thêm nhé.</div>
      <div style="margin-top:2px;">Mọi thắc mắc hoặc cần hỗ trợ có thể liên hệ bộ phận hỗ trợ khách sạn.</div>
    </div>
  </div>
</body>
`;
