# Comic cốt truyện: bản nháp (ĐỀ XUẤT, chủ dự án sửa)

Mọi chi tiết bên dưới là **bản nháp của Claude**. Phần chủ dự án đã chốt: nhân vật chính, đơn vị, số hiệu xe, việc bị án kỷ luật, việc được điều ra tiền tuyến. Phần còn lại (tên kíp lái, lý do bị án, kết) là đề xuất.

Chữ trong comic (caption) viết tiếng Việt ở đây. Khi đưa vào game thì chép vào `src/lang/vi.txt` (nhóm `story.*`) và nối với `src/story.ts`, để bản tiếng Anh dịch cùng file.

---

## 1. Bối cảnh và nhân vật

**Đơn vị (hư cấu, tham khảo cấu trúc tiểu đoàn xe tăng hạng nặng của quân Đức):** Sư đoàn thiết giáp **Iron Tempest** → Trung đoàn xe tăng **King Tiger số 4** → xe **131**.
Cách đánh số lấy từ thực tế: chữ số đầu là đại đội 1, thứ hai là trung đội 3, thứ ba là xe số 1 trong trung đội. Ai biết sẽ thấy thích.
Phù hiệu: dùng **phù hiệu hư cấu** (tia sét trên bánh răng), tuyệt đối không dùng hoa văn, chữ thập hay ký hiệu thật của quân Đức Quốc xã. Cũng để tránh bộ lọc của tool tạo ảnh.

**Lieutenant Dan "Bug" (Trung úy Dan, biệt danh Bug)**, chỉ huy xe 131.
- Khoảng 25 tuổi, gầy, da nâu, tóc xoăn đen rối, **kính tròn gọng vàng** (giống ảnh tham khảo số 2), mắt mệt nhưng tỉnh. Dây chuyền thẻ bài.
- Biệt danh "Bug" có hai nghĩa: con bọ (nhỏ, bám dai) và "lỗi hệ thống" (kẻ không chịu làm theo kịch bản). Chi tiết nhỏ để lặp lại: **miếng dán con bọ rùa** trên tai nghe.
- Án kỷ luật: bất tuân thượng cấp trong trận quan trọng của Iron Tempest. **Lý do (đề xuất):** trận giữ đồi 204, anh bỏ đội hình để kéo một đại đội bộ binh bị kẹt ra, trận địa mất, nhưng bên ngoài chỉ biết "đã bỏ vị trí". Giữ mờ nhiều khung đầu để người chơi tò mò.
- Được **hoãn thi hành án** vì tiền tuyến thiếu người trầm trọng. Có thể không đúng quy định. Chi tiết này nên để cho kiểu "ai cũng biết nhưng không ai hỏi".

**Kíp lái xe 131 (đề xuất tên, sửa tùy ý):**
- **Mule**: lái xe, to con, ít nói, hay ăn.
- **Sparrow**: pháo thủ, nhỏ người, bắn chuẩn tới mức mê tín.
- **Tiny**: nạp đạn, cao hơn hai mét.
- **Static**: báo vụ, người nối với chỉ huy, hay nói.
(Trong game xe chỉ có Bug nên kíp xuất hiện ở comic, không ở trận.)

**Chỉ huy trên: Colonel Hale (Đại tá Hale).** Lạnh, ít lời, giao nhiệm vụ nguy hiểm cho Bug liên tục. Chưa rõ muốn giúp hay muốn anh chết, và đó là chủ ý.

**Mạch xuyên suốt:** mỗi nhiệm vụ Bug sống sót là một lần phiên tòa bị hoãn thêm. Cuối truyện, phiên tòa vẫn chờ, nhưng câu hỏi đổi từ "anh có tội không" thành "ai là người xử anh".

---

## 2. Khối STYLE (dán nguyên vào mọi khung)

```
STYLE: hand-painted animated film look, 3D rendered then painted over in 2D.
Loose, slightly uneven dark ink contour lines (varying thickness, sketchy,
visible pencil-like overlaps). Flat color shapes with visible dry-brush
strokes and paint texture, no smooth airbrushed gradients, no photoreal
skin or plastic CGI sheen. Hard-edged cel shadows with a warm orange rim
light on skin and dark navy-black shadow shapes. Strong colored practical
lights (acid green dashboard glow, amber/orange lamp glow) cast onto
surfaces. Muted olive, sand and desaturated khaki base palette with warm
amber and one cold accent. Slight film grain, shallow depth of field with
soft blurred painted backgrounds. Cinematic macro or close framing.
```

**Negative prompt:**
```
photorealistic, 3D plastic render, smooth gradients, glossy skin, anime big
eyes, clean vector lines, uniform thin outlines, text, watermark, logo,
real-world military insignia, swastika, extra fingers, deformed hands
```

---

## 3. Làm trước 3 tấm tham chiếu (character / vehicle sheet)

Tạo trước, rồi **đưa vào làm reference** ở mọi khung có người hoặc xe đó. Đừng chỉ mô tả bằng chữ.

**A. Bug (đầu, nửa người, nhìn thẳng + nhìn nghiêng):**
```
CHARACTER SHEET: Lieutenant Dan "Bug", tank commander, mid-20s, lean, brown
skin, messy curly black hair, thin round gold-rimmed glasses, tired but
alert eyes, short olive-khaki tanker jacket with fictional lieutenant collar
tabs, headset around his neck with a small ladybug sticker, steel chain with
dog tags, worn leather gloves. Front view and three-quarter view, neutral
grey background.
```

**B. Kíp lái (bốn người đứng cạnh nhau):**
```
CHARACTER SHEET: four tank crew in olive-khaki jackets, standing in a row:
"Mule" the driver, broad and heavy, quiet; "Sparrow" the gunner, small and
sharp-eyed with a lucky charm on his collar; "Tiny" the loader, over two
meters tall; "Static" the radio operator, wiry, headset on, always talking.
Neutral grey background.
```

**C. Xe 131:**
```
VEHICLE SHEET: heavy tank "King Tiger" style, boxy sloped armor, long gun,
olive paint with sand dust, white numeral "131" on the turret side, fictional
emblem of a lightning bolt over a gear on the hull. Three-quarter front,
side and rear views, neutral grey background.
```

---

## 4. Mười màn, mỗi màn ba khung

Mỗi khung gồm **CAPTION** (chữ hiện lên) và **PROMPT** (khối nội dung, đi sau khối STYLE).
Ưu tiên cận cảnh tay và đồ vật. Cảnh rộng và cảnh có mặt người đặt ít, vì dễ lệch style nhất.

### Màn 0: Huấn luyện tân binh (mở đầu)
**Nhịp:** Bug tới trại lúc sáng sớm, mang theo lệnh hoãn án. Xe 131 chờ sẵn.
1. CAPTION: *"Lệnh hoãn thi hành án. Hiệu lực: cho tới khi có người thay thế."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a hand holding a crumpled military order, a red stamp "SUSPENDED" half visible, dog tags dangling. SETTING: dawn, army camp tent. LIGHT: cold blue from outside, amber lantern. MOOD: tired, heavy.`
2. CAPTION: *"Xe 131. Bốn người, một chiếc xe, và một chỉ huy chưa ai tin."*
   PROMPT: `SHOT: low angle, medium. SUBJECT: the tank crew turning to look at a new commander approaching, only silhouettes and boots, tank looming behind. SETTING: training range, desert morning. LIGHT: low sun from behind, long shadows. MOOD: wary.`

### Màn 1: Khu phố 7 (tiêu diệt toàn bộ, đô thị)
**Nhịp:** Nhiệm vụ đầu. Bug lái vào khu phố đã mất, tay run mà không nói.
1. CAPTION: *"Nhiệm vụ đầu tiên. Dọn sạch khu phố 7."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: two hands gripping tank hatch edge, knuckles white, dust falling. SETTING: tank hatch opening, ruined city street ahead out of focus. LIGHT: harsh midday, dust haze. MOOD: tense.`
2. CAPTION: *Mule: "Chỉ huy, anh nắm cần số chặt quá."*
   PROMPT: `SHOT: close-up. SUBJECT: a driver's thick hands on steering levers, dashboard dials glowing acid green, a glove-wearing hand resting on his shoulder. SETTING: tank interior. LIGHT: green dashboard glow, orange from a periscope slit. MOOD: quiet, nervous humor.`
3. CAPTION: *"Một xe, hai phút đầu tiên. Cũng là cách anh làm quen với tiếng nổ."*
   PROMPT: `SHOT: medium-wide. SUBJECT: a tank rounding a street corner, muzzle flash, brick dust blasting off a wall. SETTING: ruined city block, Block 7. LIGHT: flash orange against dusty grey-blue. MOOD: sudden.`

### Màn 2: Ngã tư đại lộ (chiếm cứ điểm, bộ binh chống tăng)
**Nhịp:** Bộ binh nấp trong nhà. Bug học cách đọc một dãy nhà như đọc kẻ thù.
1. CAPTION: *"Chúng nấp trong từng cửa sổ. Chiếc xe không nhìn thấy chúng, nhưng người thì có."*
   PROMPT: `SHOT: close-up. SUBJECT: glasses reflecting a row of dark windows, one with a faint glint of metal. SETTING: tank commander seen through a vision slit. LIGHT: flat overcast, blue-grey. MOOD: dread.`
2. CAPTION: *Static: "Chỉ huy, tụi nó ngắm xuống rồi."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a radio operator's hand pressing a headset to his ear, a red warning light lighting his knuckles. SETTING: tank interior. LIGHT: red warning, green dials. MOOD: urgent.`
3. CAPTION: *"Giữ được ngã tư. Mất một con đường quay về."*
   PROMPT: `SHOT: wide-ish. SUBJECT: a tank standing at an intersection, smoke trails, a distant rocket streak crossing the sky. SETTING: avenue crossing, late afternoon. LIGHT: gold smoke-lit. MOOD: relief mixed with unease.`

### Màn 3: Đoàn xe tiếp tế (hộ tống, đô thị)
**Nhịp:** Lần đầu Bug phải đứng yên che cho người khác. Anh nhớ đồi 204.
1. CAPTION: *"Ba xe tải. Thuốc, đạn, xăng. Không xe nào được phép bỏ lại."*
   PROMPT: `SHOT: close-up. SUBJECT: a truck's number plate and a driver's tired hand resting on the door, rain-less dusty road behind. SETTING: city outskirts at dawn. LIGHT: pale gold. MOOD: determination.`
2. CAPTION: *"Dừng lại. Chờ. Dễ hơn mọi nhiệm vụ anh từng bị phạt vì không làm."*
   PROMPT: `SHOT: close-up. SUBJECT: a commander's hand easing off a hatch lever, a convoy passing by blurred, a ladybug sticker on the headset. SETTING: tank halting on a roadside. LIGHT: warm amber, shallow depth. MOOD: restrained.`
3. CAPTION: *"Xe cuối cùng tới điểm tập kết. Không ai nói gì, nhưng Mule rút ra một gói bánh quy."*
   PROMPT: `SHOT: medium close-up. SUBJECT: a big hand offering a pack of biscuits through the hatch, a lieutenant's glove reaching for it. SETTING: rally point, dusk. LIGHT: soft orange. MOOD: small warmth.`

### Màn 4: Bến cảng (tiêu diệt, khu công nghiệp)
**Nhịp:** Container, kho, bồn dầu. Địch biết nấp. Bug học đánh sườn. Thư của hội đồng kỷ luật tới.
1. CAPTION: *"Địch nấp sau thép. Muốn bắn nó thì phải đi vòng."*
   PROMPT: `SHOT: low angle. SUBJECT: stacks of colorful shipping containers and a tank's barrel poking around the corner. SETTING: harbour yard, overcast. LIGHT: cool grey, orange warning lamps. MOOD: predatory.`
2. CAPTION: *Sparrow: "Mạn trái, chỉ huy. Bên đó giáp mỏng."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a gunner's eye against a sight, painted reticle reflected in the lens. SETTING: tank gunsight. LIGHT: green and amber. MOOD: focused.`
3. CAPTION: *"Thư tới lúc nửa đêm. Phiên tòa: chưa ấn định ngày."*
   PROMPT: `SHOT: close-up. SUBJECT: a thumb pressing an unopened envelope with a red seal on an ammunition crate, lamp light. SETTING: tank by the dock at night. LIGHT: single amber lamp. MOOD: dread, private.`

### Màn 5: Cố thủ quảng trường (cố thủ 120 giây, đêm, pháo sáng)
**Nhịp:** Bug nhận lệnh rút lui trên radio. Tiếp viện còn hai phút nữa. Anh ở lại. Lần thứ hai bất tuân, lần này không ai biết đúng hay sai.
1. CAPTION: *"Lệnh từ sở chỉ huy: rút lui, ngay."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a radio dial and a hand turning it down, orange numerals glowing, a distant flare reflected on the glass. SETTING: tank interior at night. LIGHT: orange dial glow, flare white outside. MOOD: decision.`
2. CAPTION: *"Tiếp viện còn một trăm hai mươi giây. Anh ở lại."*
   PROMPT: `SHOT: low angle wide. SUBJECT: a lone tank in a night square, a flare hanging in the sky lighting the plaza, rain-wet stone. SETTING: city square at night. LIGHT: white-orange flare light, deep navy shadows. MOOD: stubborn courage.`
3. CAPTION: *Static: "Chỉ huy… anh vừa tắt radio của đại tá."*
   PROMPT: `SHOT: close-up. SUBJECT: a radio operator staring wide-eyed with an unplugged headset cable in his hand, a small ladybug sticker dangling. SETTING: tank interior. LIGHT: red and green dial lights. MOOD: dread, dark humor.`

### Màn 6: Mũi tấn công (co-op, đô thị)
**Nhịp:** Tổ xe tăng bạn đánh cùng Bug. Chỉ huy tổ có mặt trong trận đồi 204, và biết sự thật.
1. CAPTION: *"Ba xe lam. Một xe 131. Một đại lộ."*
   PROMPT: `SHOT: wide. SUBJECT: four tanks advancing down an avenue in a staggered column, blue-painted allied tanks and one olive "131". SETTING: city avenue, morning. LIGHT: gold sun through smoke. MOOD: heroic.`
2. CAPTION: *"Captain Ruiz biết anh. Cô ấy có mặt ở đồi 204."*
   PROMPT: `SHOT: close-up. SUBJECT: a female captain's gloved hand raised in a halt gesture from a hatch, blue paint on her tank, a tattered unit patch. SETTING: tank hatch. LIGHT: warm dust haze. MOOD: recognition, tension.`
3. CAPTION: *"Cô nói: 'Tôi nhớ những người anh kéo ra. Hội đồng thì không.'"*
   PROMPT: `SHOT: medium close-up over-the-shoulder. SUBJECT: two tank commanders on opposite hatches, one lowering a cigarette, glasses reflecting her silhouette. SETTING: pause between assaults. LIGHT: soft side light, painted dust. MOOD: quiet conspiracy.`

### Màn 7: Đường mòn cát (hộ tống, sa mạc, đêm)
**Nhịp:** Đêm sa mạc, mìn, làng ốc đảo. Cả kíp lần đầu nói chuyện thật với nhau.
1. CAPTION: *"Đêm sa mạc lạnh hơn người ta tưởng."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a hand wrapped around a tin cup of steaming tea, sand blowing across the rim. SETTING: tank turret, desert night. LIGHT: amber lantern, cold blue moonlight. MOOD: quiet.`
2. CAPTION: *Tiny: "Hồi ở nhà tôi chưa bao giờ ra khỏi thành phố."*
   PROMPT: `SHOT: medium close-up. SUBJECT: a huge loader sitting on the rear deck with a small paper photograph in his fingers, tracks and sand behind. SETTING: desert halt at night. LIGHT: amber lamp, blue moon. MOOD: tender.`
3. CAPTION: *"Một tiếng nổ ở đầu đoàn xe. Mìn."*
   PROMPT: `SHOT: wide. SUBJECT: a convoy on a desert track, a plume of sand and fire erupting ahead, a tank's headlight cones cutting the dark. SETTING: desert track at night. LIGHT: orange blast against indigo. MOOD: sudden danger.`

### Màn 8: Ốc đảo (cố thủ 40 giây, tiếp viện + A-10, sa mạc)
**Nhịp:** Nguồn nước duy nhất. Bốn hướng. Tiếp viện tới, kèm A-10. Lần đầu có người đứng về phía Bug.
1. CAPTION: *"Một vũng nước. Cả vùng này sống hay chết vì nó."*
   PROMPT: `SHOT: close-up. SUBJECT: a cupped hand holding clear water, ripples, a palm shadow, tank tracks pressed into wet sand. SETTING: oasis pond. LIGHT: harsh noon, turquoise reflection. MOOD: precious.`
2. CAPTION: *"Bốn hướng. Bốn mươi giây. Một cái radio vẫn còn nối với đại tá."*
   PROMPT: `SHOT: wide low angle. SUBJECT: tank in the middle of an oasis, enemy dust clouds approaching from four directions, palm trees silhouetted. SETTING: desert oasis. LIGHT: orange-yellow dust haze. MOOD: surrounded.`
3. CAPTION: *"Tiếng động cơ phản lực. Đại tá Hale đã nghe thấy."*
   PROMPT: `SHOT: low angle from the ground. SUBJECT: a ground-attack jet screaming overhead, its shadow sweeping across the sand, a lieutenant looking up with glasses reflecting the sky. SETTING: oasis. LIGHT: bright sun, deep shadows. MOOD: relief, awe.`

### Màn 9: Đèo gió (co-op, chiếm trạm gác, núi, đêm)
**Nhịp:** Hẻm núi, pháo diệt tăng trên vách. Tổ bạn đi vòng cao nguyên. Bug thấy một đại đội kẹt dưới vách, giống đồi 204, và lần này không có đồng đội thì không thể.
1. CAPTION: *"Đèo gió. Kẻ nào đi thẳng vào hẻm là đưa đầu cho vách đá."*
   PROMPT: `SHOT: wide. SUBJECT: a narrow mountain pass at night, a tank's twin headlight cones cutting between dark pine-covered cliffs, a faint red light on a ridge. SETTING: mountain pass. LIGHT: cold teal moonlight, warm headlights. MOOD: foreboding.`
2. CAPTION: *"Dưới vách có một đại đội bộ binh bị kẹt. Anh biết cảnh này."*
   PROMPT: `SHOT: close-up. SUBJECT: glasses reflecting tiny figures sheltering behind a rock wall in a flare's light, a hand tightening around a hatch grip. SETTING: tank hatch, mountain night. LIGHT: flare white, blue shadows. MOOD: déjà vu.`
3. CAPTION: *Captain Ruiz (radio): "Đi đi, Bug. Tôi giữ cao nguyên."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a headset crackling, a hand pressing it, a ladybug sticker catching a flare's glint. SETTING: tank interior. LIGHT: green dial glow, white flare through the vision slit. MOOD: resolve.`

### Màn 10: Pháo đài (3 chặng, trận cuối, núi)
**Nhịp:** Sở chỉ huy địch trong pháo đài đá. Chiếm cổng, cố thủ, rồi tiêu diệt. Kết mở: phiên tòa vẫn chờ, nhưng câu hỏi đã đổi.
1. CAPTION: *"Pháo đài. Bốn cổng, một đêm, một cơ hội."*
   PROMPT: `SHOT: wide low angle. SUBJECT: a massive stone fortress in a mountain valley at dusk, four gates glowing amber, a lone tank on the road below. SETTING: valley, dusk. LIGHT: orange sunset against purple mountains. MOOD: epic, small human.`
2. CAPTION: *"Kíp 131 vẫn đủ bốn người. Và một chỉ huy chưa từng bỏ ai lại."*
   PROMPT: `SHOT: medium close-up group. SUBJECT: four crew faces lit from below by dashboard light, a lieutenant with round gold glasses at the center, ladybug sticker on headset. SETTING: tank interior. LIGHT: acid green dash glow, orange rim light. MOOD: bond, calm before the storm.`
3. CAPTION: *"Sau trận, radio gọi: 'Trung úy Dan. Phiên tòa đã được ấn định.' Anh bật cười."*
   PROMPT: `SHOT: extreme close-up. SUBJECT: a hand turning off a radio knob, orange indicator fading, a faint reflection of dawn on glass and round gold glasses folded beside it. SETTING: tank at dawn, battlefield smoke. LIGHT: soft pink-gold dawn, last orange glow. MOOD: bittersweet, open ending.`

---

## 5. Câu hỏi cần chủ dự án chốt
- Lý do bị án (đồi 204, kéo bộ binh ra) giữ hay đổi?
- Tên kíp lái, đại tá Hale, captain Ruiz giữ hay đổi?
- Kết mở (phiên tòa ấn định ngày) hay kết đóng (tha, hoặc phạt)?
- Có thêm khung cho màn thua (xe bị phá hủy) không? Đề xuất: một khung cận cảnh, đen trắng, chỉ có tiếng radio.
