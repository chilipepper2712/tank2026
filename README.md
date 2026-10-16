# tank2026

Game bắn xe tăng chạy trên trình duyệt, lấy cảm hứng từ Tank 1990 (Battle City). Ưu tiên điện thoại cầm ngang.

- Thiết kế: [docs/GDD.md](docs/GDD.md)
- Bản thử điều khiển ban đầu: [prototype/control-lab.html](prototype/control-lab.html)

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev      # mở http://localhost:5173 (cùng mạng wifi thì điện thoại mở được bằng IP của máy)
npm run build    # tạo bản phát hành trong thư mục dist/
```

Mở thẳng vào trận: thêm `?play=tank` hoặc `?play=apc` vào địa chỉ.

## Cấu trúc

- `src/config.ts`: mọi con số cân bằng (chất liệu, class, địch)
- `src/world/`: lưới công trình phá hủy được, màn 1
- `src/render/`: vẽ mặt đất, nhà, xe, mảnh vỡ
- `src/game/`: vòng lặp trận đấu, điều khiển, AI tìm đường
