export const bookingPdfTemplate = (data: {
  bookingReferenceNo: string;
  guestName: string;
  countryOfResidence: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  roomCount: number;
  extraBeds: number;
  adults: number;
  children: number;
  roomType: string;
  promotion?: string;
  checkIn: string;
  checkOut: string;
  paymentNote?: string;
  customerNote?: string;
  price: string;
}) => `
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #fff; font-size: 15px; }
    .page { max-width:880px; margin:0 auto; border:1.2px solid #444;}
    .header-row { display:flex; justify-content:space-between; align-items:center; padding:23px 28px 8px 32px;}
    .logo
      { display:flex; flex-direction:column; align-items:flex-start;}
    .brand-bar {
      padding:0 32px 0 32px;
      background:#eaeaea;
      display:flex;
      align-items:center;
      gap:18px;
      height:32px;
      font-size:15px;
      color:#555;
      font-weight:500;
      letter-spacing:0.5px;
    }
    .brand-bar span {
      color:#fff;
      background:#bbb; 
      border-radius:3px;
      padding:1px 6px;
      margin-right:4px;
      font-size:15px;
      font-weight:550;
      text-transform:uppercase;
    }

    .conf-title {
      font-size:32px;
      font-weight:700;
      letter-spacing:0.5px;
      color:#111;
      margin-bottom:2px;
    }
    .conf-title .red {
      color:#d00;
      font-weight:900;
      letter-spacing:1px;
    }
    .top-desc {
      margin: 0 32px;
      font-size:15px;color:#2c2c2c;
      border-bottom:1.2px solid #bbb;
      padding:4px 0 6px 0;
    }

    .main-row { 
      display:flex;
      padding:24px 32px 0 32px;
      gap:22px;
    }
    .col-l {
      flex:5;
    }
    .col-r {
      flex:4; background:#f3f3f3; 
      padding:13px 14px 10px 13px;
    }
    .info-table td {
      padding-bottom:5px;
      vertical-align:top;
      font-size:15px;
    }
    .info-table .label {
      color:#444;
      min-width: 146px;
      width:146px;
    }
    .info-table .label-small {
      color:#858585;
      font-size:12.5px;
      min-width:146px;
    }
    .info-table .bold { font-weight:600; }
    .info-table .multi {
      padding:3px 0;
    }
    .main-box { 
      border:1.2px solid #ccc; 
      border-radius:5px;
      background:#fff;
      margin-bottom:7px;
    }

    .right-table { width:100%; font-size:15px;}
    .right-table td {
      padding:7px 8px;
      border-bottom:1px solid #e7e7e7;
      font-size:15px;
    }
    .right-table tr:last-child td { border-bottom:none;}
    .right-table .label { color:#444; min-width:130px; }
    .right-table .bold { font-weight:700;}
    .right-announce {
      margin-top:7px;
      background:#eaeaea;
      color:#3c3c3c;
      font-size:14px;
      padding:10px 12px;
      border-radius:3px;
    }
    .check-table th, .check-table td {
      border:1.3px solid #b0b0b0;
      padding:11px 10px;
    }
    .check-table th {
      background: #ededed;
      font-weight:bold;
      font-size:15px;
      text-align:left;
    }
    .check-table td { font-size:15px;}
    .pay-table { margin-top:7px; font-size:15px;}
    .pay-table .label { font-size:14px; color:#666 }
    .pay-table .highlight { color:#d00; font-weight:bold;}
    .pay-table .note {color:#d83b00;}
    .pay-table .cusnote { color:#b80000; font-weight:600;}
    .summary-box {
      border:1px solid #bbb;
      margin-top:9px; 
      background:#f2f4fa;
      padding:7px 10px 7px 13px;
      color:#4d4d4d;
      font-size:14.5px;
      border-radius:3px;
    }
    .footer {
      margin:20px 32px 28px 32px;
      font-size:13.5px;
      color:#1a1a1a;
      line-height:1.7;
    }
    .signed-stamp {
      width:170px; border:1px solid #bbb; float:right; margin-top:15px; text-align:center;padding:24px 4px 6px 4px;min-height:80px;
      color:#585858;font-size:12.5px;
      border-radius:5px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-row">
      <div>
        <div class="conf-title">Booking <span class="red">Confirmation</span></div>
      </div>
    </div>
    <div class="top-desc">
      Khi nhận phòng, bạn vui lòng xuất trình bản điện tử hoặc bản in giấy của xác nhận đặt phòng.
    </div>
    <div class="main-row">
      <div class="col-l">
        <table class="info-table" style="width:100%;margin-bottom:8px;">
          <tr>
            <td class="label">Booking Reference No :</td>
            <td class="bold">${data.bookingReferenceNo}</td>
          </tr>
          <tr>
            <td class="label-small">Mã Số Tham Chiếu Đặt Phòng :</td>
            <td></td>
          </tr>
          <tr>
            <td class="label">Client :</td>
            <td>${data.guestName}</td>
          </tr>
          <tr>
            <td class="label-small">Khách :</td>
            <td></td>
          </tr>
          <tr>
            <td class="label">Country of Residence :</td>
            <td>${data.countryOfResidence}</td>
          </tr>
          <tr>
            <td class="label-small">Quốc gia cư trú :</td>
            <td></td>
          </tr>
          <tr>
            <td class="label">Property :</td>
            <td>
              <b>${data.hotelName}</b>
            </td>
          </tr>
          <tr>
            <td class="label-small">Khách sạn :</td>
            <td></td>
          </tr>
          <tr>
            <td class="label">Address :</td>
            <td>
              <span style="font-weight:700">${data.hotelAddress}</span>
            </td>
          </tr>
          <tr>
            <td class="label-small">Địa chỉ :</td>
            <td></td>
          </tr>
          <tr>
            <td class="label">Property Contact Number :</td>
            <td><b>${data.hotelPhone}</b></td>
          </tr>
          <tr>
            <td class="label-small">Số điện thoại khách sạn :</td>
            <td></td>
          </tr>
        </table>
        <div class="summary-box">
          Chính sách hủy phòng: Không đến khách sạn hoặc chỗ nghỉ sẽ được giải quyết như là Vắng Mặt và sẽ phải trả một khoản tiền là 100% giá trị đặt phòng.<br/>
          (Quy định của khách sạn).
        </div>
      </div>
      <div class="col-r">
        <table class="right-table">
          <tr>
            <td class="label">Number of Rooms:<br/><span class="label-small">Số Phòng :</span></td>
            <td style="text-align:right;" class="bold">${data.roomCount}</td>
          </tr>
          <tr>
            <td class="label">Number of Extra Beds:<br/><span class="label-small">Số Giường Thêm :</span></td>
            <td style="text-align:right">${data.extraBeds}</td>
          </tr>
          <tr>
            <td class="label">Number of Adults:<br/><span class="label-small">Số Người Lớn :</span></td>
            <td style="text-align:right">${data.adults}</td>
          </tr>
          <tr>
            <td class="label">Number of Children:<br/><span class="label-small">Số Trẻ Em :</span></td>
            <td style="text-align:right">${data.children}</td>
          </tr>
          <tr>
            <td class="label">Room Type:<br/><span class="label-small">Loại Phòng :</span></td>
            <td style="text-align:right;font-weight:700">${data.roomType}</td>
          </tr>
          <tr>
            <td class="label">Promotion:<br/><span class="label-small">Khuyến Mãi :</span></td>
            <td style="text-align:right">${data.promotion || '-'}</td>
          </tr>
        </table>
        <div class="right-announce">
          Để biết đầy đủ các chi tiết và điều kiện Khuyến Mãi xin xem trong email xác nhận.
        </div>
      </div>
    </div>
    <div style="padding:14px 32px 6px 32px;">
      <table class="check-table" style="margin-bottom:12px;width:630px;">
        <tr>
          <th style="width:285px">Arrival /<br/>Ngày đến :</th>
          <th style="width:285px">Departure /<br/>Ngày đi :</th>
        </tr>
        <tr>
          <td style="font-size:17px;font-weight:600;">${data.checkIn}</td>
          <td style="font-size:17px;font-weight:600;">${data.checkOut}</td>
        </tr>
      </table>
      <table class="pay-table" style="width:99%;">
        <tr>
          <td class="label" style="width:140px;vertical-align:top">Payment Details:<br/><span class="label-small">Chi Tiết Thanh Toán :</span></td>
          <td>
            <div class="highlight">Vui lòng lưu ý: ${data.paymentNote}</div>
          </td>
        </tr>
      </table>
      <div class="summary-box">
        <b>Giá trị thanh toán:</b> <span style="font-size:17px;">${data.price}</span>
      </div>
    </div>
    <div class="footer">
      <b>GHI CHÚ:</b><br/>
      - Khi nhận phòng, quý khách phải xuất trình giấy tờ tùy thân có ảnh cùng với.... (thêm các ghi chú tuỳ thực tế bạn muốn vào đây giống ảnh mẫu)<br/>
      - Tất cả các yêu cầu đặc biệt được đáp ứng tùy theo khả năng của khách sạn khi khách nhận phòng.<br/>
    </div>
  </div>
</body>
</html>
`;
