# Đưa Tank 2026 lên itch.io

## 1. Tạo gói upload
`npm run itch` → ra file **`tank2026-itch.zip`** ở thư mục dự án (Claude chạy, gửi file cho chủ dự án).
Bản này khác bản GitHub Pages ở chỗ **ẩn các công cụ thử**: nút "Mở mọi màn để thử", AI địch, thêm địch mới, thông tin cảm ứng, công tắc xe voxel. Các cài đặt đó luôn ở mặc định.
Đã thử: chạy trong khung iframe khác nguồn như itch (960×540 trên máy tính, 844×390 trên điện thoại), lưu tiến trình được, không lỗi.

## 2. Tạo trang trên itch.io (chủ dự án làm, cần tài khoản)
Dashboard → **Create new project**:

| Mục | Chọn |
|---|---|
| Kind of project | **HTML** |
| Uploads | tải `tank2026-itch.zip` lên, đánh dấu **This file will be played in the browser** |
| Viewport dimensions | **960 × 540** |
| Embed options | bật **Mobile friendly**, Orientation **Landscape**; bật **Fullscreen button**; bật **Click to launch in fullscreen** (trên điện thoại game cần toàn màn hình) ; tắt Automatically start on page load; tắt Enable scrollbars |
| Classification | Games · Genre **Action** (hoặc Shooter) |
| Tags (gợi ý) | `tanks`, `top-down`, `shooter`, `destructible-environment`, `voxel`, `mobile`, `singleplayer`, `military` |
| Pricing | Free hoặc "No payment" (portfolio) |
| Cover image | `docs/itch/cover.png` (630 × 500, **ảnh tạm** ghép từ ảnh chụp trong game; thay bằng ảnh bìa thật khi có) |
| Screenshots | `docs/itch/shot-1-city.png` … `shot-5-mountain.png` (1280 × 720) |
| Visibility | để **Draft** khi thử, rồi **Restricted** (gửi link cho vài người) trước khi **Public** |

Cập nhật bản mới: Edit game → Uploads → xóa file cũ, tải zip mới (giữ tick "played in the browser").

## 3. Nội dung trang (bản nháp, chủ dự án viết lại)

**Tiếng Việt**
> Tank 2026 là game bắn xe tăng góc nhìn từ trên xuống, lấy cảm hứng từ Battle City. Lái xe tăng hoặc xe bọc thép qua phố, cảng, sa mạc và đèo núi; nhà cửa vỡ theo từng phát đạn.
>
> - 10 màn chiến dịch: tiêu diệt, chiếm điểm, cố thủ, hộ tống đoàn xe, trận cuối nhiều chặng
> - 2 loại xe, nâng cấp giữ lại sau mỗi màn thắng, đồng đội drone và robot
> - Giáp tính theo mặt: đánh sườn và đánh sau mới đau
> - Gọi A-10 ném bom, đánh đêm với pháo sáng, trời mưa sấm chớp
> - Màn huấn luyện cho người mới
>
> Điều khiển: điện thoại nằm ngang (kéo góc trái để lái, chạm địch để khóa) hoặc máy tính (WASD, chuột, Space, Q, R, F, E).

**English**
> Tank 2026 is a top-down tank shooter inspired by Battle City. Drive a tank or an APC through city blocks, a harbour, desert and mountain passes, and watch buildings break apart shot by shot.
>
> - 10 campaign missions: destroy, capture, hold, escort a convoy, and a multi-stage finale
> - 2 vehicles, upgrades you keep after each win, drone and robot companions
> - Directional armour: flank shots hurt, frontal shots bounce
> - Call in an A-10, fight at night by flare light, play through rain and lightning
> - A training ground for first-timers
>
> Controls: phone in landscape (drag bottom-left to drive, tap an enemy to lock on) or desktop (WASD, mouse, Space, Q, R, F, E).
>
> The game is in Vietnamese for now; an English version is planned.

## 4. Còn thiếu trước khi Public
- [ ] Comic cốt truyện (chủ dự án; khung sẵn trong `src/story.ts`)
- [ ] Âm thanh: danh sách 34 file trong `docs/AUDIO.md`
- [ ] Viết lại chữ trong game (`src/lang/vi.txt`)
- [ ] Ảnh bìa thật thay `docs/itch/cover.png`
- [ ] Chơi thử độ khó lần cuối (cân bằng lần 1 còn đang thử), fps trên iPhone kể cả màn mưa và màn đêm
- [ ] Đề xuất: bản tiếng Anh (`en.txt` + nút chọn ngôn ngữ trong menu) — người chơi itch phần lớn không đọc tiếng Việt. Nên dịch **sau** khi chữ tiếng Việt đã viết lại xong, để dịch một lần.
