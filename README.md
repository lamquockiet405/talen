# Dấu ấn lịch sử

Website tư liệu lịch sử lấy cảm hứng từ https://vrn202-g3.vercel.app/. Frontend **Next.js App Router + React + TypeScript**, backend **Express 5**, database **PostgreSQL**, quản lý bằng **pgAdmin 4**.

> pgAdmin 4 là công cụ quản trị, không phải hệ cơ sở dữ liệu. Express kết nối trực tiếp PostgreSQL qua thư viện `pg`. Website không cần mở pgAdmin để hoạt động.

## Chạy nhanh trên máy hiện tại (Windows)

Máy đã có Node.js và PostgreSQL 18. Trong PowerShell, tại `D:\product creation`:

```powershell
npm.cmd install
npm.cmd run db:local
npm.cmd run db:setup
npm.cmd run dev
```

- Website: http://localhost:3000
- API: http://127.0.0.1:4000/api/health
- PostgreSQL riêng của dự án: `127.0.0.1:55432`, database `museum`, user `museum`.
- Mật khẩu phát sinh ngẫu nhiên và lưu trong file `.env`. Không đưa file này lên Git.
- `db:local` sử dụng các executable PostgreSQL đã cài ở `C:\Program Files\PostgreSQL\18\bin`. Có thể chỉ định `PG_BIN` nếu khác đường dẫn.
- Lần đầu chạy PostgreSQL có thể cần cấp quyền chạy tiến trình bên ngoài môi trường sandbox. Khi chạy trực tiếp trên máy, chỉ cần dùng tài khoản Windows bình thường.
- Cluster nằm trong `.local/postgres`, độc lập với dịch vụ PostgreSQL cổng 5432 hiện có. Lệnh không đổi mật khẩu hay sửa cơ sở dữ liệu sẵn có.
- Đóng frontend/API bằng Ctrl+C. Dừng database riêng bằng `npm.cmd run db:stop`.

Nếu `.env` đã trỏ tới database khác, `db:local` sẽ dừng để tránh ghi đè cấu hình. Dùng `db:setup` trực tiếp với database do bạn cấu hình.

## Kết nối pgAdmin 4 đã cài trên máy

1. Mở pgAdmin 4 → **Register → Server**.
2. General → Name: `Dau an lich su (local)`.
3. Connection → Host: `127.0.0.1`, Port: `55432`, Maintenance database: `museum`, Username: `museum`.
4. Password: lấy phần mật khẩu trong `DATABASE_URL` của file `.env`.
5. Mở `Databases → museum → Schemas → public → Tables`.

Có thể dùng **Tools → Import/Export Servers** để nhập file `database/pgadmin-servers.json`; file này chỉ chứa địa chỉ server, không lưu mật khẩu.

Các bảng: `leaders`, `terms`, `sources`, `eras`, `leader_sources`, `leader_eras`, `congresses`, `documents`, `site_content`, `schema_migrations`. Dùng **View/Edit Data** để xem dữ liệu; các trường nội dung đầy đủ nằm ở cột JSONB `payload`.

Với tên người, sửa cột `leaders.name`. Với nhiệm kỳ, sửa `terms.title`, `kind`, `start_label`, `end_label`, `start_year`, `end_year`; API ưu tiên các cột này hơn nội dung JSONB. Thông tin còn lại lưu trong `payload`. Chỉnh nguồn quan hệ qua `leader_sources` và `leader_eras`. API đọc dữ liệu trực tiếp; tải lại trang web sau khi sửa để thấy thay đổi.

## Phương án Docker: PostgreSQL + pgAdmin 4

Docker Desktop phải đang chạy. Chọn phương án này **thay cho** cluster cục bộ vì cùng dùng cổng 55432.

1. Dừng cluster cục bộ nếu đang chạy: `npm.cmd run db:stop`.
2. Dùng `.env.example` làm mẫu. Đặt `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` và `DATABASE_URL` tương ứng. Không ghi đè file `.env` hiện tại nếu còn sử dụng cluster cục bộ; giữ lại thông tin đăng nhập của nó.
3. Chạy:

```powershell
docker compose up -d
npm.cmd run db:setup
npm.cmd run dev
```

Mở http://localhost:5050 và đăng nhập bằng thông tin pgAdmin trong `.env`. Đăng ký server bằng host **`postgres`**, port **`5432`**, database/user/password lấy từ `.env`. Đây là kết nối giữa hai container; không dùng `localhost:55432` trong pgAdmin Docker.

Không dùng `docker compose down -v` nếu muốn giữ dữ liệu. Docker volumes là dữ liệu bền vững, seed không tự ghi đè bản ghi đã có.

## Chức năng

- Trang chủ theo phong cách bảo tàng số, tông giấy ngà – đỏ đô, tương thích điện thoại.
- 13 hồ sơ nhân vật; lọc theo tên, giai đoạn, năm và chức danh; sắp xếp; lưu hồ sơ trên trình duyệt.
- Hồ sơ chi tiết, các nhiệm kỳ, các mốc cuộc đời, bối cảnh, sự kiện, tư liệu liên quan và trích dẫn.
- Biểu đồ nhiệm kỳ tương tác và danh sách dọc; xử lý nhiều nhiệm kỳ và thời điểm chồng lấn.
- 14 kỳ Đại hội và 2 hội nghị đầu tiên, cùng các trang chi tiết.
- Thư viện văn kiện và danh mục 20 nguồn tham khảo có tìm kiếm, lọc.
- Tìm kiếm toàn bộ kho qua Express, hỗ trợ tiếng Việt không dấu.
- So sánh 2–3 hồ sơ; lưu lựa chọn trên trình duyệt.
- Lịch sử chức danh; bảng đối chiếu dữ kiện và khác biệt nguồn.
- Hộp nguồn bằng native dialog, hỗ trợ đóng bằng Escape; menu điện thoại, sáng/tối, điều hướng bàn phím, giảm chuyển động và bản in.
- Trang lỗi, trạng thái chờ, trang không tồn tại và metadata từng hồ sơ.

## Xuất xứ dữ liệu

`database/seed-data.json` chứa dữ liệu nhập từ trang người dùng cung cấp ngày 02/11/2026; bản mẫu ghi cập nhật 31/10/2026. Dữ liệu đã được chuyển sang cấu trúc riêng, liên kết nguồn được giữ lại. **Không tuyên bố đã kiểm chứng độc lập**; website hiển thị rõ trạng thái nhập dữ liệu, kể cả các nội dung năm 2026.

Script nhập dữ liệu: `scripts/import-reference.mjs`, sử dụng bản HTML tham khảo ở `reference.html` (bị Git bỏ qua). File HTML không cần để chạy website. Không dùng script nhập lại để cập nhật database production tự động.

Ảnh chân dung Hồ Chí Minh: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_-_1946_Portrait.jpg). Tác giả không rõ; trang nguồn ghi phạm vi công cộng tại Việt Nam. Ghi công có trên trang Giới thiệu. Các hồ sơ khác dùng chữ viết tắt, không giả làm ảnh tư liệu. CSS cắt khung và điều chỉnh sắc độ.

## Kiến trúc

```text
apps/web/                  Next.js, React, TypeScript, CSS
  src/app/                 Trang chủ, chuyên mục, hồ sơ, Đại hội
  src/components/          Giao diện và tương tác
  src/lib/                 Kiểu dữ liệu và kết nối API
apps/api/                  Express REST API
  src/app.mjs              Routes, validation, middleware, xử lý lỗi
  src/catalog.mjs          Đọc PostgreSQL, lọc và lập chỉ mục tìm kiếm
  src/setup.mjs            Khởi tạo schema và seed theo transaction
  test/                    Kiểm thử tích hợp với PostgreSQL thật
database/                  Schema SQL và dữ liệu khởi tạo
scripts/                   Chạy dịch vụ và cluster PostgreSQL riêng
compose.yaml               PostgreSQL + pgAdmin 4
```

Browser → Next.js → Express → PostgreSQL. Next.js đọc API khi render trang và proxy `/api/*` sang Express. Không có dữ liệu dự phòng giả khi database mất kết nối: màn hình lỗi hiển thị và cho tải lại. Bản này phục vụ tra cứu công khai, không bổ sung trang quản trị hoặc API ghi không có xác thực; có thể sửa nội dung qua pgAdmin khi phát triển.

## API

| Method | Đường dẫn | Chức năng |
|---|---|---|
| GET | `/api/health` | Kết nối PostgreSQL thực |
| GET | `/api/catalog` | Bộ dữ liệu đầy đủ |
| GET | `/api/leaders?q=&era=&year=&kind=` | Lọc hồ sơ |
| GET | `/api/leaders/:slug` | Một hồ sơ |
| GET | `/api/search?q=` | Tìm kiếm toàn bộ kho |
| GET | `/api/compare?slugs=tran-phu,le-duan` | Đối chiếu 2–3 người |
| GET | `/api/congresses` | Danh sách Đại hội |
| GET | `/api/congresses/:id` | Chi tiết Đại hội |
| GET | `/api/documents` | Tư liệu |
| GET | `/api/sources` | Nguồn |
| GET | `/api/eras` | Giai đoạn |
| GET | `/api/titles` | Chức danh |
| GET | `/api/audit` | Dữ kiện và các khác biệt nguồn |

API chỉ đọc. Cấu hình CORS qua `WEB_ORIGIN` (nhiều origin phân tách bằng dấu phẩy), `helmet`, giới hạn JSON request, kiểm tra query và thông báo lỗi không lộ stack/connection string. SQL có tham số; tên bảng động chỉ lấy từ danh sách hằng số nội bộ.

## Kiểm tra và build

Database phải đang chạy và đã seed:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Build không yêu cầu PostgreSQL đang chạy vì trang dùng dynamic rendering. Khi truy cập bản production, Express và database phải hoạt động.

## Triển khai

Triển khai Next.js trên môi trường Node hỗ trợ Next.js và Express trên dịch vụ Node riêng; cung cấp PostgreSQL được quản lý hoặc trên máy chủ của bạn. Thiết lập `API_URL` trên server Next.js, `DATABASE_URL` và `WEB_ORIGIN` trên Express. API mặc định chỉ bind loopback; khi triển khai container, đặt `API_HOST=0.0.0.0` và cấu hình mạng máy chủ phù hợp. Font tiếng Việt được phục vụ cục bộ qua Fontsource, không cần Google Fonts khi truy cập.

Không thể chạy Express/PostgreSQL nguyên cấu hình này bằng hosting tĩnh. pgAdmin là công cụ nội bộ; compose chỉ bind cổng ở loopback. Không đưa file `.env`, `.local`, mật khẩu hay pgAdmin lên website công khai.
