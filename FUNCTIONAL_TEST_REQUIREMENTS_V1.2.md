# 技术支持设备与耗材管理网站｜功能测试需求说明书（v1.2）

> 目的：为项目提供一份可直接执行/交接的功能测试需求文档，覆盖设备—附件—位置—耗材—出入库/借还—测试报告—审计全链路，形成清晰的覆盖矩阵、用例与验收口径。

---

## 1. 背景与目标

- **背景**：公司存在多类型设备（如“魔镜6号机”的不同颜色/形状/功能变体），附带打印机/路由器等附件；需要追踪设备位置、出入库/借还、耗材库存与测试（如 MBTI 打印报告）。
- **目标**：
  1. 用统一的验收口径验证所需功能是否可用；
  2. 形成可复用的自动化测试基线（API、E2E）；
  3. 产出问题清单与优先级建议，支持迭代。

---

## 2. 测试范围（In Scope）

1. 设备管理：设备类型/变体/实例、设备状态机、二维码。
2. 打印机与附件：设备-打印机绑定历史、附件标配清单与实际携带差异。
3. 位置与流转：层级位置、Movement 流水、一致性。
4. 借出/归还/出库：借出单、归还差异核对、逾期策略、展会/客户出库。
5. 耗材库存：SKU/批次/结存、出入库、低库存预警。
6. 测试/报告：模板（含 MBTI）、报告提交/导出、与设备/工单关联。
7. 报表与导出：设备去向、库存消耗、利用率等。
8. 安全与审计：审计日志、通知。
9. 可用性与移动端：扫码、离线（PWA）基础验证。

**Out of Scope（本版不测或选测）**：采购/预算、预测补货、第三方 IM 深度集成、复杂性能压测（>并发 1000）。

---

## 3. 质量门槛（通过标准）

- 冒烟（Smoke）：关键路径 0 失败（见 §12）。
- 核心功能：下述用例通过率 ≥ 95%，且无 P0/P1 缺陷未修复。
- 一致性：负库存=0、位置不一致=0、重复序列号=0（见 §10 SQL）。
- 审计：危险操作均留下日志，无静默成功。

---

## 4. 测试环境与准备

- **环境**：测试数据库（PostgreSQL 优先，若无可使用 SQLite）。
- **账户（如适用）**：单人管理员模式默认全权限；如启用登录，提供一个管理员账号。
- **基础数据（Seed）**：
  - DeviceType：`魔镜`
  - DeviceVariant：`6号·圆形·红色(supports_mbti_report=true)`、`6号·经典·黄色(false)`
  - Device：`MM6-R-0001`、`MM6-Y-0001`（含 asset_tag、serial_no）
  - Printer：`HP CP1025 SN:P-0001` 绑定 `MM6-R-0001`
  - 附件：`路由器`×2（SN: R-0001、R-0002）、`电源`×1
  - 位置：仓库 A / 货架 B / 盒位 C、员工 `张三`、展会 `成都站`
  - 耗材 SKU：`相纸 6寸`(min_reorder_level=20)、`墨水 1025`；批次各 50
  - 报告模板：`MBTI`（字段：姓名/维度…）

---

## 5. 角色权限（暂不适用）

> 当前项目未实现角色权限（RBAC），本节暂不适用。跳过 RBAC 相关测试项（如 `ACL-001`、`NEG-005`）。待启用 RBAC 时再补充角色矩阵与越权用例。

---

## 6. 用例设计口径

- 设计方法：等价类、边界值、状态转移、因果图。
- 命名规范：模块前缀 + 序号，如 `DEV-001`、`LOAN-010`、`STK-020`、`REP-030`。
- 每条用例需包含：Given（前置）、When（步骤）、Then（期望）。

---

## 7. 功能用例清单（核心）

### A. 设备/变体/实例

- `DEV-001` 新增设备变体：`supports_mbti_report=true` 时允许创建 MBTI 报告，为 false 时禁止并提示。
- `DEV-005` 创建设备实例：`asset_tag`、`serial_no` 唯一；二维码指向 `/device/{id}`。
- `DEV-010` 绑定打印机：产生绑定历史；解绑后历史可追溯。
- `DEV-015` 附件标配清单：设备详情展示标配与当前携带清单差异。
- `DEV-020` 状态机：`IN_STOCK→LOANED→(IN_TRANSIT/REPAIR)→IN_STOCK/RETIRED` 合法；非法转换被拒绝并提示。

### B. 位置与流转（Movement）

- `LOC-001` 位置层级：仓库 A → 货架 B → 盒位 C 可维护与筛选。
- `LOC-010` Movement 一致性：迁移后 `current_location_id` 等于最新 Movement 的 `to_location_id`。

### C. 借出/归还/逾期

- `LOAN-001` 创建借出单：同一设备不可重复借出；提交后设备状态=LOANED，位置=借用人。
- `LOAN-010` 携带附件：勾选路由器×2，出库占用附件库存（或台账）。
- `RET-001` 扫码归还：部分归还触发 `ReturnInspection(MISSING)`，自动生成工单。
- `RET-010` 逾期策略：`now>expected_return_at`→状态=OVERDUE 并产生通知（可 mock 通道）。

### D. 出库/调拨（展会/客户）

- `DSP-001` 创建出库单：目的地 `成都站`；设备进入 `IN_TRANSIT`；签收入库后回到目的地位置。

### E. 耗材库存

- `STK-001` 入库批次：新增批次、结存更新、可追溯。
- `STK-010` 出库验证：尝试超额出库→失败，结存不变。
- `STK-020` 低库存预警：结存低于阈值→生成预警卡片/接口返回预警。

### F. 测试/报告（MBTI 示例）

- `REP-001` 模板校验：模板字段、必填项校验正确。
- `REP-010` 报告提交：与设备关联、可导出 PDF；变体不支持则拒绝。

### G. 报表与导出

- `RPT-001` 设备去向报表：按人/部门/项目过滤、导出 CSV/Excel。
- `RPT-010` 耗材消耗报表：按 SKU/项目统计，支持时间范围筛选。

### H. 审计/通知（单人）

- `AUD-001` 审计日志：记录谁/何时/何操作/目标与旧新值。
- `SAF-001` 危险操作二次确认：删除/撤销前须确认或输入关键字。
- `SAF-002` 撤销与回滚：撤销后设备/库存/Movement/审计一致回滚，重复撤销无副作用。
- `AUD-002` 全覆盖审计：DEV/INV/DOC/REP 新增、修改、删除、撤销均落审计，可筛选导出。

### I. 扫码/移动端（PWA）

- `MOB-001` 扫码借还：移动端扫码打开对应设备/借出单。
- `MOB-010` 离线能力：弱网下页面可打开缓存，操作队列在联机后重放（如有 PWA）。

---

## 8. 负面/边界用例

- `NEG-001` 同一设备重复借出，应被拒。
- `NEG-002` 借出不存在或已报废的设备。
- `NEG-003` 归还多还/少还与序列号不匹配。
- `NEG-004` 出库造成结存为负，需阻止并提示。
- `NEG-NEW-01` 无确认直接删除，按钮应禁用或提示确认。
- `NEG-NEW-02` 撤销后重复点击，状态保持一致（幂等）。
- `NEG-NEW-03` 导出 ≥1 万行数据，前端不崩溃，有进度提示，导出结果可用。
- `NEG-006` 变体不支持 MBTI 却提交报告。
- `NEG-007` 非法状态转换（如 RETIRED→LOANED）。

---

## 9. 可观测性与断言

- UI：Toast/Badge/状态标签、列表计数、下载文件存在性。
- API：HTTP 状态码、响应体字段、幂等性、错误码与文案。
- 后台：数据库状态、审计日志条目、消息/通知调用次数。

---

## 10. 数据一致性 SQL（可在 CI 或运维自检中执行）

```sql
-- 负库存
SELECT sku_id, lot_id, qty_on_hand FROM StockBalance WHERE qty_on_hand < 0;

-- 重复序列号（设备）
SELECT serial_no, COUNT(*) c
FROM Device
GROUP BY serial_no
HAVING c > 1;

-- 位置与 Movement 一致性
WITH x AS (
  SELECT subject_id, MAX(moved_at) last_moved
  FROM Movement
  WHERE subject_type = 'DEVICE'
  GROUP BY subject_id
)
SELECT d.id
FROM Device d
JOIN x ON x.subject_id = d.id
JOIN Movement m ON m.subject_id = d.id AND m.moved_at = x.last_moved
WHERE d.current_location_id <> m.to_location_id;

-- 审计覆盖
SELECT COUNT(*)
FROM AuditLog
WHERE occurred_at > NOW() - INTERVAL '24 HOURS';
```

---

## 11. 端到端（E2E）场景（用于 Playwright/Cypress）

- `E2E-001` 设备全链路：新增变体→创建设备→绑定打印机/附件→借出→扫码归还→差异核对→回仓→报表检查。
- `E2E-010` 耗材与预警：入库→多次出库至低于阈值→预警出现→导出报表。
- `E2E-020` 展会出库/签收：创建出库单→在途→目的地签收→位置/状态正确。

---

## 12. 冒烟用例（上线前 10 分钟快速回归）

- 登录（如有）/首页可达；
- 设备搜索/详情可开；
- 新建借出单并提交成功；
- 归还并生成差异；
- 耗材出库被正确扣减；
- 报表能导出；
- 审计日志新增记录。

---

## 13. 自动化执行建议

- **API（Postman/Newman）**：覆盖 §7 的接口场景，导出 `reports/newman.xml`。
- **E2E（Playwright）**：覆盖 §11 场景，保留视频与截图在 `e2e/artifacts/`。
- **健康/一致性探针**：暴露 `/probes/integrity` 返回 §10 的检查结果。
- **CI（GitHub Actions）**：`push/pr` 时执行 `npm ci && npm test && npx playwright test`，并上传产物。建议将用例 ID（如 `DEV-001`）加入测试描述，确保用例与功能可追溯。

---

## 14. 缺陷优先级定义

- `P0`：关键路径阻断/数据破坏/安全风险。
- `P1`：主要功能不可用/一致性异常。
- `P2`：次要功能问题/边界表现异常。
- `P3`：UI 细节/文案问题。

---

## 15. 缺陷报告模板（示例）

- 标题：`[P1][LOAN-001] 同一设备可重复借出`
- 环境：`web v1.0.0 / chrome 128 / pg 14`
- 前置：`Device=MM6-R-0001 状态 IN_STOCK`
- 步骤：`1..n`
- 期望/实际：`Then/Actual`
- 证据：`截图/接口日志/SQL`
- 影响范围：`借出/库存/报表`
- 修复建议：提交借出单时增加唯一占用校验

---

## 16. API 请求示例

```http
POST /api/loans
{ "device_id": 101, "accessories": [{"type":"router","qty":2}], "expected_return_at": "2025-10-20T10:00:00Z" }
```

```http
POST /api/returns
{ "loan_id": 5001, "items": [{"device_id":101},{"accessory":"router","qty":1}] }
```

---

## 17. 可追溯矩阵（示例）

| 需求/功能             | 用例 ID                 |
| ------------------ | -------------------- |
| 设备变体能力（MBTI 限制） | `DEV-001`, `REP-010`  |
| 借出占用与位置同步        | `LOAN-001`, `LOC-010` |
| 归还差异与工单          | `RET-001`             |
| 低库存预警            | `STK-020`             |
| 审计覆盖             | `AUD-001`, `AUD-002`  |

---

## 18. 自动化落地建议（仓库适配：`joyboy123456/Technical-Support-Management-Website`）

- 在 `tests/` 目录中新增：
  - `api/compat.spec.ts`（覆盖 `PRN-110` 兼容性规则）。
  - `api/inventory.spec.ts`（覆盖 `INV-120` 库存联动与低库存告警）。
  - `e2e/documents.spec.ts`（覆盖 `DOC-130` 单据一致性与撤销）。
  - `e2e/dashboard.spec.ts`（覆盖 `DASH-150` 看板指标）。
- 更新 `package.json`：
  - 增加 `test:api` 与 `test:e2e` 脚本；
  - GitHub Actions 流水线执行并上传截图/视频。
- 提供 `.env.example` 中的 Supabase 匿名键与只读库连接参数，便于运行 SQL 自检。

---

## 19. 风险与重点关注

- 兼容性规则与库存联动耦合高，需验证撤销/失败场景的回滚。
- 单据幂等与重复点击提交的防抖保护。
- 审计日志需覆盖失败请求，保证溯源。
- 导出与备份的大数据量处理（分页/分片/进度提示）。

---

## 20. 推广前演示脚本（5–8 分钟）

1. 新建设备（含打印机/附件绑定），看板出现统计。
2. 创建借出单并提交，Movement 记录、库存扣减同步。
3. 撤销该单据，所有联动回滚且审计留痕。
4. 多次出库至低于阈值，预警卡片出现。
5. 导出报表/备份数据，确认文件可用。
6. 展示审计日志的过滤与导出能力。

---

## 21. 一致性/防回归 SQL（Supabase/Postgres）

```sql
-- 负库存
SELECT sku_id, lot_id, qty_on_hand FROM stock_balance WHERE qty_on_hand < 0;

-- 位置一致性
WITH x AS (
  SELECT subject_id, MAX(moved_at) last_moved
  FROM movement
  WHERE subject_type = 'DEVICE'
  GROUP BY subject_id
)
SELECT d.id
FROM device d
JOIN x ON x.subject_id = d.id
JOIN movement m ON m.subject_id = d.id AND m.moved_at = x.last_moved
WHERE d.current_location_id <> m.to_location_id;

-- 审计覆盖
SELECT module, action, COUNT(*)
FROM audit_log
WHERE occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY module, action;
```

---

## 22. 缺陷统计与测试结论

- 收集执行范围、环境、通过率、缺陷摘要、下一步建议。
- 关键失败项需提供复现脚本与最小修复建议。

---

## 23. 未来启用 RBAC 的迁移提示

- 数据库中预留 `user_id` 与 `tenant_id` 字段。
- 危险操作优先接入“仅本人可操作”软限制（如本地口令确认）。
- 正式推广时再启用角色/权限表、路由守卫、中间件与 UI 隐藏。

---

## 24. 版本记录

- v1.0：通用多角色版本。
- v1.1：针对 GitHub 仓库现有功能的适配，补充兼容性、库存联动、看板、SOP。
- v1.2：单人管理员模式；强化审计与回滚、安全确认；移除 RBAC 相关测试。
