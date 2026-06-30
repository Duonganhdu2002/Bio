# Bio — Prompt theo từng Agent (copy-paste ready)

Mỗi file dưới đây là **một prompt độc lập**, đã nhúng sẵn "Hợp đồng chung" (data contract + convention).
Cách dùng: mở file của agent cần chạy → copy **toàn bộ nội dung** → dán vào Cursor (chat/agent) → chạy.

> File tổng hợp đầy đủ (tham khảo): `../AGENT_PROMPTS.md`

## Thứ tự chạy (dependency)

```
agent-1-scaffold
   ├─ agent-2-database
   ├─ agent-7-design-system
   │     └─ agent-4-public-bio
   │     └─ agent-6-dashboard-crud
   ├─ agent-3-auth ─> agent-6-dashboard-crud
   └─ agent-5-analytics
agent-8-performance-qa   (chạy cuối / xuyên suốt)
agent-0-orchestrator     (giám sát toàn bộ)
```

## Danh sách file

| File | Agent | Vai trò |
|---|---|---|
| `agent-0-orchestrator.md` | 0 | Điều phối, giữ contract, build/lint tổng |
| `agent-1-scaffold.md` | 1 | Dựng Next.js 16 + config + theme + font |
| `agent-2-database.md` | 2 | Schema, RLS, RPC, index, seed, types |
| `agent-3-auth.md` | 3 | Signup/login, username, middleware |
| `agent-4-public-bio.md` | 4 | Trang public `/@username` siêu nhanh |
| `agent-5-analytics.md` | 5 | Tracking edge + rollup + biểu đồ |
| `agent-6-dashboard-crud.md` | 6 | CRUD link/sản phẩm, ghim top 3, kéo-thả |
| `agent-7-design-system.md` | 7 | shadcn UI học từ CODE + theme preset |
| `agent-8-performance-qa.md` | 8 | Nghiệm thu KPI tốc độ, SEO, test |

## Quy tắc chung
- KHÔNG sửa thư mục `D:\Bio\CODE` (chỉ đọc để học convention).
- Code vào `D:\Bio\Bio`.
- Đổi schema/route/type → cập nhật contract trong các file liên quan + báo Agent 0.
