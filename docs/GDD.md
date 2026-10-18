# Tank 2026 — Tài liệu thiết kế (GDD)

Trạng thái: **bản nháp 1**. Mục nào ghi **[CHỐT]** là đã thống nhất. Mục nào ghi **[ĐỀ XUẤT]** là số liệu hoặc ý chưa được duyệt.

## 1. Tổng quan

- **Thể loại:** bắn xe tăng góc nhìn từ trên xuống, chơi đơn, cảm hứng từ Battle City (Tank 1990) nhưng hiện đại hóa: môi trường phá hủy tự do, nâng cấp, thời tiết, ngày đêm.
- **Nền tảng:** trình duyệt. **Ưu tiên điện thoại cầm ngang**, có hỗ trợ desktop (chuột + bàn phím) và gamepad.
- **Mục đích:** portfolio, phát hành trên itch.io. Không có deadline.
- **Phạm vi bản pilot:** 10 màn, 2 class, 3 khu vực (đô thị chiếm phần lớn).

## 2. Trụ cột thiết kế

1. **Phá hủy có ý nghĩa chiến thuật.** Bắn sập tường để mở đường, phá nhà để chặn đường, đống đổ nát và xác xe thành vật che chắn.
2. **Vị trí quan trọng hơn ngắm.** Ngắm được hỗ trợ tự động. Lý do: ngoài đời một xe tăng có kíp 3–4 người (lái, ngắm, nạp đạn, chỉ huy), trong game một người làm thay cả kíp, nên các cơ chế tự động **đóng vai kíp lái**. Kỹ năng nằm ở chỗ đứng, góc tấn công (giáp trước/hông/sau), thời điểm bắn và thứ tự mục tiêu.
3. **Đọc chiến trường rõ trên màn hình nhỏ.** Không bị bắn từ chỗ không nhìn thấy, ít chỉ báo rối mắt.

## 3. Camera [CHỐT]

- Góc **nghiêng 3/4** (kiểu Brawl Stars / Tank Hero), zoom mặc định **120%** [CHỐT, đổi từ 85% khi có bộ binh: dễ nhìn, vẫn đủ quan sát].
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
- WASD/mũi tên để lái, chuột để ngắm, giữ chuột trái hoặc Space để bắn, Q tên lửa, R sửa xe, F yểm trợ. Không có hỗ trợ ngắm.

### Gamepad
- Cần trái lái, cần phải ngắm (có hỗ trợ ngắm mềm, góc hút mặc định 10°), RT/RB bắn.

### Giao diện [CHỐT]
- **HUD bằng icon, tham chiếu WoT Blitz (bản di động).** 4 nút bên phải: BẮN (tâm ngắm) ở góc, SỬA (cờ lê) bên trái, TÊN LỬA chéo trên trái, YỂM TRỢ (máy bay) phía trên. **Không còn nút kỹ năng riêng của class** (bỏ nạp nhanh và nitro: không cần, người chơi không dùng). Số lượng là badge nhỏ ở góc nút, hồi chiêu/nạp là vòng quanh viền. Tên lửa: badge = tổng số, vạch nhỏ dưới icon = số đã lên giá. Yểm trợ không ghi số, vòng đầy thì nút sáng và nhấp nháy.
- Chữ chú thích dưới icon chỉ hiện **12 giây đầu của 3 màn đầu tiên** người chơi chơi; sau đó chỉ còn icon.
- **Nét và màu đồng bộ với joystick:** viền 2px màu trắng ngà độ trong cao, icon nét mảnh cùng màu, nền gần trong suốt; viền chính là vòng nạp/hồi. Không tô màu riêng từng nút. Màu chỉ dùng làm tín hiệu trạng thái: vòng nút BẮN chuyển xanh khi sẵn sàng bắn trúng; nút yểm trợ sáng và nhấp nháy khi đầy; nút mờ hẳn khi không dùng được.
- Máu: icon khiên + thanh, không chữ.
- Ô nhiệm vụ: icon + số, câu chữ đầy đủ để ở briefing. Tiêu diệt: tâm bia + còn/tổng (màn co-op thêm icon xe tăng xanh + đồng minh còn/tổng). Chiếm/giữ: cờ + thanh tiến độ + số giây còn lại; viền đỏ và dấu cảnh báo khi có địch trong vùng, xám khi ở ngoài vùng. Hộ tống: 1 icon xe tải mỗi xe (trắng = ổn, vàng = dưới nửa máu, xanh = đã tới, mờ = mất), cảnh báo đỏ khi đoàn dừng vì địch, vàng khi đoàn chờ người chơi.
- **Không có minimap** (đã cân nhắc, mũi tên chỉ địch ngoài màn hình thoáng hơn).
- Ô FPS mặc định tắt, bật trong cài đặt khi cần đo.
- **Nút tạm dừng (II)** ở góc trên phải mở **menu cài đặt**: zoom, mức camera đón hướng ngắm, bật/tắt mũi tên chỉ địch ngoài màn hình, vệt báo hướng trúng đạn, vòng tầm bắn của địch, FPS. Cài đặt được lưu trên máy. Trên PC phím Esc cũng mở menu này.

### Hướng lái [CHỐT]
- Kéo joystick về hướng nào thì xe **quay đầu về hướng đó rồi tiến**. Không có chế độ lùi.
- Hệ quả đã biết: không thể vừa lùi vừa giữ mặt giáp trước hướng về địch.

### Còn mở
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
| Vũ khí chính | Pháo: 44 sát thương, nạp 0,9 s (đã chậm lại 20% để chừa chỗ cho nâng cấp) | Pháo tự động: loạt 3 phát × 24 sát thương, nạp 1,02 s, bị giảm còn ×0.45 khi bắn vào xe giáp dày |
| Xoay thân / tháp pháo | 90°/s / 70°/s | 150°/s / 140°/s |
| Tốc độ (1–5) | 3 | 5 |
| Giáp trước / hông / sau (1–5) | 4 / 3 / 2 | 2 / 2 / 1 |
| Máu | 165 | 105 |
| Đồng đội AI | 1 | 2 |

## 6b. Vũ khí phụ [CHỐT về cơ chế, số liệu là ĐỀ XUẤT]

Cả hai class đều có:

- **Súng máy tự động:** tự bắn vào mục tiêu mềm gần nhất trong tầm 48 m (drone; sau này thêm robot nhỏ, droid trinh sát, bộ binh). **Không gây sát thương cho xe chiến đấu.** Nâng cấp chỉ làm mạnh lên chút ít.
- **Tên lửa chống tăng có điều khiển:** tầm 84 m (ngắn hơn pháo), **bay qua nóc nhà**, tự bám mục tiêu và đánh từ trên xuống (bỏ qua giáp theo mặt). 77 sát thương mỗi quả. Bệ phóng chứa 2 quả, **nạp từng quả, 6 giây mỗi quả**, để người chơi phải lẩn trốn giữa các loạt bắn thay vì xông thẳng vào. Mục tiêu là xe đang khóa, hoặc xe địch gần nhất đang hiện trên màn hình. Không bắn được drone.
- **[CHỐT] Mỗi màn được cấp 6 quả tên lửa từ đầu.**
- **[CHỐT] Chỉ một loại đạn pháo.** Các xe khác nhau ở sát thương, không có chọn loại đạn.

*Toàn bộ chỉ số người chơi (máu và sát thương mọi vũ khí) đã tăng 10% sau lần chơi thử đầu tiên.*

## 6c. Sửa chữa [CHỐT về cơ chế, số liệu là ĐỀ XUẤT]

- **Không có tự hồi máu.**
- **Kit sửa chữa** (nút SỬA, phím R): tổ lái/robot trong xe tự sửa, mỗi lượt **6 giây hồi 10% máu tối đa**. Trong lúc sửa **mọi vũ khí tắt** (pháo, súng máy, tên lửa). Lái xe đi thì hủy lượt sửa, không mất kit. Bị bắn trong lúc sửa thì vẫn sửa tiếp. Bắt đầu màn với 3 kit, mang tối đa 5. Nâng cấp kit sẽ tăng lượng máu hồi mỗi lượt.
- **Trạm sửa lưu động:** đứng trong vòng tròn thì hồi 8% máu/giây và **vẫn chiến đấu được**. Mỗi trạm chỉ cho tổng cộng 60% máu xe.
- **Hàng thả dù:** khoảng mỗi 50–70 giây rơi một thùng: **kit sửa 40%, +2 tên lửa 25%, nâng cấp 20%, 1 drone tấn công tạm thời 15%** (theo xe tới khi bị bắn rơi, không chiếm chỗ đồng đội). Thùng rơi cách xe 50–90 m, có mũi tên xanh chỉ hướng khi ở ngoài màn hình. Lái tới chạm vào để nhặt.
- Rủi ro đã biết: bỏ tự hồi máu làm game khó hơn bản đã chơi thử. Nếu hụt thì nâng % hồi mỗi kit hoặc số kit ban đầu.

## 6d. Nâng cấp [CHỐT về cơ chế, số liệu là ĐỀ XUẤT]

**Cách có nâng cấp trong màn:** nhặt **thùng vàng**. Thùng vàng đến từ 3 nguồn:
- **Địch bị hạ rơi ra:** xe tăng 35%, xe bọc thép 25%, pháo diệt tăng 60%.
- **Giấu trong nhà:** mỗi màn có 4 thùng giấu trong nhà nhỏ hoặc nhà thấp tầng (không có trong nhà cao tầng), phá nhà thì thùng lộ ra.
- **Thả dù:** khoảng 1/3 số lần thả dù là thùng nâng cấp, còn lại là kit sửa (thùng xanh).

Mỗi thùng vàng cho **+1 cấp một nâng cấp ngẫu nhiên** chưa tối đa, chỉ có hiệu lực trong màn đó.

**Cuối màn:** thắng thì **chọn 1 món giữ lại vĩnh viễn** cho class đang chơi (trong số món đã nhặt; nếu không nhặt được món nào thì chọn 1 trong 3 món ngẫu nhiên). **Thua thì không giữ được gì.** Tiến trình lưu riêng từng class trên máy, có nút xóa tiến trình ở menu chính.

Mỗi món tối đa **cấp 3**:

| Nhóm | Món | Mỗi cấp |
|---|---|---|
| Hỏa lực | Pháo chính | +12% sát thương, nạp nhanh hơn 10% |
| | Tên lửa | +1 quả mỗi màn, nạp nhanh hơn 12%; cấp 2 thêm 1 ô bệ phóng |
| | Súng máy | +15% sát thương, +10% tầm |
| Bảo vệ | Giáp phụ | Lớp giáp ngoài = 15% máu xe, bị trừ trước máu; **xe chậm 5%** khi còn lớp này |
| | Lồng chống tăng | Giảm 30% sát thương vào hông và đuôi (lồng chịu 60 điểm); **chậm 4%** |
| | Lồng chống UAV | Chặn đạn drone (lồng chịu 30 điểm); **chậm 3%**. Sau này chặn tối đa 2 drone cảm tử |
| Cơ động | Động cơ | +8% tốc độ |
| | Xích và hộp số | Thân xe xoay nhanh hơn 12%, bớt ì |
| | Bộ ổn định pháo | Chụm tâm nhanh hơn 15% |
| Hỗ trợ | Kit sửa chữa | +5% máu hồi mỗi lượt sửa |
| | Kính ảnh nhiệt, đạn khói | Làm cùng giai đoạn ngày đêm |
| | Droid sửa chữa | Cấp cao nhất của nhánh kit, làm cùng giai đoạn đồng đội |

Lớp bảo vệ bị phá hết thì xe nhanh trở lại, có thông báo trên màn hình. Lớp bảo vệ hiện dưới dạng khung lồng quanh xe và thanh xám dưới thanh máu.

## 6e. Đồng đội AI [CHỐT về cơ chế, số liệu là ĐỀ XUẤT]

- Chọn đồng đội ở màn hình **"Đồng đội"** trước mỗi màn. **Xe tăng mang 1, xe bọc thép mang 2.** Lựa chọn được nhớ theo từng class.
- Đồng đội đi theo đội hình phía sau xe, **tấn công được mọi loại địch** trong tầm. Bị kẹt sau nhà quá xa thì tự về lại cạnh xe. Đồng đội không chặn đường xe của người chơi.
- Bị hạ là **mất luôn trong màn đó**. Địch chọn mục tiêu gần nhất trong số xe và đồng đội.

| Đồng đội | Vai trò | Máu | Vũ khí |
|---|---|---|---|
| Drone tấn công | Bay theo xe, bắn mọi mục tiêu | 30 | Loạt 3 viên × 6, tầm 48 m |
| Drone đánh chặn | Ưu tiên drone địch, tầm xa | 25 | Loạt 2 viên × 5, tầm 60 m |
| Robot chống tăng | **Đánh sườn:** chọn địch gần xe nhất (hoặc mục tiêu đang khóa), tự tìm đường vòng sang hông nó ở tầm bắn, để địch phải chọn quay về xe hay về robot và lộ hông cho bên còn lại. Không đi xa xe quá ~84 m, máu dưới 30% thì lui về cạnh xe | 70 | Rocket 28 sát thương, nạp 3,5 giây, tầm 72 m |
| **Droid sửa chữa** | Có từ **Kit sửa chữa cấp 3**, không chiếm chỗ | 60 | Không có. Tự sửa xe **3% máu/giây** khi ở gần (≤ 18 m), xe vẫn bắn được, hồi được tới đầy máu |

- [ĐỀ XUẤT] Địch **ưu tiên bắn droid sửa chữa** (coi nó gần hơn 30% so với thực tế), nên giữ được nó sống là một kỹ năng.

## 7. Giáp và sát thương [CHỐT]

- Hệ số sát thương theo mặt trúng đạn: **trước ×0.5, hông ×1.0, sau ×1.6**. Không tính góc nghiêng giáp.
- Có giáp phụ (lồng chống tăng, lồng chống UAV) làm vật phẩm nâng cấp.
- **Hỏng bộ phận [ĐỀ XUẤT]:** đứt xích (bất động vài giây), kẹt tháp pháo, cháy động cơ (mất máu theo thời gian và chậm lại). Trúng từ phía sau thì dễ hỏng hơn.
- Xe bị phá hủy: nổ, có xác suất kho đạn nổ gây sát thương lan, xác xe cháy rồi thành vật che chắn.

## 8. Kẻ địch [CHỐT về hướng, danh sách chi tiết là ĐỀ XUẤT]

- Công nghệ **kém hơn người chơi một bậc**, nâng cấp thấp hơn, bù lại **số lượng đông hơn**. Không có kẻ địch riêng cho từng khu vực.
- Loại: xe tăng, xe bọc thép, **pháo diệt tăng**, drone, droid, robot chiến đấu.
- **Bộ binh chống tăng [CHỐT]:** tổ 2 lính nấp ở mặt tiền nhà hướng ra phố.
  - **Ẩn:** không thấy, không khóa, không bắn được cho tới khi xe tới gần trong 18 m, hoặc drone đồng đội bay trong 60 m (hiện chữ "BỘ BINH!"). Luôn lộ trong **2,5 giây giương súng** trước mỗi phát (vòng đỏ nhấp nháy và dấu "!").
  - **[CHỐT] Vai trò: gây bất ngờ, sát thương vừa, không phải đòn kết liễu.** RPG tầm 50 m, sát thương 20 (vẫn tính theo mặt giáp), nạp 7 giây. Bắn xong khói phụt lộ vị trí 5 giây; lính đã lộ có tam giác cam trên nóc nhà để dễ tìm và chạm khóa trên điện thoại. Dấu "!" khi giương súng vẽ to. **Lồng chống tăng chặn 70% sát thương RPG từ mọi phía.**
  - **Máu 20:** pháo xe tăng 1 phát chết, pháo tự động xe bọc thép 1 viên chết (xe bọc thép là khắc tinh bộ binh), súng máy gây 60% sát thương (khoảng 1,5 giây khi đã lộ). Nổ (pháo trúng tường căn nhà nó nấp) cũng giết được khi nó còn ẩn. Xe cán qua là chết.
  - AI cấp 2 trở lên: bắn xong chạy sang mặt tiền nhà khác gần đó (lộ trong lúc chạy).
- **Drone cảm tử [CHỐT]:** **vai trò: vũ khí gây áp lực dồn dập, sát thương trung bình thấp** (ngoài đời xe tăng cũng gần như không né được). Máu 55 (gấp 2,5 drone thường, súng máy cần khoảng 2,4 giây). Bay theo bầy 2–3 chiếc, dàn ra vòng quanh xe rồi **khóa 1,5 giây** (đường đỏ và vòng nổ đỏ trên xe) và **bổ nhào** vào điểm đón đầu theo hướng xe đang chạy (đón khoảng 85% quãng xe đi trong lúc nó lao xuống). Các chiếc trong bầy khóa cách nhau 0,5 giây.
  - Trúng trực tiếp 20, vùng nổ bán kính 8 m gây tới 10. (Không kéo dài thời gian khóa lên 3–4 giây: drone treo lâu thì súng máy bắn rơi hết, mất áp lực; mà xe tăng vẫn xoay chậm nên dài hơn cũng không né được.) **Bị bắn rơi cũng nổ vùng**, trúng cả địch và drone cảm tử bên cạnh (nổ dây chuyền). Drone thường rơi thì không nổ, không gây sát thương.
  - Lồng chống UAV: mỗi lượt giảm 75% sát thương, mỗi cấp chịu được 2 lượt.
  - Thử nghiệm (có súng máy, bầy 3 chiếc): xe tăng đứng yên mất 60 máu (36%), chạy thẳng mất khoảng 29, chạy zíc zắc vẫn mất 60. Xe bọc thép chạy thẳng né hết, chạy zíc zắc mất khoảng 8.
- **[CHỐT] Lịch xuất hiện:** màn 1 giữ nhịp Battle City: chỉ xe tăng, xe bọc thép, pháo diệt tăng, drone thường. **Bộ binh từ màn 2–3** (thêm bộ binh thì bớt xe), **drone cảm tử muộn hơn**, khi người chơi đã quen nhịp. Menu tạm dừng có công tắc "Thêm địch mới để thử" để chơi thử cả hai ở màn 1.
- **Drone [CHỐT]:** bay cao hơn nóc nhà (tự lên cao khi bay qua nhà cao), không va hay xuyên qua nhà.
- **[CHỐT] Tổ tuần tra:** xe tăng và xe bọc thép đi theo tổ 2–3 xe, chạy vòng quanh các khối theo tuyến đường cố định, xe sau bám vết xe dẫn đầu (xe dẫn đầu chạy chậm lại chờ xe tụt). Phát hiện người chơi khi cách ~124 m. **Nghe tiếng súng:** mỗi phát pháo hoặc tên lửa của người chơi đánh thức mọi địch trong bán kính 200 m, chúng kéo tới tìm. Một xe trong tổ giao chiến thì cả tổ cùng kéo tới. Súng máy không gây động.
- **[CHỐT] Độ khôn của địch tăng dần theo màn** (mỗi màn khai báo cấp AI, màn 1 là cấp 1). Khi đã giao chiến, xe tăng, xe bọc thép và pháo diệt tăng tự tìm đường theo phố (A*), giữ khoảng cách với nhau (không tụm lại cho người chơi nã một chỗ), xe kẹt thì lùi tránh rồi tính đường khác. Tới điểm mà không thấy mục tiêu thì trượt vòng và áp sát dần.
  - **Cấp 1 — tản ra, bao vây:** mỗi tổ chia hướng tiếp cận lệch nhau ~60°, đến từ nhiều phía.
  - **Cấp 2 — thêm ẩn nấp:** bắn xong thì lùi vào chỗ khuất sau nhà/chướng ngại để nạp đạn, nạp xong ló ra bắn tiếp. Máu thấp thì nấp lâu hơn.
  - **Cấp 3 — hợp đồng tác chiến:** một xe làm mỏ neo giữ mặt trước ở xa, hai xe kia vòng rộng ~110° sang hông và sau.
  - Trong menu tạm dừng có thanh **"AI địch (thử nghiệm)"** để ép cấp 1–3 khi chơi thử.
- **Pháo diệt tăng (địch):** **[CHỐT] săn mục tiêu**: khi bị đánh động thì tự tìm đường tiến tới, dừng ở ~80% tầm bắn chỗ nhìn thấy mục tiêu, xoay mũi giáp dày về phía đó rồi bắn. Tốc độ 55. Không có tháp pháo, pháo cố định chỉ quay ±12°, phải xoay cả thân để nhắm (chậm). Giáp trước dày (5), hông và sau mỏng (2/1). Vai trò thiết kế: dạy người chơi cơ chế đánh vòng sườn. Đối đầu trực diện thì rất mạnh, bị vòng ra sau thì rất yếu.

## 8b. Yểm trợ, danh hiệu, cấp bậc

- **[CHỐT] Yểm trợ A-10:** nạp bằng chiến công của xe người chơi: **15 xe** (lính, drone tính nửa). **Thanh nạp dồn qua các màn** (lưu trên máy). Đầy thì nút YỂM TRỢ (phím F) sáng; bấm là A-10 đánh mục tiêu đang khóa, hoặc cụm địch đông nhất trong ~110 m. Báo trước 2 giây bằng hành lang đỏ dài 60 m theo hướng từ xe tới mục tiêu; rồi máy bay bắn 2 tên lửa vào 2 xe khỏe nhất trong hành lang, quét pháo và rải bom dọc hành lang. Không gây sát thương lên quân mình.
- **[CHỐT] Câu cổ vũ chuỗi hạ địch** (các lần hạ cách nhau ≤ 8 giây), chỉ 3 mốc: 2 DOUBLE-KILL, 5 ÁT CHỦ BÀI, 10 HUYỀN THOẠI. Hiện to giữa màn hình kèm dòng nhỏ "n MỤC TIÊU LIÊN TIẾP", mờ dần sau ~1,7 giây.
- **[ĐỀ XUẤT] Cấp bậc và huân chương:** điểm mỗi màn (hạ địch, thời gian, ít bị bắn) → 1–3 sao; tổng điểm lên quân hàm (Binh nhì → … → Đại tá); huân chương theo thành tích. Chỉ là danh dự, **không cộng sức mạnh** (sức mạnh đã do hệ thống nâng cấp lo). Hết game được huân chương và về căn cứ nghỉ phép; đang nghỉ ở resort thì robot khủng bố tấn công → mở chương 2 (khu resort ven biển). Chốt cùng phần comic/cốt truyện ở giai đoạn 7.
- AI đã sửa: khi xét tầm nhìn, xác xe được tính là vật chắn (trước đây pháo tự hành đứng nã vào xác xe người chơi núp phía sau).

## 9. Phá hủy và quy mô nhà [CHỐT]

- Công trình ghép từ các ô nhỏ (~10px thế giới). Đạn nổ trừ độ bền của các ô trong bán kính nổ, ô hết bền thì vỡ.
- **Quy mô nhà quyết định độ bền** (người chơi nhìn là biết):
  - **Nhà nhỏ** (nhà cấp 4, lán, tường rào): vỡ rất nhanh. **Đạn pháo xuyên qua** (khoảng 8 ô, ~16 m), khoét đường hầm rồi bay tiếp, trúng được xe núp phía sau. Đạn pháo tự động chỉ xuyên được 2 ô.
  - **Nhà thấp tầng** (nhà phố, container, tảng đá): phải bắn nhiều phát mới mở được lối.
  - **Nhà cao tầng:** **không phá được**, chỉ sứt mặt tường. Giữ bố cục đường phố cố định cho thiết kế màn.
- **Vật liệu** (bê tông, gạch, gỗ, thép, đá) chỉ còn là **trang trí**: màu sắc và kiểu mảnh vỡ. Thép tóe tia lửa, gỗ văng thanh dài, bê tông và gạch có bụi.
- Mảnh vỡ chủ yếu là hạt trang trí, rơi xong thì in xuống nền.
- **Nhà sập để lại đống đổ nát:** xe đi qua được nhưng chậm, đống đổ nát che được đạn một phần.
- **[CHỐT] Xác xe:** chắn đường và che đạn (đạn trúng xác xe nổ ở đó), **không phá được** cho giống thực tế. AI tìm đường biết đường vòng qua xác xe. Xe tiếp tế hộ tống thì ủi qua xác xe.
- **[CHỐT] Nổ xe:** rung màn hình mạnh hơn, chớp sáng toàn màn hình và vòng sóng xung kích, giảm dần theo khoảng cách tới xe mình.

## 9b. Phong cách hình ảnh [CHỐT]

- **[CHỐT] Hướng vẽ bằng code.** Thế giới, xe và hiệu ứng **dựng hoàn toàn bằng code** theo phong cách pixel art. Mặt đất có vỉa hè lát gạch, bó vỉa, vạch kẻ làn, vạch qua đường, nắp cống, nền riêng từng loại khu. Nhà có tầng, cửa sổ, kính, gạch, ván gỗ, rãnh container; mái có gờ, máy lạnh, bồn nước, dãy pin mặt trời, ngói. Nhà đổ bóng xuống đất. Xe có vân xích, lưới tản nhiệt, nắp tháp pháo, đầu nòng.
- **Kiểu pixel** (mặc định **tắt** theo quyết định của chủ dự án vì bị răng cưa trên iPad/laptop; bật được trong cài đặt): vẽ đúng 1 điểm ảnh cho mỗi pixel của thế giới game rồi phóng to giữ cạnh sắc. Camera được làm tròn theo pixel để không bị rung viền.
- **Cây**, **ô tô đỗ**, **tường rào và sạp hàng** (công trình nhỏ cao ≤ 2 m): **cả xe tăng lẫn xe bọc thép húc đổ và đi xuyên qua** [CHỐT], bắn 1 phát là vỡ. Cây vẽ ước lệ, 4 dạng tán (tròn to, chùm 3 tán, cau/dừa hình sao, cây cảnh nhỏ), to nhỏ khác nhau. **Một luật chung cho mọi đơn vị mặt đất** (kể cả robot): húc qua được, AI tìm đường coi là đi qua được. Xe cùng phe không chặn nhau (tránh kẹt ở lối hẹp), tự giữ khoảng cách bằng lái né.
- Comic, ảnh bìa, menu: dự kiến gen bằng AI.


- **Pixel art**, nhìn nghiêng 3/4 thấy mặt tường trước (theo ảnh reference 1 của chủ dự án).
- Chi tiết thành phố cần có: vỉa hè, vạch qua đường, cây xanh (vật cản bắn gãy được), xe đỗ ven đường (bắn nổ được), bãi đỗ xe, đường ray, máy lạnh và pin mặt trời trên mái.
- Asset mua thì kiểm tra giấy phép. Repo đang công khai nên asset trả phí phải để ở repo private hoặc chỉ đưa vào bản build.

## 9c. Tỉ lệ thế giới và quy hoạch [CHỐT]

- **[CHỐT] 5 pixel = 1 mét**, 1 ô = 2 m, 1 tầng nhà = 3,2 m. Kích thước xe trên màn hình giữ nguyên: xe tăng ~7 × 5 m, xe bọc thép ~6,5 × 3,6 m. Tốc độ xe giữ như cũ (trên giấy là nhanh hơn thật, chấp nhận vì cảm giác chơi).
- Mọi thứ khác theo kích thước thật: ô tô 4 × 2 m, cây ven đường tán ~6 m cao 6–8 m, đường phố 14 m (2 làn + vỉa hè 3 m mỗi bên), đại lộ 24 m có dải phân cách trồng cây, khối phố ~72 × 64 m.
- **[CHỐT] Hẻm 4 m:** xe bọc thép đi lọt, xe tăng không vào được (phải phá nhà mở lối). Đây là lợi thế chiến thuật riêng của xe bọc thép.
- **Luật dựng khu phố** (bộ tạo màn tuân theo, áp dụng cho các màn đô thị sau):
  - **[CHỐT] Cân bằng chướng ngại và chiến đấu:** đây là game bắn xe tăng, không phải game tìm đường. Bản đồ **4 × 4 khối nhỏ trở lên** cho đường gần nhau, dễ cơ động. Nhà chiếm khoảng một nửa so với bản quy hoạch đầu (ô đặc khoảng 18% bản đồ, tính cả cây, xe, tường). **Khối nào cũng có đường nội bộ 10 m** cho xe tăng vào, **sân trong đủ rộng để xe xoay trở** (~28 m). Khoảng trống (quảng trường, trường học, bãi đổ nát, công trường, bãi xe buýt) là chỗ phục kích và đánh vòng.
  - Nhà phố: mặt tiền 4–6 m, sâu 14–18 m, 3–5 tầng, xây liền nhau **chỉ trên 2 mặt khối**, nhà góc to và cao hơn, cứ 5–7 căn có một hẻm 4 m, mỗi dãy có một đường xe vào 10 m. Sân giữa mỗi khối khác nhau (sân sau có lán, chùa trong vườn, bãi xe, sân bóng) để không lặp.
  - Văn phòng/cao ốc: tháp 7–9 tầng trên khối đế 3 tầng, lùi vào sau quảng trường, có bãi đỗ xe. Không phá được.
  - Biệt thự: lô ~24 × 32 m, tường rào có cổng, nhà 2–3 tầng sát mặt đường, vườn và hồ bơi phía sau.
  - Xóm lao động: nhà 1–2 tầng 4 × 6 m dày đặc, hẻm 4 m, cắt bởi một đường 10 m mỗi chiều, phá rất nhanh.
  - Khu cảng: bãi container (chồng 1–3 thùng 12 × 2,4 m, lối 12 m giữa các cột, khe 4 m giữa các hàng), **một vũng cảng liền ở góc đông bắc** (không có đường cắt ngang mặt nước, chỉ giữ đường ven kè), tàu hàng neo dọc kè và tàu kéo, kè đá bao quanh nên xe không xuống nước được, bồn dầu trong tường rào, dãy kho có xe tải ở cửa, bãi đường ray có toa hàng.
  - Công cộng: quảng trường có thảm cỏ, đài phun nước, tượng đài; chợ có nhà lồng và sạp; trường học chữ U quanh sân và sân thể thao; khu công nghiệp có tường rào, nhà kho, container, silo.
- **[CHỐT] Độ cao địa hình** (dùng cho sa mạc, sau này cho đồi núi): mỗi ô có độ cao. Chênh tới 6 px (1,2 m) giữa hai ô là dốc, xe leo được (chậm 30% khi lên); chênh hơn là vách, không qua được. Địa hình cao che tầm nhìn và chặn đạn. Đứng trên cao bắn xa hơn 15%. Vẽ theo bậc ô vuông kiểu pixel art.
- **[CHỐT] Sa mạc:** nền cát, đường đất có vệt bánh xe, **núi đá giật cấp 2 tầng** (4,8 m và 9,6 m, màu đất đỏ) có **dốc cát rộng 14 m** để lên từng tầng, **đồi cát thấp** (3,2 m, leo được, che xe phía sau), cụm đá lớn, đá tảng lẻ, xương rồng, cây chà là, **xác xe rải dọc đường** (chắn đường, che đạn). Xe chạy trên cát tung bụi. **Làng ốc đảo:** hồ nước (xe không xuống được nhưng bắn qua được) có viền lau sậy và cây chà là; nhà phần lớn là **nhà đất** (xe nào cũng húc đổ đi xuyên qua), khoảng 1/5 là nhà đá kiên cố.
- **[CHỐT] Bộ binh nấp bên trong nhà** (sát tường mặt tiền); khi giương súng thì hiện ra ở cửa. Pháo nổ vào tường căn nhà đó, hoặc xe húc đổ nhà đất, là giết được.
- **[CHỐT] Bán tải tên lửa** (từ màn 7): nhanh (165, hơn xe bọc thép), máu 45, mục tiêu mềm nên súng máy tự bắn (ưu tiên sau drone và bộ binh). Tên lửa 35 sát thương, tầm 80 m, bắn 2 quả cách 0,6 giây rồi nạp 8 giây; bắn xong chạy ra xa ~104 m để nạp rồi quay lại. Lồng chống tăng chặn được như RPG.
- **[CHỐT] Lính mang mìn** (sa mạc, khoảng 40–50% số lính): khi lộ có dấu vàng trên lưng. Bị bắn chết thì mìn nổ (bán kính 12 m, tới 35 sát thương, kéo nổ cả mìn khác). Xe cán qua thì dính mìn (đo được khoảng 29 máu xe tăng).
- **[ĐỀ XUẤT, đã dựng để chơi thử] Đồi núi:** thung lũng cỏ, **khối núi giật cấp** (bậc 4,8 m / 9,6 m / 14,4 m; bậc dưới là thềm cỏ, đỉnh là đá xám trơ, vách đá xám giữa các bậc), **đường dốc xẻ vào vách** (dốc đều, rộng 14–16 m, mặt đường đất), gò cỏ thấp 3,2 m để núp nửa xe, **suối** (xe không lội được, bắn qua được) chỉ qua ở **cầu gỗ**, rừng thông (vẽ tầng tam giác kiểu 3/4), xóm nhà gỗ và chòi đá, đá tảng. Nhà và cây chỉ đứng ở đáy thung lũng (chưa hỗ trợ công trình trên thềm cao).
- **[ĐỀ XUẤT] Pháo đài (màn 10):** tường đá dày 4 m cao ~7 m **không phá được**, 4 tháp góc, 4 cổng; trong có thành chính và trại lính (phá được), thùng hàng (húc đổ).

## 10. Tiến trình và nâng cấp

- **[CHỐT] Mô hình (c):** nhặt nâng cấp trong màn để mạnh lên tạm thời, cuối màn **chọn giữ lại 1 món vĩnh viễn**.
- **[CHỐT] Nhặt vật phẩm bằng nam châm:** thùng nằm trong 12 m quanh xe tự trượt vào xe (bay qua cả xác xe, gạch vụn); kit sửa chỉ hút khi chưa đầy.
- **[CHỐT] Nguồn nâng cấp:** địch bị hạ rơi đồ, đồ giấu trong công trình (phải phá mới lấy được), thùng tiếp tế thả dù.
- **[CHỐT] Cây nâng cấp dùng chung** cho vũ khí phổ thông: súng máy, pháo, đạn khói, lồng chống tăng, lồng chống UAV. **Chi tiết sẽ thảo luận riêng.**
- **[CHỐT] Đồng đội AI** (drone/droid) do máy điều khiển, số lượng theo class.

## 11. Bản đồ, nhiệm vụ, môi trường

- **[CHỐT] 3 khu vực:** đô thị (chính), sa mạc, đồi núi. Mỗi khu vực có đặc điểm địa hình và đòi hỏi chiến thuật khác nhau.
- **[CHỐT] 10 màn pilot**, đô thị chiếm phần lớn.
- **[CHỐT] Kiểu nhiệm vụ** (trước mỗi màn có popup nhiệm vụ ngắn gọn kiểu nhà binh: Tình hình / Nhiệm vụ / Thua khi / Lưu ý):
  1. **Tiêu diệt toàn bộ.** Còn 2 địch cuối thì có mũi tên chỉ hướng tới chúng ở mọi khoảng cách, bộ binh còn lại bị lộ.
  2. **Hộ tống:** đoàn 3 xe tiếp tế chạy theo tuyến, **dừng khi có địch (đã lộ) cách đoàn ~46 m** và chờ khi xe người chơi tụt xa quá ~90 m. Xe tiếp tế có súng máy, chỉ diệt được drone và bộ binh. **Mất 2 xe là thua** (hoặc xe mình bị phá). Thắng khi các xe còn lại tới điểm tập kết.
  3a. **Chiếm cứ điểm:** đứng trong vùng **20 giây** khi trong vùng không có địch (bộ binh còn ẩn không tính).
  3b. **Cố thủ:** vào vùng là bắt đầu; địch tăng viện vào từ mép bản đồ theo đợt (có drone cảm tử). Đồng hồ chỉ chạy khi giữ vùng, rời vùng thì dừng, địch trong vùng mà mình ở ngoài thì tụt. Rút lui và tái chiếm tùy ý; thua chỉ khi xe bị phá.
  4. **Co-op:** xuất phát cùng tổ xe tăng AI phe ta, mỗi bên một mũi tấn công. **Không có sát thương lên quân mình.** Thua khi xe mình bị phá.
     - Xe phe ta (màu xanh lam, có thanh máu, chấm xanh ở mép màn hình khi ngoài tầm nhìn): máu 90, pháo 22, nạp 2,6 giây, tầm 76 m. Đi theo trục riêng, gặp địch thì dừng đánh, hết trục thì đi săn địch còn lại.
     - **Cân bằng:** thử để người chơi đứng yên, tổ phe ta tự hạ được khoảng 7–9/20 địch rồi bị diệt. Phe ta giúp sức chứ không gánh thay.
     - Luật công bằng (địch chỉ bắn khi hiện trên màn hình) chỉ bảo vệ người chơi, xe hộ tống và đồng đội đi kèm; xe tăng phe ta đánh ở xa thì không được che chắn kiểu đó.
- **[CHỐT] 10 màn:**

| Màn | Nhiệm vụ | Địch mới / AI | Khu vực | Trạng thái |
|---|---|---|---|---|
| 1 Khu phố 7 | Tiêu diệt toàn bộ | cấp 1, nhịp Battle City | Phố | Chơi được |
| 2 Ngã tư đại lộ | Chiếm cứ điểm | **bộ binh** | Phố | Chơi được |
| 3 Đoàn xe tiếp tế | Hộ tống | bộ binh + tuần tra | Phố | Chơi được |
| 4 Bến cảng | Tiêu diệt toàn bộ | AI cấp 2 (ẩn nấp sau container) | Khu cảng: bãi container, kho, nhà máy, bồn dầu, bãi đường ray, vũng cảng | Chơi được |
| 5 Cố thủ quảng trường | Cố thủ 120 giây | **drone cảm tử** theo đợt, AI cấp 2 | Phố | Chơi được |
| 6 Mũi tấn công | Co-op, tiêu diệt toàn bộ | AI cấp 2 | Phố | Chơi được |
| 7 Đường mòn cát | Hộ tống | lính mang mìn, drone cảm tử, AI cấp 2 | Sa mạc | Chơi được |
| 8 Ốc đảo | Cố thủ 40 giây → A-10 + 5 xe tăng đồng minh tới, cùng dọn sạch (màn cao trào) | AI cấp 2 | Sa mạc | Chơi được |
| 9 Đèo gió | Co-op (3 xe tăng ta đánh vòng cao nguyên đông) + chiếm trạm gác đèo 25 giây; pháo diệt tăng trên 2 vách nhìn xuống hẻm | AI cấp 3 | Đồi núi | Chơi được |
| 10 Pháo đài | 3 chặng liền: chiếm sân cổng nam (20 giây) → cố thủ 45 giây (phản kích từ bắc và sau lưng) → tiếp viện 5 xe tăng + 2 lượt A-10 tới, tiêu diệt toàn bộ | AI cấp 3, đủ mặt | Đồi núi | Chơi được |

- **[CHỐT] Độ khó tăng dần từ màn 2** (màn 1 giữ dễ cho người mới): sát thương địch ×1,15 (màn 2), ×1,2 (màn 3), ×1,3 (màn 5); thêm tổ cơ giới và tổ bộ binh, ít trạm sửa hơn. Màn cố thủ: quân tăng viện ưu tiên tràn vào chiếm vùng khi chưa thấy người chơi, buộc người chơi về giữ vùng.
- **[CHỐT] Các màn dùng chung bản đồ phố thì xuất phát ở khu khác nhau** (màn 1 tây nam, màn 2 đông bắc, màn 3 tây bắc, màn 5 đông nam) và bố cục khối khác nhau, để không thấy lặp.
- Hộ tống: mỗi xe tiếp tế có thanh máu (xanh, vàng, đỏ).
- Thắng màn thì mở màn kế (chung cho cả hai class). Menu có hàng chọn màn và nút "Mở mọi màn để thử".
- Màn nhiều chặng: ô nhiệm vụ có số chặng (vd. 2/3) màu vàng ở đầu; mỗi lần sang chặng có thông báo "CHẶNG n/3 · …". Độ khó: sát thương địch ×1,4 (màn 9), ×1,45 (màn 10).

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
- **Lỗi đã biết, phải sửa trước khi phát hành:** trên iPhone, joystick không hoạt động trong **Safari** nhưng chạy tốt trong **Chrome** (cùng lõi WebKit), nên nghi do cử chỉ vuốt mép trái hoặc bộ nhớ đệm của Safari. Đang test bằng Chrome. Menu cài đặt có dòng "Hiện thông tin cảm ứng" để chẩn đoán.
- **Đã biết về iPhone:** Safari không cho game web toàn màn hình thật. Nút fullscreen của itch có thể không giải quyết được. Cần test trên máy thật.

- **Joystick trên iOS (đã sửa):** WebKit mới trên iOS (cả Safari lẫn Chrome) đánh số ngón tay bằng số âm; code cũ coi số âm là "joystick trống" nên xe không chạy. Nay joystick dùng giá trị rỗng (null) để báo trống. Tìm ra nhờ dòng thông tin cảm ứng trong video quay màn hình của chủ dự án.

## 14. Lộ trình theo giai đoạn

Nguyên tắc: **cơ chế trước, hình ảnh sau.** Asset chỉ quyết định được khi đã biết game cần những vật thể gì.

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Bản thử điều khiển, camera, khung dự án, gray-box màn 1 | Xong |
| 1 | Vũ khí phụ (súng máy, tên lửa), quy mô nhà, sửa chữa | Xong, đang chơi thử |
| 2 | **Nâng cấp và tiến trình:** vật phẩm rơi trong màn, chọn 1 món giữ lại cuối màn, lưu tiến trình trên máy | Xong, đang chơi thử |
| 3 | **Đồng đội AI:** 3 loại chọn trước khi vào màn + droid sửa chữa | Xong, đang chơi thử |
| 4 | **Kẻ địch và nhiệm vụ mới:** AI chiến thuật 3 cấp, tổ tuần tra, pháo diệt tăng săn mục tiêu, robot đồng đội đánh sườn (xong); còn lại: robot địch, droid trinh sát, bộ binh, drone cảm tử; hộ tống, giải cứu, chiếm cứ điểm | Đang làm |
| 5 | **Hình ảnh:** thế giới và xe dựng bằng code; quy hoạch đô thị theo tỉ lệ thật (xong cho khu phố); comic, ảnh bìa, menu gen bằng AI | Khu phố xong |
| 6 | **Ngày đêm và thời tiết:** pháo sáng, ánh đèn, kính ảnh nhiệt, sương mù, mưa, bão | |
| 7 | **Nội dung:** 10 màn pilot (đô thị phần lớn, sa mạc, đồi núi), các ô comic cốt truyện | |
| 8 | Âm thanh, hoàn thiện, phát hành itch.io, bảng xếp hạng | |

## 15. Câu hỏi còn mở

- Kéo ngược joystick: lùi hay quay đầu?
- Số liệu tinh chỉnh độ ì và tốc độ xoay sau khi chơi thử trên máy thật.
- Cây nâng cấp chung: chi tiết từng nhánh.
- Danh sách drone/droid/robot địch và hành vi.
- Ảnh reference cho phong cách hình ảnh và các ô comic.
- Đồng đội AI (drone/droid) chưa có trong gray-box.
