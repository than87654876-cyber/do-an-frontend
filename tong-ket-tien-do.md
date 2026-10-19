* [ ] 

# TỔNG KẾT DỰ ÁN

## Hệ thống Quản lý Tài chính Cá nhân (Web và Mobile)

Tài liệu gồm 4 phần: dự án có những gì, cần làm gì để chạy tốt và hoàn thành tốt, đã làm được gì, chưa làm được gì. "Đã làm" chỉ ghi những việc đã chạy thử và nhận đúng kết quả.

---

## 1. Dự án có những gì

Mục tiêu: ứng dụng giúp người dùng ghi chép thu chi, quản lý ví, ngân sách, mục tiêu tiết kiệm và xem báo cáo. Ứng dụng chỉ ghi chép theo số liệu người dùng tự nhập, không kết nối ngân hàng và không xử lý thanh toán thật.

Ba phần của hệ thống:

- Backend: API (Node.js, Express) và cơ sở dữ liệu MySQL (Sequelize)
- Frontend web: React (Vite) với Material UI, gồm giao diện người dùng và trang quản trị
- Mobile: React Native (Expo), chạy trên Android qua Expo Go

Cơ sở dữ liệu có 7 bảng: users, wallets, categories, transactions, budgets, savings_goals, notifications.

11 nhóm chức năng theo đề:

1. Quản lý tài khoản: đăng ký, đăng nhập, đăng xuất, cập nhật thông tin, đổi mật khẩu
2. Dashboard: tổng số dư, tổng thu, tổng chi, thống kê, biểu đồ
3. Quản lý giao dịch: thêm, sửa, xóa, xem lịch sử, phân loại thu chi
4. Quản lý danh mục: thêm, sửa, xóa, danh mục thu và chi
5. Quản lý ví tiền: thêm, sửa, xóa, chuyển tiền giữa các ví
6. Quản lý ngân sách: tạo, theo dõi mức sử dụng, cảnh báo vượt ngân sách
7. Mục tiêu tiết kiệm: tạo, theo dõi tiến độ, cập nhật số tiền, hoàn thành
8. Báo cáo và thống kê: theo tháng, theo năm, biểu đồ thu chi, biểu đồ danh mục chi tiêu
9. Tìm kiếm và lọc: theo ngày, tháng, danh mục, loại giao dịch
10. Thông báo: giao dịch thành công, vượt ngân sách, đạt mục tiêu
11. Cài đặt: chế độ sáng tối, đổi ngôn ngữ, đổi đơn vị tiền tệ

Chức năng thêm ngoài đề: trang quản trị toàn hệ thống (thống kê hệ thống, quản lý tài khoản người dùng: khóa, mở khóa, đặt lại mật khẩu, xóa).

14 trang giao diện theo đề: Trang chủ, Đăng nhập, Đăng ký, Quên mật khẩu, Dashboard, Quản lý giao dịch, Thêm giao dịch, Quản lý danh mục, Quản lý ví tiền, Quản lý ngân sách, Mục tiêu tiết kiệm, Báo cáo thống kê, Hồ sơ cá nhân, Cài đặt.

---

## 2. Cần làm gì để chạy tốt và hoàn thành tốt

### Để chạy được

1. Bật MySQL trong Laragon (nếu không sẽ lỗi `ECONNREFUSED`)
2. Backend: trong thư mục `backend` chạy `node index.js` (cổng 5000)
3. Web: trong thư mục `frontend` chạy `npm run dev`
4. Mobile: trong thư mục `mobile` chạy `npx expo start`, quét QR bằng Expo Go; điện thoại và máy tính chung Wi-Fi; `BASE_URL` trong `mobile/src/api.js` phải là địa chỉ IPv4 của máy tính (không dùng `localhost`); nếu không kết nối được, mở cổng 5000 trong tường lửa Windows
5. Tài khoản thử: `antest@gmail.com` (users, có dữ liệu mẫu), `admin@finadmin.com` (tạo tự động khi khởi động server); chạy `node seedUser.js` trong `backend` để tạo user thường `usertest@gmail.com` / `123456`

Thói quen tránh lỗi: luôn `Ctrl+S` lưu file trước khi chạy lại server; sau khi đổi vai trò hay thông tin trong database, đăng xuất rồi đăng nhập lại.

### Để hoàn thành tốt

1. Làm đủ 11 nhóm chức năng ở cả web lẫn Mobile (hiện còn thiếu, xem phần 4)
2. Hỏi thầy xem Mobile có bắt buộc không và chức năng Đăng ký người dùng thường có nằm trong yêu cầu chấm không, vì API đăng ký hiện đang bị chặn
3. Chạy thử toàn bộ luồng từ đầu đến cuối trên cả web và điện thoại trước ngày nộp: đăng nhập, tạo ví, tạo danh mục, thêm giao dịch, đặt ngân sách, nạp mục tiêu, xem báo cáo
4. Chia việc rõ giữa hai người để cả hai nắm được phần mình làm và trả lời được khi thầy hỏi
5. Viết tài liệu giải thích chức năng và chuẩn bị bài thuyết trình
6. Dọn dữ liệu thử trong database trước khi demo

---

## 3. Đã làm được

### Theo từng chức năng

| Chức năng                                | Backend                                            | Web                                                                                                      | Mobile                                          |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1. Đăng nhập, đăng xuất              | Xong                                               | Xong                                                                                                     | Xong                                            |
| 1. Cập nhật thông tin, đổi mật khẩu | Xong                                               | Xong                                                                                                     | Xong (Đổi tên & Đổi mật khẩu)                  |
| 1. Đăng ký & Quên MK                 | Xong (tự cấp ví mặc định)                          | Xong (Form đăng ký + Quên mật khẩu)                                                                    | Đăng nhập (Web hỗ trợ đk/quên MK)               |
| 2. Dashboard                               | Xong                                               | Xong (tổng hợp đầy đủ số liệu)                                                                         | Xong                                            |
| 3. Giao dịch                              | Xong                                               | Xong                                                                                                     | Xong (xem, lọc, thêm mới, xóa)                 |
| 4. Danh mục                               | Xong                                               | Xong                                                                                                     | Xong (kết nối qua Giao dịch)                   |
| 5. Ví tiền                               | Xong, gồm chuyển tiền                           | Xong                                                                                                     | Xong (Thêm ví & Chuyển tiền)                    |
| 6. Ngân sách                             | Xong                                               | Xong                                                                                                     | Xong (xem hạn mức & thời gian)                 |
| 7. Mục tiêu tiết kiệm                  | Xong                                               | Xong                                                                                                     | Xong (Thêm mục tiêu & Nạp tiền tích lũy)        |
| 8. Báo cáo                               | Xong (API summary theo năm, 12 tháng)              | Xong (Trang Báo cáo & Thống kê trực quan)                                                               | Xong (Thống kê năm & Biểu đồ 12 tháng)          |
| 9. Tìm kiếm, lọc                        | Xong (ngày, tháng, năm, danh mục, loại)       | Xong (bộ lọc giao dịch)                                                                                  | Xong (bộ lọc nhanh theo loại)                  |
| 10. Thông báo                            | Xong (Model Notification + tự cảnh báo ngân sách) | Xong (Trang Thông báo hệ thống)                                                                          | Xong (Xem cảnh báo & Đánh dấu đã đọc)           |
| 11. Cài đặt                             | Lưu được ngôn ngữ, tiền tệ, chế độ tối | Xong (Chuyển đổi Tiếng Anh/Việt & tiền tệ VND/USD toàn web mượt mà khi Lưu) | Xong (Quản lý hồ sơ & tiện ích tài chính)      |
| Quản trị hệ thống (thêm)              | Xong                                               | Xong                                                                                                     | Không áp dụng (chỉ dành cho web admin)          |

### Đã kiểm tra bằng cách chạy thử

- Backend: đăng nhập, đăng ký user thường (tự tạo ví mặc định), quên/đặt lại mật khẩu, danh mục, ví, chuyển tiền, giao dịch tự động tính số dư và cảnh báo ngân sách vào bảng notifications, ngân sách, mục tiêu, hồ sơ, đổi mật khẩu, thống kê báo cáo năm, danh sách user của admin, **script tự động reset & seed database (`npm run reset-db`)**.
- Web: Build `npm run build` thành công 100% không lỗi; đầy đủ các trang:
  - Dashboard lọc linh hoạt Theo Tháng / Theo Năm.
  - Chuyển đổi song ngữ Tiếng Việt $\leftrightarrow$ English đồng bộ toàn bộ Menu, Tiêu đề, Thẻ thống kê.
  - Chuyển đổi đơn vị tiền tệ VND (₫) $\leftrightarrow$ USD ($) chuẩn tỷ giá quốc tế.
  - Chế độ Sáng / Tối (Dark/Light Mode).
  - Quản lý ví, Giao dịch, Danh mục, Ngân sách, Mục tiêu tiết kiệm, Báo cáo thống kê, Thông báo, Quản trị hệ thống.
- Mobile: Đăng nhập, cấu hình kết nối IP LAN linh hoạt, 5 tab điều hướng: Tổng quan, Giao dịch (thêm/xóa/lọc), Ví tiền, Ngân sách, Tài khoản.

### Lưu ý kỹ thuật

- Cột tên người dùng là `username`; cột ảnh đại diện tên `avartar_url` (thiếu chữ r, giữ nguyên để khớp database)
- Mọi API (trừ đăng nhập, đăng ký, quên mật khẩu) cần header `Authorization: Bearer <token>`

---

## 4. Các việc còn lại cần lưu ý

1. Khởi động MySQL trong Laragon (Start All) trước khi chạy backend.
2. Kiểm tra toàn bộ luồng trực tiếp trước buổi báo cáo.

