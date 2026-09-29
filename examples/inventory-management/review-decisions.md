# Quyết định BA — INV-DEMO-01

## Giả định dùng cho bản demo

| ID | Giả định | Trạng thái |
|---|---|---|
| ASM-01 | Phạm vi mẫu gồm xem lịch sử biến động, nhập kho và xuất kho. | Chấp nhận cho demo |
| ASM-02 | Một nhân viên kho được tạo cả phiếu nhập và phiếu xuất. | Chấp nhận cho demo |
| ASM-03 | Phiếu mới được ghi trực tiếp vào lịch sử với loại “Nhập kho” hoặc “Xuất kho”. | Chấp nhận cho demo |

## Câu hỏi cần chốt trước khi triển khai thật

| ID | Câu hỏi | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| Q-01 | Có cho phép xuất vượt quá tồn khả dụng không? | Validation và cảnh báo trên phiếu xuất | Mở, không chặn demo |
| Q-02 | Phiếu kho có cần quy trình duyệt không? | Vai trò, trạng thái và màn hình phê duyệt | Mở, không chặn demo |
| Q-03 | Có quản lý nhiều vị trí/bin trong một kho không? | Trường dữ liệu và cách hiển thị tồn | Mở, không chặn demo |
