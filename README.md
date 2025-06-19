# 🧑‍💻 Ứng dụng Họp Trực Tuyến (Online Meeting App)

Ứng dụng họp trực tuyến giúp người dùng tạo và tham gia các cuộc họp video từ xa một cách dễ dàng và bảo mật. Hệ thống hỗ trợ gọi video nhóm, chia sẻ màn hình, nhắn tin thời gian thực và quản lý thành viên cuộc họp.

## LINK: https://virtualsecretary.click/

- Tài khoản thử nghiệm: quanlvan mk: 01/01/2003
- Tài khoản thử nghiệm: khankdk mk: 01/01/2003

## 🌐 Tính năng chính

- 🔒 Tạo và tham gia phòng họp với mã bảo mật
- 🎥 Gọi video nhóm thời gian thực (WebRTC)
- 💬 Trò chuyện (chat) trong phòng họp
- 👥 Quản lý thành viên và phân quyền (host, participant)
- 📱 Giao diện thân thiện trên cả máy tính và di động
- 📷 Hỗ trợ chia sẻ màn hình (screen sharing)
- 🔔 Thông báo khi có thành viên tham gia / rời cuộc họp
- 💬 Chuyển đổi giọng nói trong cuộc họp thành văn bản, cho phép sửa, tải về file word, pdf(Bản chuyển đổi gốc), Audio ghi âm.

## 🛠️ Công nghệ sử dụng

- **Frontend**: ReactJS + TypeScript + TailwindCSS
- **Backend**: Spring Boot
- **AI**: Whisper, Python
- **Giao tiếp thời gian thực**: WebRTC, Websocket / STOMP
- **Xác thực**: JWT
- **Triển khai**: Nginx, VPS

## 🚀 Cài đặt & chạy ứng dụng

### 1. Clone project

```bash
git clone https://github.com/vanquan19/ASR_Meeting_React.git
cd asr_meeting_react
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

```bash
Tạo file .env trong thư mục với nội dung .env.example
```

### 4. Khởi chạy ứng dụng

```bash
- Chạy môi trường dev
npm run dev
- build ứng dụng
npm run build

```
