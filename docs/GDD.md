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
- WASD/mũi tên để lái, chuột để ngắm, giữ chuột trái hoặc Space để bắn, Q tên lửa, E kỹ năng. Không có hỗ trợ ngắm.

### Gamepad
- Cần trái lái, cần phải ngắm (có hỗ trợ ngắm mềm, góc hút mặc định 10°), RT/RB bắn.

### Giao diện [CHỐT]
- 4 nút bên phải (BẮN, TÊN LỬA, KỸ NĂNG, SỬA) **mờ 55%**, rõ hẳn khi đang bấm.
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
| Kỹ năng riêng | Nạp đạn nhanh: 2 phát liên tiếp, hồi chiêu dài | Nitro: tăng tốc ngắn |

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
- **Hàng thả dù:** khoảng mỗi 50–70 giây rơi một thùng chứa 1 kit, cách xe 50–90 m, có mũi tên xanh chỉ hướng khi ở ngoài màn hình. Lái tới chạm vào để nhặt.
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
| Robot chống tăng | Đi bộ cạnh xe | 70 | Rocket 28 sát thương, nạp 3,5 giây, tầm 60 m |
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
- **Bộ binh [CHỐT]:** mang tên lửa chống tăng hoặc pháo chống tăng. Là mục tiêu mềm nên súng máy diệt được.
- **Drone cảm tử [CHỐT]:** lao vào xe và nổ. Lồng chống UAV chặn được tối đa 2 lượt.
- **Drone [CHỐT]:** bay cao hơn nóc nhà (tự lên cao khi bay qua nhà cao), không va hay xuyên qua nhà.
- **[CHỐT] Tổ tuần tra:** xe tăng và xe bọc thép đi theo tổ 2–3 xe, chạy vòng quanh các khối theo tuyến đường cố định, xe sau bám vết xe dẫn đầu (xe dẫn đầu chạy chậm lại chờ xe tụt). Phát hiện người chơi khi cách ~124 m. **Nghe tiếng súng:** mỗi phát pháo hoặc tên lửa của người chơi đánh thức mọi địch trong bán kính 180 m, chúng kéo tới tìm. Một xe trong tổ giao chiến thì cả tổ cùng kéo tới. Súng máy không gây động.
- **Pháo diệt tăng (địch):** không có tháp pháo, pháo cố định chỉ quay ±12°, phải xoay cả thân để nhắm (chậm). Giáp trước dày (5), hông và sau mỏng (2/1). Vai trò thiết kế: dạy người chơi cơ chế đánh vòng sườn. Đối đầu trực diện thì rất mạnh, bị vòng ra sau thì rất yếu.

## 9. Phá hủy và quy mô nhà [CHỐT]

- Công trình ghép từ các ô nhỏ (~10px thế giới). Đạn nổ trừ độ bền của các ô trong bán kính nổ, ô hết bền thì vỡ.
- **Quy mô nhà quyết định độ bền** (người chơi nhìn là biết):
  - **Nhà nhỏ** (nhà cấp 4, lán, tường rào): vỡ rất nhanh. **Đạn pháo xuyên qua** (khoảng 8 ô, ~16 m), khoét đường hầm rồi bay tiếp, trúng được xe núp phía sau. Đạn pháo tự động chỉ xuyên được 2 ô.
  - **Nhà thấp tầng** (nhà phố, container, tảng đá): phải bắn nhiều phát mới mở được lối.
  - **Nhà cao tầng:** **không phá được**, chỉ sứt mặt tường. Giữ bố cục đường phố cố định cho thiết kế màn.
- **Vật liệu** (bê tông, gạch, gỗ, thép, đá) chỉ còn là **trang trí**: màu sắc và kiểu mảnh vỡ. Thép tóe tia lửa, gỗ văng thanh dài, bê tông và gạch có bụi.
- Mảnh vỡ chủ yếu là hạt trang trí, rơi xong thì in xuống nền.
- **Nhà sập để lại đống đổ nát:** xe đi qua được nhưng chậm, đống đổ nát che được đạn một phần.

## 9b. Phong cách hình ảnh [CHỐT]

- **[CHỐT] Hướng vẽ bằng code.** Thế giới, xe và hiệu ứng **dựng hoàn toàn bằng code** theo phong cách pixel art. Mặt đất có vỉa hè lát gạch, bó vỉa, vạch kẻ làn, vạch qua đường, nắp cống, nền riêng từng loại khu. Nhà có tầng, cửa sổ, kính, gạch, ván gỗ, rãnh container; mái có gờ, máy lạnh, bồn nước, dãy pin mặt trời, ngói. Nhà đổ bóng xuống đất. Xe có vân xích, lưới tản nhiệt, nắp tháp pháo, đầu nòng.
- **Kiểu pixel** (mặc định **tắt** theo quyết định của chủ dự án vì bị răng cưa trên iPad/laptop; bật được trong cài đặt): vẽ đúng 1 điểm ảnh cho mỗi pixel của thế giới game rồi phóng to giữ cạnh sắc. Camera được làm tròn theo pixel để không bị rung viền.
- **Cây**, **ô tô đỗ**, **tường rào và sạp hàng** (công trình nhỏ cao ≤ 2 m): **cả xe tăng lẫn xe bọc thép húc đổ và đi xuyên qua** [CHỐT], bắn 1 phát là vỡ. Cây vẽ ước lệ, 4 dạng tán (tròn to, chùm 3 tán, cau/dừa hình sao, cây cảnh nhỏ), to nhỏ khác nhau. Robot thì bị cản. AI tìm đường coi chúng là đi qua được.
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
  - Công cộng: quảng trường có thảm cỏ, đài phun nước, tượng đài; chợ có nhà lồng và sạp; trường học chữ U quanh sân và sân thể thao; khu công nghiệp có tường rào, nhà kho, container, silo.
- **[ĐỀ XUẤT] Rừng và sa mạc** cũng theo luật thật: rừng có tán cây 6–15 m, lối mòn, suối, khoảng trống; sa mạc có làng ốc đảo, đồi cát, đường đất, tường đất thấp. Sẽ chốt khi tới các màn đó.

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
- **Lỗi đã biết, phải sửa trước khi phát hành:** trên iPhone, joystick không hoạt động trong **Safari** nhưng chạy tốt trong **Chrome** (cùng lõi WebKit), nên nghi do cử chỉ vuốt mép trái hoặc bộ nhớ đệm của Safari. Đang test bằng Chrome. Menu cài đặt có dòng "Hiện thông tin cảm ứng" để chẩn đoán.
- **Đã biết về iPhone:** Safari không cho game web toàn màn hình thật. Nút fullscreen của itch có thể không giải quyết được. Cần test trên máy thật.

## 14. Lộ trình theo giai đoạn

Nguyên tắc: **cơ chế trước, hình ảnh sau.** Asset chỉ quyết định được khi đã biết game cần những vật thể gì.

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Bản thử điều khiển, camera, khung dự án, gray-box màn 1 | Xong |
| 1 | Vũ khí phụ (súng máy, tên lửa), quy mô nhà, sửa chữa | Xong, đang chơi thử |
| 2 | **Nâng cấp và tiến trình:** vật phẩm rơi trong màn, chọn 1 món giữ lại cuối màn, lưu tiến trình trên máy | Xong, đang chơi thử |
| 3 | **Đồng đội AI:** 3 loại chọn trước khi vào màn + droid sửa chữa | Xong, đang chơi thử |
| 4 | **Kẻ địch và nhiệm vụ mới:** robot, droid trinh sát, bộ binh; hộ tống, giải cứu, chiếm cứ điểm | |
| 5 | **Hình ảnh:** thế giới và xe dựng bằng code theo phong cách pixel art; comic, ảnh bìa, menu gen bằng AI. Bước đầu: bản thử hình ảnh cho 1 khu phố | Tiếp theo |
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
