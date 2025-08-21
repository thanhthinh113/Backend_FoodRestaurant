# 🍔 Backend - Food Ordering 

**Mô tả:**
Backend này được xây dựng bằng **Node.js + Express + MongoDB** cho một ứng dụng web đặt đồ ăn. Nó cung cấp API REST để quản lý người dùng, món ăn, giỏ hàng, đơn hàng, và tích hợp thanh toán (ví dụ Stripe).

---

## 1. Giới thiệu

Backend cung cấp:

* Xác thực người dùng (register/login) với JWT.
* Quản lý món ăn: danh mục, thêm/sửa/xóa (admin).
* Giỏ hàng per-user.
* Tạo đơn hàng, trạng thái đơn hàng (pending, confirmed, delivering, delivered, canceled).
* Tích hợp thanh toán online (Stripe) — mô-đun tùy chọn.

Mục tiêu: dễ hiểu, dễ mở rộng và an toàn cho môi trường production.

---

## 2. Tính năng

* Đăng ký / Đăng nhập (JWT)
* Reset password (nếu triển khai)
* CRUD món ăn (có upload ảnh)
* Quản lý giỏ hàng
* Tạo & quản lý đơn hàng
* Tích hợp thanh toán (Stripe)
* Phân quyền (user / admin)
* Logging & error handling

---

## 3. Công nghệ & Kiến trúc

* Node.js (v14+/v16+)
* Express.js
* MongoDB (Atlas hoặc self-hosted) + Mongoose
* JSON Web Token (JWT)
* bcryptjs (hash password)
* multer (upload ảnh)
* dotenv (config)
* helmet, cors, express-rate-limit (bảo mật)

Kiến trúc: REST API → frontend (React/Next/Vue) hoặc mobile app.

---

## 4. Yêu cầu trước khi cài

* Node.js >= 14 (khuyến nghị 16+)
* npm hoặc yarn
* MongoDB (Atlas hoặc local)
* (Tùy) Stripe account cho thanh toán test

---

## 5. Cài đặt & Chạy nhanh

```bash
# Clone
git clone https://github.com/your-username/food-order-backend.git
cd food-order-backend

# Cài dependencies
npm install

# Tạo file .env (xem phần biến môi trường mẫu)
cp .env.example .env
# chỉnh sửa .env theo môi trường

# Chạy môi trường dev (ví dụ dùng nodemon)
npm run dev

# Hoặc build & chạy production
npm run build
npm start
```

