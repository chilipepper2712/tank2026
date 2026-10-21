# Âm thanh: danh sách file cần có

Thả file vào `public/audio/`, đúng tên (chữ thường, không dấu). Thiếu file nào thì game im lặng ở chỗ đó, không báo lỗi.
Sau khi thêm file phải build lại (`npm run build`) để cập nhật `manifest.json`, rồi deploy.
Kiểm tra: mở game với đuôi `?sounds` để xem file nào đã có, bấm nghe từng tiếng.

**Quy cách:** MP3 mono 128 kbps cho âm ngắn; **WAV** cho 4 file lặp (MP3 có khoảng lặng đầu file làm vòng lặp bị "cạch"). Không dùng OGG (Safari). Đoạn im ở đầu file được game tự cắt. Biến thể đặt `_1`, `_2`, `_3` (chọn ngẫu nhiên, thêm đổi cao độ nhẹ).

| Tên file | Khi nào phát | Bản |
|---|---|---|
| `cannon` | pháo chính của xe mình bắn | 3 |
| `mg_burst` | súng máy: **một loạt 5 viên**. Súng máy tự động của xe mình bắn 10 viên/giây nên game phát file này nửa giây một lần; loạt 3 viên của xe bọc thép phát một lần mỗi loạt. Bản `_2` có đuôi kéo | 2 |
| `autocannon_burst` | pháo tự động của xe bọc thép (của mình và đồng minh): một loạt 3 viên, to và đục hơn súng máy. Chưa có file thì mượn `mg_burst` | 1 |
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
| `explode_building` | đạn trúng công trình, làm vỡ dưới 10 ô (chưa có thì dùng `explode_small`) | 2 |
| `building_collapse` | phá từ 10 ô công trình trong một vụ nổ | 1 |
| `explode_mine` | mìn của lính nổ | 1 |
| `crush_wall` | xe ủi sập tường thấp, nhà đất (tạm làm bằng code) | 1–2 |
| `crush_tree` | xe cán gãy cây (tạm làm bằng code) | 1–2 |
| `enemy_cannon_destroyer` | pháo của pháo tự hành diệt tăng (td) địch; chưa có thì dùng `enemy_cannon` | 1 |
| `enemy_cannon` | pháo địch (có vị trí: xa thì nhỏ, đục, lệch trái/phải) | 2 |
| `enemy_rpg` | RPG của lính, tên lửa bán tải | 1 |
| `drone_loop` (lặp) | drone địch bay gần: to dần khi tới gần | 1 |
| `kamikaze_whine` | tiếng beep khi drone cảm tử khóa mục tiêu (kéo dài 1,5 giây) | 1 |
| `kamikaze_rush` | beep dồn dập khi drone lao xuống, để hù người chơi (game phát to hơn các âm khác) | 1 |
| `strike_warning` | còi báo A-10 (2 giây trước khi tới) | 1 |
| `jet_flyby` | máy bay lướt qua | 1 |
| `gau8_burst` | pháo 30 mm quét | 1 |
| `bomb_whistle` | bom rít (cùng lúc với máy bay vào) | 1 |
| `ui_click` | bấm nút trong menu | 1 |
| `ui_alert` | cảnh báo: đoàn xe dừng, mất đồng đội, mất lớp giáp phụ | 1 |
| `streak_double` / `streak_ace` / `streak_legend` | giọng AI khi hạ liên tiếp 2 / 5 / 10 mục tiêu: "Double kill" / "Five down. Ace" / "Ten confirmed. Legendary" (đi chung hàng chờ với các câu `vo_*`) | 1 |
| `mission_win` / `mission_lose` | thắng / thua | 1 |
| `stage_clear` | qua chặng (màn 10), tiếp viện tới (màn 8) | 1 |
| `flare_launch` | bắn pháo sáng (xe mình hoặc địch, ban đêm) | 1 |
| `rain_loop` (lặp) | mưa rơi trên thân xe | 1 |
| `thunder` | sấm sau tia chớp khi mưa, trễ 0,4–1,4 giây | 2 |

## Chỉnh sau lần chơi thử của owner (2026-10-21)
- Bỏ câu "Missile ready" (`vo_missile_ready`) và tiếng cán xe hơi (`crush_car`): báo quá dày, gây phiền.
- `crush_wall` nhỏ còn một nửa. Các tiếng cảnh báo (`ui_alert`, `strike_warning`, `vo_drone`, `vo_armor_low`) nhỏ bớt 20%.
- "Air support ready" chỉ báo đúng một lần, lúc thanh yểm trợ vừa đầy (trước đó bị lặp mỗi lần hạ địch).
- Câu cổ vũ chỉ nói khi chữ còn trên màn hình: phải chờ hơn 0,6 giây sau câu khác thì bỏ.

## Giọng AI trong xe (2026-10-21)
Xe có AI trợ lý, báo bằng giọng robot. Tiếng Anh, câu ngắn. Mỗi lần chỉ một câu: câu đến khi câu khác đang nói thì chờ, chờ quá 2,5 giây thì bỏ. Chưa có file thì game giữ âm báo cũ (cột cuối).

| Tên file | Câu | Khi nào | Chưa có file thì |
|---|---|---|---|
| `vo_repair_done` | "Repairs complete" | sửa xong | `repair_done` |
| `vo_airstrike_ready` | "Air support ready" | thanh yểm trợ đầy | im |
| `vo_drone` | "warning. drone dectected" | drone địch vào gần 90 m, không lặp lại trong 20 giây | im |
| `vo_armor_low` | "armor low" | giáp tụt dưới 25% (nói lại sau khi sửa lên trên 40% rồi tụt tiếp) | im |
| `vo_stage_clear` | "Sector clear" | qua chặng (huấn luyện vẫn dùng chime `stage_clear`) | `stage_clear` |
| `vo_reinforce` | "Reinforcements arriving" | đồng đội tới hỗ trợ, đoàn giải vây tới | `stage_clear` |
| `vo_win` / `vo_lose` | "Mission complete" / "Vehicle lost" | 1,2 giây sau nhạc thắng / thua | im |

## Âm làm bằng code (2026-10-21)
Những âm đơn giản được tạo ngay trong game (`src/audio/synth.ts`), không cần file, không tốn dung lượng tải:
`ui_click`, `ui_alert`, `pickup`, `repair_done`, `stage_clear`, `mission_win`, `mission_lose`, `thunder`, `rain_loop`, và tạm thời `crush_wall`, `crush_tree`. (`strike_warning`, `bomb_whistle`, `flare_launch` đã có file của owner.)
Bỏ file cùng tên vào `public/audio/` thì file được dùng thay.

Âm **mượn tạm** khi chưa có file: `autocannon_burst` dùng `mg_burst`, `enemy_cannon_destroyer` dùng `enemy_cannon`.



## Cách hoạt động (để chỉnh)
- Âm có vị trí (đạn trúng, nổ, pháo địch…): nhỏ dần tới hết ở 180 m, đục hơn khi xa, lệch trái/phải theo vị trí so với xe mình.
- Mỗi loại có giới hạn số tiếng phát cùng lúc và khoảng cách tối thiểu giữa hai lần phát, tránh nổ liên tục thành một mớ. Sự kiện xảy ra với xe mình luôn được phát.
- Chỉnh to/nhỏ từng âm: bảng `SOUNDS` và `LOOPS` trong `src/audio/Sfx.ts`.
- Âm lượng tổng và nút tắt tiếng nằm trong màn tạm dừng, lưu trên máy.
- Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên. Công tắc im lặng vật lý của iPhone có thể làm Web Audio câm (hành vi của iOS).
