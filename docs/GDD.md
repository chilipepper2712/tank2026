# Tank 2026 — Tài liệu thiết kế (GDD)

Trạng thái: **bản nháp 1**. Mục nào ghi **[CHỐT]** là đã thống nhất. Mục nào ghi **[ĐỀ XUẤT]** là số liệu hoặc ý chưa được duyệt.

## 1. Tổng quan

- **Thể loại:** bắn xe tăng góc nhìn từ trên xuống, chơi đơn, cảm hứng từ Battle City (Tank 1990) nhưng hiện đại hóa: môi trường phá hủy tự do, nâng cấp, thời tiết, ngày đêm.
- **Nền tảng:** trình duyệt. **Ưu tiên điện thoại cầm ngang**, có hỗ trợ desktop (chuột + bàn phím) và gamepad.
- **Mục đích:** portfolio, phát hành trên itch.io. Không có deadline.
- **Phạm vi bản pilot:** 10 màn, 2 class, 3 khu vực (đô thị chiếm phần lớn).

## 2. Trụ cột thiết kế

1. **Phá hủy có ý nghĩa chiến thuật.** Bắn sập tường để mở đường, phá nhà để chặn đường, đống đổ nát và xác xe thành vật che chắn.
2. **Vị trí quan trọng hơn ngắm.** Ngắm được hỗ trợ tự động. Kỹ năng nằm ở chỗ đứng, góc tấn công (giáp trước/hông/sau), thời điểm bắn và thứ tự mục tiêu.
3. **Đọc chiến trường rõ trên màn hình nhỏ.** Không bị bắn từ chỗ không nhìn thấy, ít chỉ báo rối mắt.

## 3. Camera [CHỐT]

- Góc **nghiêng 3/4** (kiểu Brawl Stars / Tank Hero), zoom mặc định **85%**.
- Camera bám xe và **lệch về phía mục tiêu đang nhắm** (look-ahead).
- Nhà cao che xe người chơi thì hiện viền xe.
- Mũi tên ở mép màn hình chỉ địch ngoài tầm nhìn (đỏ khi địch đã nhắm vào mình). Vệt đỏ quanh tâm màn hình cho biết hướng đạn tới.
- **Luật công bằng:** địch thường chỉ khai hỏa khi đã xuất hiện trên màn hình người chơi. Địch bắn tỉa (nếu có) phải có tín hiệu báo trước.

## 4. Điều khiển [CHỐT]

### Cảm ứng (ưu tiên)
- **Lái:** joystick trôi, chỉ xuất hiện trong **vùng góc dưới bên trái** (khoảng 45% chiều ngang × 62% chiều cao tính từ dưới). Có vòng joystick mờ báo vị trí khi chưa chạm.
- **Chọn mục tiêu:** chạm vào xe địch ở bất kỳ đâu để khóa (vùng chạm rộng ~48px). Chạm vào nhà hoặc mặt đất để nhắm vào điểm đó.
- **Chạm nhanh trong vùng lái** (nhả trong ~0,2 giây, không kéo) cũng tính là chạm nhắm.
- **Nút BẮN** cố định góc dưới bên phải. Giữ để bắn liên tục mỗi khi nòng vào hướng. Bấm khi chưa có mục tiêu thì tự khóa địch gần nhất trong tầm và không bị che.
- Tháp pháo **tự quay** về mục tiêu đã khóa.
- Vòng quanh nút BẮN hiển thị tiến độ nạp đạn. Màu: xám = chưa có mục tiêu, vàng = pháo đang quay hoặc tâm chưa chụm, xanh = sẵn sàng.

### Desktop
- WASD/mũi tên để lái, chuột để ngắm, giữ chuột trái hoặc Space để bắn. Không có hỗ trợ ngắm.

### Gamepad
- Cần trái lái, cần phải ngắm (có hỗ trợ ngắm mềm, góc hút mặc định 10°), RT/RB bắn.

### Còn mở
- Kéo joystick ngược hướng mũi xe: **lùi** hay **quay đầu**? (Bản thử đang có công tắc, chờ quyết định.)
- Tùy chọn joystick cố định / trôi trong phần cài đặt.

## 5. Mô hình chuyển động và ngắm [CHỐT về cơ chế, số liệu là ĐỀ XUẤT]

- Thân xe và tháp pháo xoay có **gia tốc và tốc độ tối đa** (độ ì), phanh sớm nên không bị lố.
- **Tháp pháo xoay chậm hơn thân xe.** Lý do: để đánh vòng sườn thực sự hiệu quả (vòng nhanh hơn tốc độ xoay pháo địch).
- **Tâm ngắm loang:** độ tản đạn tăng khi pháo xoay, thân xe xoay hoặc xe chạy, và chụm lại khi đứng yên trong khoảng "thời gian chụm tâm".
- Nâng cấp sau này cải thiện được: tốc độ xoay, độ ì, thời gian chụm tâm (bộ ổn định pháo).
- Nguyên tắc cân bằng: **bản chưa nâng cấp phải đã thấy ổn**. Nâng cấp đưa cảm giác từ "ổn" lên "rất đã".

## 6. Class người chơi [CHỐT: 2 class. Số liệu: ĐỀ XUẤT]

Pháo diệt tăng **không còn là class người chơi**, chỉ còn là kẻ địch (xem mục 8).

| | Xe tăng | Xe bọc thép |
|---|---|---|
| Vai trò | Tuyến đầu, cân bằng | Cơ động, đánh vòng sườn, diệt drone |
| Vũ khí chính | Pháo: 1 phát mạnh, nạp ~0,75 s | Pháo tự động: loạt 3 phát nhẹ, mạnh với drone/robot, yếu với giáp dày |
| Xoay thân / tháp pháo | 90°/s / 70°/s | 150°/s / 140°/s |
| Tốc độ (1–5) | 3 | 5 |
| Giáp trước / hông / sau (1–5) | 4 / 3 / 2 | 2 / 2 / 1 |
| Máu | cao | thấp |
| Đồng đội AI | 1 | 2 |
| Kỹ năng riêng | Nạp đạn nhanh: 2 phát liên tiếp, hồi chiêu dài | Nitro: tăng tốc ngắn |

## 7. Giáp và sát thương [CHỐT]

- Hệ số sát thương theo mặt trúng đạn: **trước ×0.5, hông ×1.0, sau ×1.6**. Không tính góc nghiêng giáp.
- Có giáp phụ (lồng chống tăng, lồng chống UAV) làm vật phẩm nâng cấp.
- **Hỏng bộ phận [ĐỀ XUẤT]:** đứt xích (bất động vài giây), kẹt tháp pháo, cháy động cơ (mất máu theo thời gian và chậm lại). Trúng từ phía sau thì dễ hỏng hơn.
- Xe bị phá hủy: nổ, có xác suất kho đạn nổ gây sát thương lan, xác xe cháy rồi thành vật che chắn.

## 8. Kẻ địch [CHỐT về hướng, danh sách chi tiết là ĐỀ XUẤT]

- Công nghệ **kém hơn người chơi một bậc**, nâng cấp thấp hơn, bù lại **số lượng đông hơn**. Không có kẻ địch riêng cho từng khu vực.
- Loại: xe tăng, xe bọc thép, **pháo diệt tăng**, drone, droid, robot chiến đấu.
- **Pháo diệt tăng (địch):** không có tháp pháo, pháo cố định chỉ quay ±12°, phải xoay cả thân để nhắm (chậm). Giáp trước dày (5), hông và sau mỏng (2/1). Vai trò thiết kế: dạy người chơi cơ chế đánh vòng sườn. Đối đầu trực diện thì rất mạnh, bị vòng ra sau thì rất yếu.

## 9. Phá hủy và chất liệu [CHỐT]

- Công trình ghép từ các ô nhỏ (~10px thế giới). Đạn nổ trừ "độ bền" của các ô trong bán kính nổ, ô hết bền thì vỡ.
- 5 chất liệu với độ bền và mảnh vỡ khác nhau: **bê tông, gạch, gỗ, thép, đá**. Thép tóe tia lửa và rất cứng, gỗ văng thanh dài, bê tông và gạch có bụi.
- Mảnh vỡ chủ yếu là hạt trang trí (không tính va chạm với xe). Khi rơi xong thì "in" xuống nền, không tốn hiệu năng.
- **Nhà sập để lại đống đổ nát:** xe đi qua được nhưng chậm (xe bọc thép chậm nhiều nhất), đống đổ nát che được đạn một phần.

## 10. Tiến trình và nâng cấp

- **[CHỐT] Mô hình (c):** nhặt nâng cấp trong màn để mạnh lên tạm thời, cuối màn **chọn giữ lại 1 món vĩnh viễn**.
- **[CHỐT] Nguồn nâng cấp:** địch bị hạ rơi đồ, đồ giấu trong công trình (phải phá mới lấy được), thùng tiếp tế thả dù.
- **[CHỐT] Cây nâng cấp dùng chung** cho vũ khí phổ thông: súng máy, pháo, đạn khói, lồng chống tăng, lồng chống UAV. **Chi tiết sẽ thảo luận riêng.**
- **[CHỐT] Đồng đội AI** (drone/droid) do máy điều khiển, số lượng theo class.

## 11. Bản đồ, nhiệm vụ, môi trường

- **[CHỐT] 3 khu vực:** đô thị (chính), sa mạc, đồi núi. Mỗi khu vực có đặc điểm địa hình và đòi hỏi chiến thuật khác nhau.
- **[CHỐT] 10 màn pilot**, đô thị chiếm phần lớn.
- **[CHỐT] Điều kiện thắng:** chiếm căn cứ/cứ điểm, tiêu diệt toàn bộ địch, giải cứu, hộ tống xe hoặc đoàn xe.
- **[ĐỀ XUẤT] Đồi núi:** thể hiện độ cao bằng đổ bóng và đường đồng mức. Đứng trên cao bắn xa hơn, leo dốc chậm hơn.

### Thời tiết và ngày đêm [CHỐT]
- Thời tiết **ngẫu nhiên theo màn**, mỗi màn có danh sách thời tiết được phép (để màn khó không trở thành không thể qua).
- Các loại: sương mù, mưa, bão. Ảnh hưởng tầm nhìn.
- **Không có gió, không có nhiệt độ.**
- Ban đêm: pháo sáng (rừng, sa mạc, đô thị), ánh đèn từ công trình (đô thị, sa mạc), kính ngắm ảnh nhiệt (nâng cấp đắt, có rồi thì không cần pháo sáng).
- [ĐỀ XUẤT] Chớp lửa đầu nòng làm lộ vị trí trong một thoáng khi bắn ban đêm.

## 12. Kể chuyện [CHỐT]

- Có phe phái. Cốt truyện kể bằng **các ô comic** xuất hiện trong game.

## 13. Kỹ thuật

- **Ngôn ngữ:** TypeScript. **Build:** Vite.
- **Hiển thị [CHỐT]:** tự viết vòng lặp game + **PixiJS 8** (WebGL). Lý do: công trình phá hủy theo ô và cách vẽ góc 3/4 có che khuất đều phải tự viết, Phaser không giúp được. Nhà được chia thành dải theo hàng, mỗi dải có thứ tự vẽ theo vị trí mặt trước, nên xe đứng sau nhà bị che đúng.
- **Tự hạ độ phân giải:** nếu máy không giữ được ~50fps thì game tự giảm độ phân giải vẽ theo từng nấc.
- **Mục tiêu hiệu năng:** 60fps ổn định trên **iPhone 12 / Galaxy A54** trở lên.
- **Lưu tiến trình:** lưu trên máy (local). Bảng xếp hạng làm sau bằng dịch vụ ngoài (Supabase hoặc LootLocker), itch.io không có sẵn.
- **Âm thanh:** chưa có, người làm game sẽ cung cấp file sau.
- **Art:** giai đoạn đầu dùng khối placeholder. Sau đó dùng asset free/mua có phong cách đồng bộ (ví dụ Kenney, CC0). Mảnh vỡ và hiệu ứng sinh bằng code.
- **Đã biết về iPhone:** Safari không cho game web toàn màn hình thật. Nút fullscreen của itch có thể không giải quyết được. Cần test trên máy thật.

## 14. Lộ trình

1. ~~Bản thử điều khiển và camera~~ → `prototype/control-lab.html`
2. ~~Dựng khung dự án (TypeScript + Vite + PixiJS), chuyển logic từ bản thử sang code có cấu trúc.~~
3. ~~Gray-box 1 màn: 2 class, 4 loại địch (xe tăng, xe bọc thép, pháo diệt tăng, drone), phá hủy, nhiệm vụ tiêu diệt toàn bộ.~~ Chờ chơi thử trên máy thật.
4. Vertical slice: 1 màn hoàn chỉnh với asset, hiệu ứng, ban đêm, nâng cấp, HUD.
5. 10 màn pilot, phát hành itch.io.

## 15. Câu hỏi còn mở

- Kéo ngược joystick: lùi hay quay đầu?
- Số liệu tinh chỉnh độ ì và tốc độ xoay sau khi chơi thử trên máy thật.
- Cây nâng cấp chung: chi tiết từng nhánh.
- Danh sách drone/droid/robot địch và hành vi.
- Ảnh reference cho phong cách hình ảnh và các ô comic.
- Hồi máu: bản gray-box đang cho tự hồi 3 máu/giây sau 3 giây không trúng đạn. Có giữ cơ chế này không?
- Đồng đội AI (drone/droid) chưa có trong gray-box.
