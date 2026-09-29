# Chỉ lấy sơ đồ cần thiết

Bộ `diagram-skills-package` là tài liệu tham khảo. Workflow này dùng **cách chọn sơ đồ và kiểm tra source/render**; không đưa cả 11 skill vào đường chạy mặc định. Canonical Spec là nguồn chung cho sơ đồ và mockup.

| Câu hỏi nghiệp vụ | Sơ đồ phù hợp | Dùng để quyết định UI |
|---|---|---|
| Vai trò nào làm gì? | Use case | Navigation, quyền xem và thao tác |
| Quy trình gồm bước và nhánh nào? | Activity; swimlane nếu nhiều vai trò bàn giao | Screen flow, action, error state |
| Đối tượng chuyển trạng thái ra sao? | State | Status, hành động hợp lệ theo trạng thái |
| Tương tác hệ thống ngoài ảnh hưởng UI? | Sequence | Loading, success, failure |
| Quan hệ dữ liệu ảnh hưởng form/list/detail? | ERD gọn | Field và dữ liệu hiển thị |

Một sprint có thể không cần sơ đồ nếu Spec đã rõ. BPMN, D2, DBML và kiến trúc hệ thống chỉ dùng khi có nhu cầu bàn giao tương ứng.

Khi tích hợp engine về sau: planner đề xuất sơ đồ dựa trên câu hỏi đang mở; BA chọn; diagram worker đọc Canonical Spec; kiểm cú pháp/render; BA đối chiếu nghiệp vụ; mọi sửa đổi quay lại Spec rồi mới tiếp tục Blueprint. Không cần cài gói skill gốc để chạy thử POC bằng tài liệu này.
