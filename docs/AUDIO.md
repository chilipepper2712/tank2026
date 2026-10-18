# Âm thanh: danh sách file cần có

Thả file vào `public/audio/`, đúng tên (chữ thường, không dấu). Thiếu file nào thì game im lặng ở chỗ đó, không báo lỗi.
Sau khi thêm file phải build lại (`npm run build`) để cập nhật `manifest.json`, rồi deploy.
Kiểm tra: mở game với đuôi `?sounds` để xem file nào đã có, bấm nghe từng tiếng.

**Quy cách:** MP3 mono 128 kbps cho âm ngắn; **WAV** cho 3 file lặp (MP3 có khoảng lặng đầu file làm vòng lặp bị "cạch"). Không dùng OGG (Safari). Đoạn im ở đầu file được game tự cắt. Biến thể đặt `_1`, `_2`, `_3` (chọn ngẫu nhiên, thêm đổi cao độ nhẹ).

| Tên file | Khi nào phát | Bản |
|---|---|---|
| `cannon` | pháo chính của xe mình bắn | 3 |
| `mg_burst` | súng máy (tự động của xe mình, xe bọc thép địch/đồng minh) | 2 |
| `missile_launch` | tên lửa của xe mình rời bệ | 1 |
| `reload_ready` | một tên lửa nạp xong lên giá | 1 |
| `repair_start` / `repair_done` | bắt đầu / xong một lượt sửa | 1 |
| `pickup` | nhặt thùng | 1 |
| `engine_idle` (lặp) | động cơ khi xe đứng yên | 1 |
| `engine_move` (lặp) | động cơ khi xe chạy (hai file pha trộn theo tốc độ) | 1 |
| `hit_armor` | đạn trúng xe | 3 |
| `hit_ricochet` | đạn nhẹ (súng máy, pháo xe bọc thép) trúng xe giáp dày | 1 |
| `explode_small` | đạn nổ trúng đất/nhà, bom, drone nổ | 2 |
| `explode_vehicle` | xe nổ tung | 2 |
| `building_collapse` | phá từ 10 ô công trình trong một vụ nổ | 1 |
| `explode_mine` | mìn của lính nổ | 1 |
| `enemy_cannon` | pháo địch (có vị trí: xa thì nhỏ, đục, lệch trái/phải) | 2 |
| `enemy_rpg` | RPG của lính, tên lửa bán tải | 1 |
| `drone_loop` (lặp) | drone địch bay gần: to dần khi tới gần | 1 |
| `kamikaze_whine` | drone cảm tử bắt đầu khóa xe (kéo dài 1,5 giây) | 1 |
| `strike_warning` | còi báo A-10 (2 giây trước khi tới) | 1 |
| `jet_flyby` | máy bay lướt qua | 1 |
| `gau8_burst` | pháo 30 mm quét | 1 |
| `bomb_whistle` | bom rít (cùng lúc với máy bay vào) | 1 |
| `ui_click` | bấm nút trong menu | 1 |
| `ui_alert` | cảnh báo: đoàn xe dừng, mất đồng đội, mất lớp giáp phụ | 1 |
| `streak_double` / `streak_ace` / `streak_legend` | câu cổ vũ chuỗi hạ địch (2 / 5 / 10) | 1 |
| `mission_win` / `mission_lose` | thắng / thua | 1 |
| `stage_clear` | qua chặng (màn 10), tiếp viện tới (màn 8) | 1 |

## Cách hoạt động (để chỉnh)
- Âm có vị trí (đạn trúng, nổ, pháo địch…): nhỏ dần tới hết ở 180 m, đục hơn khi xa, lệch trái/phải theo vị trí so với xe mình.
- Mỗi loại có giới hạn số tiếng phát cùng lúc và khoảng cách tối thiểu giữa hai lần phát, tránh nổ liên tục thành một mớ. Sự kiện xảy ra với xe mình luôn được phát.
- Chỉnh to/nhỏ từng âm: bảng `SOUNDS` và `LOOPS` trong `src/audio/Sfx.ts`.
- Âm lượng tổng và nút tắt tiếng nằm trong màn tạm dừng, lưu trên máy.
- Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên. Công tắc im lặng vật lý của iPhone có thể làm Web Audio câm (hành vi của iOS).
