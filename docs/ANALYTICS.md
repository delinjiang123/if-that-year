# 匿名埋点（v0.13.1；统计升级批 2026-11-08 扩充）

最小匿名埋点模块 `src/analytics.js`，为 docs/PM-GROWTH.md 的增长指标提供数据源。**默认关闭**：不开启时零网络请求、零行为变化（`track()` 立即返回，不入队、不读游戏状态、不消费主 RNG、不写任何存档键）。

统计升级批（2026-11-08）新增：`visit` 等九个事件（见事件表）、随机访客编号 `vid`（见隐私口径）、汇总端点 `functions/api/stats.js`（见「汇总台」一节）。

## 如何开启

部署方在 `index.html` 加载 `src/analytics.js` **之前**注入配置（或用一段内联脚本置于其前）。`index.html` 已预留注入位置（v0.15.0，`analytics.js` 之前一段，缺省 `enabled: false`）。**收集端随 Cloudflare 接入时开启**：接入前不填任何地址、保持关闭；接入时把真实收集端地址填进注入位置并置 `enabled: true` 即可，代码无需改动。

```html
<script>window.IFY_ANALYTICS = { enabled: true, endpoint: "https://你的收集端地址" };</script>
```

- `enabled` 必须为 `true` 且 `endpoint` 为非空字符串，否则视为关闭。
- 发送实现可插拔：配置里另给 `send(endpoint, bodyString)` 函数即可替换默认发送（默认先试 `navigator.sendBeacon`，回落 `fetch` + keepalive）。
- 事件在本地队列攒满 10 条批量发送一次；页面隐藏/关闭时自动冲刷剩余队列。发送失败静默丢弃，绝不影响游戏。
- 关闭方法：去掉配置或把 `enabled` 改为非 `true`，重新部署即可；代码无需改动。

## 收集端（v0.17.0）

收集端就是仓库里的 `functions/api/collect.js`，同源 Pages Function，路径 `/api/collect`，不引入任何第三方服务。`index.html` 的注入已改为 `enabled: true`、`endpoint: "/api/collect"`。收集端只收 POST，只保留事件表内字段，未知事件直接丢弃，成功统一返回 204；不记录 IP、不种 cookie。

存储走 Analytics Engine（AE 迁移批，2026-11-08 起；此前用 KV，历史数据见「保留多久」）。绑定要用户在 Cloudflare 后台点一步，代码里配不了：控制台 → Workers & Pages → if-that-year → Settings → Functions → Analytics Engine bindings → Add binding。变量名必须填 `IFY_AE`，数据集名填 `ify_events`（首写自动创建）。保存后重新部署才生效，下一次 push 自动部署即可。事件进 AE 后按固定列位存（index1=事件名，blob1–13=分类字段，double1–3=岁数/成败/改选，映射表在 `collect.js` 的 `toDataPoint` 注释里），时间由 AE 按写入时刻自动落 timestamp 列，事件自带的 `at` 不再另存。

验证方法：绑定并部署后，打开站点玩完一局（事件攒满 10 条或关页时自动发送），再用「汇总台」的 `/api/stats` 读一次，当天 totals 应能看到对应事件计数上涨。

若没绑：站点与游戏一切正常，收集端只收不存、静默丢弃，不会报错。

## 汇总台（统计升级批，2026-11-08）

汇总端点 `functions/api/stats.js`，同源 Pages Function，路径 `/api/stats`。它经 Analytics Engine 的 SQL API 读数据集 `ify_events`，聚合全部在 SQL 里完成，免去人工翻原始事件。

- 用法：`GET /api/stats?key=<密钥>&days=<天数>`。`days` 默认 7、上限 31（按 UTC 日期，含今天；SQL 区间为 [起日 00:00, 止日次日 00:00)）。
- 密钥：Pages 环境变量 `ANALYTICS_STATS_KEY`（在控制台 Settings → Environment variables 里设为 Secret，不要写进仓库）。未设置时返回 503；`key` 不对返回 403。**没有密钥谁也读不了汇总**——这个端点不公开。
- SQL API 凭据：另需 Pages 环境变量 `CF_ACCOUNT_ID` 与 `CF_API_TOKEN`（后者为带 Analytics Engine 读取权限的 Cloudflare API token，同样设为 Secret）。任一未设置返回 503（`reason: "unconfigured"`）；SQL API 调用失败返回 502（`reason: "ae_query_failed"`，带简短 detail），不会裸崩 500。
- 返回内容：每事件总数；`game_start` 与 `game_complete` 的 era / route 分布；`game_complete` 的 ending / tier 分布与 endAge 分段（`<50` / `50s` / `60s` / `70s` / `80+`——double1 先按原值分组，分段在端点代码里做，SQL 里不写 CASE）；`share_click` 的 action 分布；典藏漏斗五步（keepsake_open / keepsake_preview / buy_click / code_verify 成功数 / gift_claim 成功数，成功数只 sum 对应事件的 ok 编码）；完局率（game_complete ÷ game_start）；分享率（share_click 总数 ÷ game_complete 总数——事件级近似，一局可多次分享，未按局去重，返回里 `notes` 有注明）；访客数（带 vid 的 distinct 编号数，按天与区间）、回访访客数（在 ≥2 个不同日期出现过的编号数）、人均局数分布（按每编号的 game_start 次数分 1 / 2 / 3+ 档）。返回带 `source: "analytics_engine"` 标明数据来源。
- vid 在汇总里只在 SQL 内计数（回访与人均局数用按 vid 分组的子查询，只回计数），**返回中绝不出现任何单个 vid**，也不返回任何单个事件。
- 数据来自 Analytics Engine，平台在高量时可能采样；当前量级为全量，返回的 `notes` 里有注明。

## 事件表

| 事件 | 触发点 | 字段（均为游戏内分类量） | 对应 PM-GROWTH 指标 |
|---|---|---|---|
| `game_start` | 新开一局（newGame） | `era`（年代 id）、`route`（路线 id） | start、era_span_selected |
| `card_pick` | 选定路线时，每类牌一条（共 3 条） | `cat`（family/temper/era）、`pick`（所选位置 0/1/2）、`changed`（是否改过预选） | 出身层参与度（v0.13 新增口径） |
| `glimpse` | 30/40/50 岁瞥视，玩家点「看」或「不看」时 | `age`（30/40/50）、`seen`（true/false） | 瞥视到达率与观看率 |
| `game_complete` | 进入结算页 | `era`、`route`、`endAge`、`death`（是否早夭/中途死亡）、`ending`（特殊结局 id 或 none）、`tier`（legendary/epic/rare 或 none） | complete、结局分布（含传说单体 ≤1% 护栏的线上监测） |
| `share_click` | 结算页分享台按钮 | `action`（share/save_image/copy_text/copy_link） | share_action、challenge_link_copy（action=copy_link） |
| `lives_view` | 开局页点开「活过的人生」 | 无 | 留存代理指标（回访查看） |
| `visit` | 页面加载（每会话一次，见隐私口径的会话标志说明）；游戏页与订购页各报各的 | `ref`（来源站点**域名**；无来源记 `direct`，本站记 `internal`） | 访问量、来源分布、漏斗分母 |
| `prologue_done` | 序章走完、选路界面出现时（本局一次） | `era` | 选路前流失（与 `game_start` 的差） |
| `retire_reached` | 本局第一次进入退休状态（`retiredAt` 落定后主推进首次观测到，本局一次） | `era`、`route`、`age`（退休落点年龄） | 退休到达率 |
| `keepsake_open` | 典藏面板打开时 | `state`（`locked` / `unlocked`） | 典藏漏斗 1：打开 |
| `keepsake_preview` | 带水印预览生成完成时 | 无 | 典藏漏斗 2：预览 |
| `buy_click` | 购买按钮点击（结算页典藏面板内、support.html 两处） | 无 | 典藏漏斗 3：点购买 |
| `code_verify` | 输码核验返回后（手动输码与领码页带回自动核验都算） | `ok`（布尔，**只报成败，绝不带码值**） | 典藏漏斗 4：输码成功 |
| `keepsake_export` | 导出完成时（长图下载 / 纪录册打开） | `kind`（`image` / `booklet`） | 导出量与形态分布 |
| `gift_claim` | 赠予领取返回后 | `ok`（布尔，**绝不带码值**） | 典藏漏斗 5：赠予成功 |

全事件通用字段：`name`、`at`（时间戳）、`vid`（随机访客编号，见隐私口径）。收集端白名单按上表逐事件过滤字段，`vid` 只做格式校验（字符串、长度 ≤64），不合规只丢字段不丢事件；表外字段一律剔除，未知事件整条丢弃。

未埋点（PM-GROWTH 表内、本轮不做）：`challenge_land` / `challenge_start`（同局链接落地与开局细分，待挑战玩法口径定版）、`daily_seed_start`（今日种子入口细分，可由 game_start 后续扩展）、`keepsake_purchase`（交易在 Stripe 侧完成，本站不经手，不设事件；漏斗以 `buy_click` → `code_verify.ok` 近似）。

## 隐私口径

**收什么**

- 上表字段：事件名、时间戳与游戏内分类量（年代、路线、年龄点、结局类别、典藏漏斗的成败布尔）。
- 每次会话第一次打开页面时的来源**域名**（`visit.ref`）：只记域名（如 `example.com`），不记完整网址——网址的路径和参数里可能带着同局种子链接，绝不上行；没有来源记 `direct`，从本站页面跳来记 `internal`。
- 一个随机编号 `vid`（下条细说）。

**随机编号（vid）是什么**

- 它是浏览器在本机用 `crypto.randomUUID()` 掷出来的一个纯随机数，存在 localStorage 的 `ify_vid` 键里，随每个事件附带，只用来在汇总时数「来了多少个人、回没回来、平均玩几局」。
- 生成时**不读任何设备信息**：不看机型、屏幕、时区、语言、浏览器版本——这些一概不采集，所以拼不出设备指纹，它就是一串随机数。
- 它**永远不和能认人的信息结合**：不与兑换码、Stripe 订单、邮箱或任何账户信息关联（本站也没有账户系统）；汇总端点只在 SQL 里数它（按编号分组也只回计数），返回结果里不出现任何单个编号；它也不会出现在任何玩家看得见的页面、链接或导出成品里。
- localStorage 里与统计有关的只有这一个键，与游戏存档（`ify-save-v2`）完全分开。另有一个 sessionStorage 的会话标志（`ify-ana-visit`），只表示「这次会话已经报到过一次」，本身不发送、不含任何编号，关掉标签页就没了——它不是编号。

**不收什么**

- 种子原文（同局链接含种子，绝不回传）、玩家在瞥视里写的留言与其他任何输入内容、兑换码与赠予码的码值（核验与领取只报成败布尔）、姓名/联系方式等个人信息、IP 地址（收集端不记录 IP）、设备指纹、精确位置。
- 不种 cookie。事件队列只在页面内存里，关页即弃（未冲刷部分直接丢失，不落盘重试）。

**保留多久**

- 原始事件在 Analytics Engine 里保留 3 个月（平台口径），到期自动删除。汇总出来的数字（总数、分布这类已经数完的统计）可以长期保留——汇总里不含任何单个访客的信息。
- AE 迁移（2026-11-08）之前写进 KV（namespace `ify-analytics`）的历史事件仍保留在原 namespace 里，不再写入新数据；汇总台也不再读它，需要清理时单独删 namespace 即可。

**怎么删**

- 在浏览器里清除本站的站点数据（Cookie 与站点数据），`ify_vid` 即被删掉；下次再来会生成一个全新的编号，旧编号从此再也对不上这台设备。已经收进来的事件只剩匿名计数，本来就认不出是谁，无法也无需按人删除。

**给不给别人**

- 数据只存在本站自己的 Cloudflare Analytics Engine 里（迁移前的历史事件在本站自己的 KV 里）。不给第三方、不出售、不用于广告投放或用户画像。

**与游戏的隔离**

- 埋点状态不进入 `ify-save-v2`；埋点不读玩家输入、不碰主 RNG。同一种子双跑的数值结果不受埋点开关影响（验收以确定性双跑为准）。
