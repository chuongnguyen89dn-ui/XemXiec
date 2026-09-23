# TIEP TUC DU AN - XIEC -> XEMXIEC

## Muc dich
Day la ho so ban giao day du cua du an, ghi lai qua trinh tu repo Xiec cu den XemXiec hien tai, gom kien truc, cach phat, Trailer/Snap, cac commit moc, cac thu nghiem thanh cong/that bai, nguyen nhan, dieu khong nen lap lai, va trang thai hien tai.

Nguyen tac: khong xoa lich su. Moi thay doi lon phai ghi them vao file nay.

---

## 1. Repo Xiec cu
Repo:
- https://github.com/chuongnguyen89dn-ui/xiec

Muc tieu:
- addon cho Nuvio;
- phim chinh phat #1/#2;
- van co giao dien fake "Mua 1" trong trang chi tiet;
- Trailer dung dau Mua 1;
- Snap 1, Snap 2... theo sau;
- Trailer phat tu JAVTrailers;
- Snap chi la anh preview.

Cau truc fake Season 1 lich su:
- meta type van la movie;
- meta.videos duoc dung de Nuvio hien giao dien giong series;
- Trailer: season 1, episode 0, id <movie_id>:trailer;
- Snap 1: season 1, episode 1, id <movie_id>:image:1;
- Snap N: season 1, episode N;
- /stream/movie/<movie_id>.json -> #1/#2;
- /stream/movie/<movie_id>:trailer.json -> Trailer;
- /stream/movie/<movie_id>:image:N.json -> [].

Cac commit Xiec quan trong:
- cfa6153fbf444f02e7079fae66b27714a252db3e: Trailer dau Mua 1, season 1/episode 0, co giai doan inline streams.
- b3d72efd874de6a41cd75aaa501ec2cdd91c7b68: thu tach native trailers khoi Snap.
- 3514e224071f2ccfa2eebc2799353daa9b2d8f46: dua Trailer card tro lai videos, stream route tach :trailer.
- 77611e34caaadf065d08bccef7199b7d25a713ce: tiep tuc cau truc fake Season 1.
- 9aac7de055078ad9a45d8ef6946a587a44a82b00: co xu ly rieng PGD-932 / direct MP4 fallback.

Poster Trailer lich su:
- ChatGPT Image 16_44_50 16 thg 9, 2026.png
- SHA: 1b838130ff0150500fefabefcc72a2518d95f9e9
- trailer-poster.webp
- SHA: 24ce83d7650124a83ac8d2aa3fd060fae546e1fe

Bai hoc:
- Khong phu thuoc vao service Xiec cu de lay poster.
- Khong assume code Xiec cu se cho hanh vi giong tren Nuvio hien tai.

---

## 2. Repo XemXiec hien tai
Repo:
- https://github.com/chuongnguyen89dn-ui/XemXiec

Render:
- workspace ID: tea-daifqm9594qs738j2860
- service ID: srv-danpq0h42hec73faebb0
- URL: https://xemxiec.onrender.com
- manifest: https://xemxiec.onrender.com/manifest.json
- branch: main
- region: Singapore

Build:
- npm install --omit=dev && npm run check && node scripts/audit-data.js

Start:
- npm start

Dataset:
- ket_qua_1500_phim.json
- 3225 movies
- audit: movies=3225 withStreams=3225

Nguyen tac du an:
- KHONG mang actor images tu Xiec sang XemXiec.
- Main movie phai la #1/#2.
- Trailer/Snap chi la phan giao dien bo sung.
- Khong doi movie thanh series toan bo.

---

## 3. Cau truc du lieu phim
Moi movie co:
- id, vi du movie_3225;
- code, vi du MIKR-112;
- manifest_url;
- streams #1/#2.

4 phim dau muc Phim moi nhat tai thoi diem phan tich:
1. movie_3225 - MIKR-112 -> co #1, #2
2. movie_3224 - PGD-932 -> co #1, #2
3. movie_3223 - SNOS-357 -> co #1, #2
4. movie_3222 - MIKR-084 -> co #1, #2

Ket luan:
- Hien tuong co phim chi hien Trailer KHONG phai dataset thieu #1/#2.
- Ca 4 record deu co day du #1/#2.
- Loi nam o identity/state cua Nuvio.

---

## 4. JAVTrailers
Ham chinh:
- javTrailerBases(code)
- discoverTrailer(code)
- discoverScenes(code)
- directPoster(code)

Trailer:
- thu playlist.m3u8 tren media.javtrailers.com;
- neu status 200 va noi dung bat dau #EXTM3U thi dung.

Scenes:
- images.javtrailers.com/digital/video/<cid>/<cid>jp-N.b800.webp

Poster phim:
- <cid>ps.w360.webp

PGD-932 fallback:
- https://media.javtrailers.com/litevideo/freepv/p/pgd/pgd00932/pgd00932_dmb_w.mp4

Khong xoa fallback PGD-932 neu chua co phuong an tot hon.

---

## 5. Muc tieu giao dien bat buoc
Trang chi tiet phim:
- nut Phat chinh -> #1/#2;
- van co Mua 1;
- Trailer dung dau;
- Snap 1, Snap 2... theo sau;
- Trailer phat JAVTrailers;
- Snap khong phat phim;
- Trailer khong duoc chiem nut Phat chinh.

Day la giao dien user xac nhan tung hoat dong tot trong qua khu.

---

## 6. Cac moc #1/#2 va bai hoc

### Baseline: #1/#2 hoat dong
Commit:
- fa7bdc0116e6eeb5e3f2d33abc00a010695a8c72
Message:
- Fix Nuvio movie playback identity and isolate trailers

Tinh trang:
- #1/#2 dung;
- meta khong co videos;
- nhuoc diem: mat fake Season 1 Trailer/Snap.

Bai hoc:
- meta.videos la thu lam Nuvio thay doi cach chon video phat.

### Khoi phuc Season 1
Commit:
- 6cfb2e171b4a5c3e51f65b8963ffa66eb1837c43
Message:
- Restore historical Season 1 Trailer and Snap layout

Ket qua:
- Trailer/Snap tro lai;
- sau do phat hien co phim nut Phat bi keo sang Trailer.

### Thu defaultVideoId mot minh
Them:
- behaviorHints.defaultVideoId = movie_id

Ket qua:
- khong du;
- Nuvio van co the uu tien Trailer/tap dau/state da luu.

### Thu inline Trailer stream
Commit:
- ec0d3514748754386f46b8c1113c9f0e6dac8f3a
Version:
- 1.2.1
Message:
- Decouple Season 1 trailer from main Play streams

Ket qua:
- Trailer phat;
- nut Phat van bi Trailer chiem;
- poster Trailer van khong hien.

Bai hoc:
- inline stream khong giai quyet hero identity.

### Khoi phuc exact Xiec cu
Commit:
- 47df79c196354712f002684ad0fffe5d14f82051
Version:
- 1.2.2

Da lam:
- bo defaultVideoId;
- bo inline stream;
- khoi phuc /stream/...:trailer;
- fake Season 1 nhu Xiec cu.

Ket qua:
- Nuvio hien tai van loi.
- Nuvio hien tai khong xu ly giong thoi Xiec cu.

### Them logical main video vao meta.videos
Commit:
- 4ab26406b2bc7eb02f5ea562d5a7464011fad8bf
Version:
- 1.2.3

Da lam:
- video logical dau tien co id = movie_id;
- Trailer/Snap theo sau.

Ket qua:
- khong on dinh;
- co phim co #1/#2, co phim van chi Trailer.

### Ket hop logical video + defaultVideoId
Commit:
- aa5df30755867d6f0e92457177a6f950bd4ab780
Version:
- 1.2.4

Da lam:
- video logical id = movie_id;
- defaultVideoId = movie_id;
- PGD-932 direct MP4 fallback;
- Cache-Control no-store cho meta.

Ket qua luc test:
- phim #1 co #1/#2;
- phim #2 PGD-932 khong;
- phim #3 co;
- phim #4 khong;
- ca 4 deu co Trailer;
- ca 4 deu co #1/#2 trong dataset.

Ket luan:
- khac biet la per-movie state cua Nuvio, khong phai source.

### Thu Trailer ID revision - THAT BAI
Commit:
- 2e278cc485cef42aa3981f025625dcc2b5ce58b8
Version:
- 1.2.5
Message:
- Invalidate stale trailer state and preserve main movie play

Da lam:
- Trailer id -> movie_xxx:trailer:r125

Ket qua:
- KHONG sua duoc;
- phim #1 con mat luon #1/#2.

Bai hoc:
- KHONG LAP LAI viec doi rieng Trailer ID de reset state.

Rollback:
- dcafbbadb624a0263712aa13cdc5520d610533d2
Message:
- Rollback trailer revision experiment

---

## 7. Phat hien quan trong tu source Nuvio
Da doc source NuvioTV.

Nuvio xem:
- isSeries = meta.type == SERIES OR meta.videos.isNotEmpty()

Nghia la:
- Movie co meta.videos se bi xu ly nhu series trong detail screen.

resolveHeroPlaybackVideo uu tien:
1. nextToWatch.nextVideoId
2. nextToWatch season/episode
3. defaultVideoId
4. episodesForSeason.firstOrNull()

Hero Play:
- neu heroVideo != null -> onEpisodeClick(heroVideo)
- chi neu heroVideo == null -> onPlayClick(meta.id)

Do do:
- state da luu cua Nuvio co the thang defaultVideoId;
- cung metadata nhung tung phim co the ra ket qua khac nhau.

PlaybackAvailability.canStream:
- co the phat neu inline video.streams co;
- hoac addon co stream resource;
- available khong phai dieu kien bat buoc cua canStream.

Episode card:
- episode.available == false chi hien badge unavailable;
- card van co onClick;
- khong nen dung available:false neu muc tieu la giao dien sach, tru khi test co chu dich.

---

## 8. Fix #1/#2 thanh cong hien tai: reset movie identity
Commit:
- f1579fdb66c09b52a6c2165283b5a52c1289053e
Message:
- Reset Nuvio movie state and self-host trailer poster
Version:
- 1.2.6

Co che:
- PUBLIC_REV = v126
- public movie ID = <internal movie id>:v126

Vi du:
- internal: movie_3224
- public: movie_3224:v126

Muc dich:
- Nuvio coi toan bo movie la identity moi;
- state Trailer/episode cu theo movie ID cu khong con map vao entry moi;
- detail state duoc khoi tao lai;
- defaultVideoId tro ve public movie ID moi.

Stream route van lay:
- baseId = rawId.split(':')[0]

Nen:
- movie_3224:v126 -> baseId movie_3224
- van map dung vao dataset cu;
- #1/#2 khong thay doi.

KET QUA USER XAC NHAN:
- "#1/#2 co roi."

NGUYEN NHAN HOAT DONG:
- khong phai do thay source;
- khong phai do Trailer;
- hoat dong vi reset public movie identity, lam state cu Nuvio mat hieu luc.

Khong nen:
- doi public revision hang ngay;
- chi doi khi schema/identity thay doi lon va can reset state.

---

## 9. Poster Trailer

### Loi cu
TRAILER_POSTER tung tro ve:
- xiec-fiaz.onrender.com
- hoac /trailer-poster.webp redirect ve Xiec cu.

Van de:
- phu thuoc service cu;
- XemXiec khong thuc su self-host;
- poster khong hien.

### Self-host webp
Commit:
- f1579fdb66c09b52a6c2165283b5a52c1289053e

File:
- trailer-poster.webp
- SHA: 24ce83d7650124a83ac8d2aa3fd060fae546e1fe

Route:
- /trailer-poster.webp

Sau khi 1.2.6 live:
- Render logs khong co request nao toi /trailer-poster.webp.

Ket luan:
- Nuvio co luc khong request thumbnail Trailer card;
- loi khong con chi la file/host.

### User upload PNG goc vao XemXiec
Commit:
- 627d56f87b55b3f0321112ceb981d8ad60f30dcc
Message:
- Add files via upload

File:
- ChatGPT Image 16_44_50 16 thg 9, 2026.png
SHA:
- 1b838130ff0150500fefabefcc72a2518d95f9e9

### Doi poster sang PNG raw cua chinh XemXiec
Commit:
- b6174995d99cc0d49b167ed4beeb5999070b143c
Message:
- Use uploaded XemXiec PNG for trailer poster
Version:
- 1.2.7

TRAILER_POSTER:
- https://raw.githubusercontent.com/chuongnguyen89dn-ui/XemXiec/main/ChatGPT%20Image%2016_44_50%2016%20thg%209%2C%202026.png

Render deploy:
- dep-dappm7id0e5s739vuolg
- LIVE

Trang thai:
- chua co xac nhan cuoi cung poster da hien tren Nuvio;
- neu van khong hien, tap trung vao Nuvio render logic / episode 0;
- KHONG tiep tuc doi host/URL anh ngau nhien.

---

## 10. Episode 0 va nghi van poster
Trailer:
- season 1
- episode 0

Snap:
- episode 1,2,3...

Nuvio source:
- VideoDto co thumbnail;
- Video model co thumbnail;
- EpisodeCard dung episode.thumbnail.

Nghi van:
- flow co lien quan episode 0 co the bi xu ly dac biet.

Neu PNG raw van khong hien:
- thu giu Trailer dung dau nhung thay numbering;
- chi thay numbering/thumbnail behavior;
- KHONG dong vao movie identity/#1/#2 dang hoat dong.

Khong ket luan episode 0 la nguyen nhan khi chua test.

---

## 11. Runtime hien tai
Public id:
- publicMovieId(m) = <internal id>:v126

Meta:
- type = movie
- behaviorHints.defaultVideoId = public id

videos:
1. logical main video
   - id = public id
   - khong season/episode

2. Trailer
   - id = <public id>:trailer
   - title = Trailer
   - season 1
   - episode 0
   - thumbnail = TRAILER_POSTER

3. Snap
   - id = <public id>:image:N
   - season 1
   - episode N

Stream:
- :image: -> []
- :trailer -> discoverTrailer(code)
- con lai -> m.streams #1/#2, manifest_url/mp4_url fallback

---

## 12. PhimHD baseline
Repo:
- chuongnguyen89dn-ui/phimHD

Service:
- https://phimhd.onrender.com

Bai hoc:
- Main playback on dinh khi movie meta khong co videos.
- Dung lam reference de phan biet loi source voi loi identity.

---

## 13. jav.sb enrichment - TAM DUNG
Da co:
- scripts/javsb-browser-enrich.js
- scripts/check-javsb-metadata.js
- javsb_metadata.json
- runtime merge
- PowerShell runner
- DNS workaround

Cac commit lien quan:
- ea27cc94...
- 69820c...
- b553377...
- 8450cff...
- 10afd219...
- b8171a...
- 3523fb0...
- ad2a437...
- 6ff5f15019a603f6e8a3c0d5648b9b0605cb2765

Trang thai:
- Cloudflare challenge loop;
- user da noi de sau;
- KHONG bypass Cloudflare;
- khong CAPTCHA solver/stealth/fingerprint spoof/token extraction.

---

## 14. Dieu KHONG DUOC LAP LAI
1. Khong mang actor images vao XemXiec.
2. Khong thay #1/#2 bang Trailer.
3. Khong de Trailer chiem nut Phat.
4. Khong xoa fake Season 1 neu user chua yeu cau.
5. Khong doi toan bo movie sang series.
6. Khong lap lai Trailer ID revision 1.2.5.
7. Khong redirect poster ve Xiec cu.
8. Khong phu thuoc vao mot source anh cu da hong.
9. Khong ket luan source thieu khi chua kiem tra dataset.
10. Khi Nuvio khac Stremio spec, uu tien source code Nuvio hien tai.

---

## 15. Checklist test sau moi thay doi
Bat buoc test:
- phim #1 latest;
- phim #2 PGD-932;
- phim #3;
- phim #4.

Kiem tra:
- #1 hien;
- #2 hien;
- Trailer card co;
- Trailer phat;
- Snap co;
- Snap khong phat;
- poster Trailer co hien;
- poster phim chinh dung;
- khong actor images;
- khong duplicate stream.

PGD-932:
- internal id: movie_3224
- public id hien tai: movie_3224:v126
- direct MP4 fallback phai con.

---

## 16. Trang thai hien tai - 23/09/2026
Repo:
- chuongnguyen89dn-ui/XemXiec

Runtime version:
- 1.2.7

Latest code commit:
- b6174995d99cc0d49b167ed4beeb5999070b143c
- Use uploaded XemXiec PNG for trailer poster

Latest Render deploy:
- dep-dappm7id0e5s739vuolg
- LIVE

Fix #1/#2:
- PUBLIC_REV = v126
- user da xac nhan #1/#2 co lai.

Poster Trailer:
- dang dung PNG user upload trong chinh XemXiec;
- can xac nhan Nuvio da hien poster hay chua.

Manifest:
- https://xemxiec.onrender.com/manifest.json

---

## 17. Viec tiep theo
1. Xac nhan poster Trailer PNG co hien khong.
2. Neu khong:
   - khong doi URL them mot cach ngau nhien;
   - nghien cuu episode 0 / Nuvio render path;
   - thu numbering Trailer neu can;
   - bao ve movie identity v126 dang giu #1/#2.
3. Sau khi on dinh moi quay lai jav.sb neu user yeu cau.
4. Moi thay doi lon phai cap nhat tiep file nay.

---

## 18. Tom tat mot dong
XemXiec = movie #1/#2 that + fake Season 1 Trailer/Snap; loi kho nhat la Nuvio luu hero/episode state theo movie ID lam Trailer chiem nut Phat; fix dang hoat dong la reset public movie identity sang :v126; khong lap lai Trailer-ID revision 1.2.5; poster dang dung PNG goc user upload trong XemXiec va can tiep tuc xac minh Nuvio co render thumbnail Trailer hay khong.
