/* 《如果那年》状态矩阵注册表（v0.13.0）——单一事实源。
   域（domains）：域内互斥 / 流转不可逆的人生状态。引擎只执行此处声明的边（edges）；
   by = 载体条目 id（分岔记 fork<年龄>）；reserved 边已设计但暂无载体，不可达警告属预期。
   里程碑（milestones）：普通叙事旗标，setters 为全部立旗条目 id；
   新增/改动旗标必须同步登记，tools/validate-state.js 会逐项核对，未登记即报错。
   详细口径见 docs/STATE-MATRIX.md。
   通用门/变体字段（v0.19.0 三相登记，形状在此备案，校验器逐项核对）：
   - kidMin / kidMax（条目级，数字）：孩子年龄下限/上限门，kidAge = 当前年龄 − kidsAt，抽取层 met() 求值。
   - kidAgeMin / kidAgeMax（条目级，数字，v0.20.1）：孩子真实年龄下限/上限门，kidAgeTrue = 当前年龄 − (kidsBornAt ?? kidsAt)
     ——出生拍（apply.js BORN_BEATS：p3_046 / lk_born / e55_057）落过出生年按出生年算，没落过回落落定年龄；
     与 kidMin/kidMax 分工：存量 kidMin/kidMax 锚落定年、标定不动，新挂的阶段文本（高考/家长会/入园/孙辈等）锚出生年。
     形状核对与 kidMin 同口径：须为数字且 kidAgeMin ≤ kidAgeMax（tools/validate-state.js）。
   - petMin / petMax（条目级，数字，v0.20.1）：宠物真实年龄下限/上限门，petAge = 当前年龄 − (catAt ?? dogAt)，
     catAt/dogAt 由 apply.js 在 cat/dog 流转到 home（抱回）时落点；物种按条目自身的 state/stateAll/stateNot/
     setState/chain 推断（chain p5_043=猫、p11_049=狗），分不清物种的条目两边都查、任一满足即过。
     形状核对同 kidMin 口径（tools/validate-state.js）。
   - flagAgeWithin（条目级）：{ flag: <已登记里程碑 id>, years: <非负数> }——旗落点后 years 年内才可抽，读引擎 flagAges。
   - textState（条目级）/ echoState（选项级）：{ 域: { 状态值: 文本 } }——呈现时按本局状态选文本，未命中回落 text / echo。
   - ctx.form / ctx.notForm（条目级，v0.20.0 M2 登记）：形态值数组（值域 farm/public/self/flex/employee）——
     抽取层 ctxOk 求值：form 命中任一即过、notForm 命中任一即拦。形态由 work.js formOf() 按规则表派生，不进存档。
   - ctx.mainLine（条目级，v0.20.0 M2 形态补修第二批登记）：入行旗 id 或其数组（值域 = work.js
     FORM_OF_FLAG 的键）——抽取层 ctxOk 求值：本局主入行旗（work.js mainEntryOf()，R1 最近入行）
     命中才可抽，无主入行旗时不过。治「入行旗只进不出」——旧线终身口吻条目只认本线是当下主线
     时才出。同样是派生量，不进存档；validators 对其形状与值域逐项核对。
   - ctx.entry（条目级，v0.20.1 W6 登记）：true——纯入行拍防叠门：本局已有主入行旗
     （work.js mainEntryOf 非空）时不可抽；带明确转行/接管叙事的条目与线内分科条目不声明。
     v0.20.1 W9 扩展（同键同门，不另立键）：home 路线（route=home 或序章轨道 track=home）
     在考试链未决窗（22–28 岁，未落 exam_passed/exam_landed/exam_failed）内，纯入行拍
     同样不可抽——路线主线未定之前不许被其他行当抢先落成；链落定或落空（exam_failed
     或窗已过）后自动放行。求值在 record.js 的 ctxOk，求值口径以彼处注释为准。
   - ctx.notMainLine（条目级，v0.20.1 W6 登记）：入行旗 id 数组——当前主线命中任一即拦
     （医护在行期间的公司口径文本用；值域与 ctx.mainLine 同为 FORM_OF_FLAG 的键）。
   - ctx.eduGate（条目级，v0.20.1 W6 登记）：true——学历门：须 schooling=school 或已立
     edu_bridge 旗（夜校/自考桥）；schooling=pre（无序章处境判定的年代）恒过。
   - ctx.eduGateHalf（条目级，v0.23 WP8 fix4 登记）：true——宽学历门：eduGate 口径另放行
     schooling=half。用于考试链链身与同类质地条目（补门前本可被 half 单独抽到，续读行为
     不变，只挡 never/left 未立桥者）；考试门片（审议单 #5）起，链头 p16_001 与第二链头
     p16_012 改用本宽门——half 纳入游戏现行「有读书记录」标准；eduGate 严口径保留给在职
     读研（p16_014）等学位级条目。求值在 record.js ctxOk。
   - ctx.anyCareTarget（条目级，v0.20.1 W8 登记）：true——在护对象门：陪床/等喊号/护工排班类
     文本须有当下还在的在护对象——父母任一在世且处于父母照护情境（care_self/care_hired/
     care_rotate 任一事实在账），或伴侣在场（partnered/dating）且有伴侣照护事实
     （care_hired_spouse 在账）；求值在 record.js ctxOk，与 ctx.entry 同为派生量、不进存档；
     tools/validate-state.js 核对形状（出现时须为 true）。
   - ctx.house / ctx.car / ctx.settle（条目级，v0.24.4 AN-2 登记）：生活事实门——住房/车辆/
     定居三类当前事实只许问派生层（src/world/processes/place.js 的 housingOf/carOf/settledOf，
     纯函数现算、不进存档；旧旗只作存储层），不许条目再直接认单面旗。值域：house ∈
     owned（已购房，own/reform/commodity 任一形态，单位分房不算）/ renting（当前在私租）/
     unit（单位房口径，含 c1955 公房纠偏）/ any（三者居一）；car ∈ now（现在有车）/ ever
     （曾经有过）/ none（从没买过）；settle ∈ home/city/abroad（当前定居地＝轨迹终点）。
     求值在 record.js ctxOk；tools/validate-state.js 核对值域。
   - ctx.careerTrade / ctx.careerVia / ctx.careerTenureIn（条目级，第 2 期 P2-3 登记，设计
     §4.5 键族子集）：职业履历门——当前段行当（career.js careerOf 派生）/ 当前段来处
     （未收尾段的 via，值域 seed/inherit/cold/chain/legacy）/ 当前段年数（当岁 − from）
     落闭区间，三者皆派生量、现算不进存档；fail-closed：无当前段（未入行/待业/已退休/
     career 账不在场）全不过。求值在 record.js ctxOk。红线（§4.5）：此组键只许职业族
     新拍（id 前缀 cr_）用，存量条目一律不许回填——tools/validate-storylet.js 静态检查
     把门（career 六键 careerTrade/careerVia/careerTenureIn/careerWas/careerIdle/
     careerNone 出现在非 cr_ 条目上即红；后三键本批未落地，出现同样即红）。
   - textDist（条目级）/ echoDist（选项级，v0.24.4 AN-2 登记）：{ far: 文本 }——与父母距离变体：
     本局与父母距离派生（place.js distToParentsOf）为 far（出国定居）时用此文本，未命中回落
     原文。父母住院/信号拍的在场叙事专用（远版＝赶回去/电话问诊口径）；解析点 views/year.js
     distVariant（formText/echoText 各叠一层，优先级与 textNoUnit 同级：硬事实先行）；
     tools/validate-state.js 核对形状（far 须为非空文本）。
   - textForm（条目级）/ echoForm（选项级，v0.20.0 M2 登记）：{ 形态: 文本 }——呈现时按本局形态选文本
     （解析点与 textState 同一机制：views/year.js formText/echoText），未命中回落 textState 变体或原文。
   - labelForm（选项级，v0.20.0 M2 收尾登记）：{ 形态: 文本 }——分岔选项标签的形态变体，解析点 views/year.js
     labelText（先 spouse 变体、再形态覆盖）；流水账与未选支记录同走此读法，结算 chosenOfFork 按变体集合反查。
   - rehireAfterRetire（条目级，布尔，v0.20.1 W7 登记）：true——返聘后复退门：账本里首次
     workPhase>retired 流转之后真有过 retired→part 返聘边才可抽（求值在 scheduler.js met，
     事实读法在 work.js hasRehireAfterRetire，只读账本不读 rehire 旧旗）。形状核对在
     tools/validate-state.js（须为布尔）。
   - textRetireYears（条目级，v0.20.1 W7 登记）：{ mid: 文本, long: 文本 }——退休年数变体：
     按 S.retiredAt 算出的退休年数分版（≤2 年原文、3–6 年 mid、>6 年 long），解析点
     views/year.js retireYearsText，把已解析正文首处「没多久」替换为 mid/long 的时间词；
     形状核对在 tools/validate-state.js（mid/long 须为非空文本，且条目 text 须真含「没多久」）。
   - textDefer（条目级）/ labelDefer / echoDefer（选项级，CL-45 登记）：{ "1": 文本, "2": 文本 }——
     dating 摊牌分级变体（proc_dating 专用）：键为呈现时 S.datingDefers（本局已推迟次数），
     第一遍（0）用原文，第二遍（1）换带回响的正文与推迟项标签/回响，第三遍（2）换决断正文
     （推迟项已由呈现/无头两侧既有过滤在 datingDefers≥2 时撤下，故选项变体无 "2" 的实际
     呈现）；解析点 world/processes/spouse.js datingView（engine.js step 与 shadow-life.js
     stepYearHeadless 的 dating 取拍点同调，返回浅拷贝视图、不改条目本体），未命中回落原文；
     形状核对在 tools/validate-state.js 与 tools/validate-storylet.js（键值域 {"1","2"}、
     值为非空文本）。
   - textNoUnit（条目级）/ echoNoUnit（选项级，v0.20.1 W2 登记、W7 扩至分岔）：不点名单位
     变体——本局无当前单位事实（work.js noCurrentUnit）时优先于 textForm/textState，
     解析点 views/year.js formText/echoText（进程拍另有 work.js applyRetireVariant 通道）。
   - textEra（条目级）/ echoEra / labelEra（选项级，v0.20.1 面板急修登记）：{ 年代id: 文本 }——
     年代变体。年代不是状态域（S.era 独立于 S.state，textState 的键装不下年代），故同形另立：
     解析点 views/year.js eraVariant（formText/echoText/labelText 各叠一层，优先级
     无单位 > 年代 > 形态 > 状态），未声明本年代时回落原文。键值域 = 六个年代 id
     （c1955/c1965/c1978/c1985/c1995/c2000），tools/validate-state.js 与 validate-storylet.js 逐项核形状。
     v0.23 WP1（E1）：分岔（fork）与分岔选项同享此机制——fork 级 textEra 由 views/year.js 的 formText
     解析、choice 级 labelEra/echoEra 由 labelText/echoText 解析，口径与条目级完全一致，不另立通道。
   - stagesEra（影子级，D.shadows 各路线对象上）：{ 原文行: { 年代id: 文本 } }——影子阶段文本的
     年代变体：键为该路线 stages 里的原文行，值为该行在本年代的替换行；解析点 views/shadow.js
     shadowStageText（取池后、既有年代/阶段过滤之前逐行映射，未声明本年代时回落原文行，未声明
     stagesEra 的路线恒等映射、行为一字不变）；池大小与随机消耗不变，键值域同 textEra（六个年代 id）。
   - eraFrame（分岔级，v0.23 WP1 E2 登记）：{ 年代id: { text, choices } }——fork33 的年代框变体：
     命中本年代时整框替换题面与全选项（set 旗与影子政策按旗匹配的读法不变），未命中回落本体；
     解析点 views/year.js renderFork 与 shadow-life.js 的无头解决器（两处同口径）；框与本体的对应
     关系登记在 src/anchors.js 的 GAME_ANCHORS.eraFrames，内容（c1955/c1965 两框）随 WP6 落。
   - 枚举事实（v0.23 WP1 E11 定版）：多值干上事实（examBand/schoolingDepth/sentdownForm/quotaHolder/
     studyForm）不用里程碑的布尔模型，统一登记在本文件尾部的 GAME_REGISTRY.enumFacts（名、值集、
     宿主域 host、缺省 absent＝未发生）；持久化挂存档根上的伴随容器 S.facts（{ 事实名: 值 }，
     与 S.state/S.flags 并列，见 src/engine.js freshState），旧档缺失容器或缺失键一律按 absent 读、
     不掷不补写；validate-state 按值集校验数据里的 setFact/requiresFact 声明；分根复制按 E8 清单
     逐项点名（src/world/shadow-life.js birthShadow）。注意与 trackAlt 分家：PACK-SPEC 的 trackAlt
     是序章文本变体义（流抽签定版），玩家亲选的中专身份是枚举事实 studyForm，两义不许混登记。
   - 序章选项门（v0.23 WP1 E3 登记）：序章 choices 可带 requiresSit（处境值或其数组）/
     requiresState（{ 域: 值或值数组 }）/ requiresFlag（旗名或其数组，须全立）/ requiresFact
     （{ 枚举事实名: 值或值数组 }，按 absent 口径读）——不满足即不出（默认不提这扇门，不用灰置）；
     求值点 src/content/prologue/prologue.js present（gateChoices）。题面尾句 gateNote 只在
     gateNoteNeeds 声明的资格来源事实全部已立（旗已立或枚举事实非 absent）时才渲染，缺省
     （无 gateNoteNeeds 或事实未立）恒不渲染；gateNote 文案规格：叙述者口吻、一句、≤40 字、
     只陈述规则与事实，不许出现「你不符合／由于／资格／条件不足」式通知腔（validate-storylet 逐字拦）。
   - familyBeat 拍型（v0.23 WP1 E4 登记）：序章 act 带 familyBeat:true——处境陈述（act.text，
     无选项段）＋小应对（act.choices）＋回声（act.echo）。小应对 effects 白名单：只许 relation/
     wisdom 且单项 |值|≤1，另许 set（记号，须已登记里程碑）与 familyFact（家庭事实旗，须已登记在
     本文件尾部 GAME_REGISTRY.familyFacts）；不许 setState、不许 setFact——尤其不许写 quotaHolder：
     顶替名额归属只能由 L65-家 的发放规则函数写（蓝图 §3.3），validate-state 对 familyBeat 专门断言。
     Runtime 落点：prologue.js choose 写 familyFact 旗并拦截 familyBeat 选项的 setFact（防御纵深）。
   - exam 链头年代门（v0.23 WP1 E10 机制面）：pack16 链头条目 p16_001 可带 eraIn（年代 id 数组，
     scheduler.js met() 现行求值）关停老年代的考试链；字段支持在此登记，取值随 WP6 落码——
     本包不改链头数据（关停与密度回补是 WP6/WP2/WP3 的内容面）。
   - 登记数据文件（v0.23 WP1 E9 骨架）：各内容包的新登记（里程碑/枚举事实/家庭事实旗/examBand
     分表/序章分岔锚点）一律写独立登记数据文件、加载期合入，不许直改本文件本体。文件形状：
     window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{ milestones:{},
     enumFacts:{}, familyFacts:{}, examBandTables:{}, prologueForks:[] }])；加载点 = index.html
     里 state.js 之前（样例文件 src/content/registry-v023.js）；合入点 = 本文件尾部（registry 类）
     与 src/anchors.js（prologueForks 类），同名先登记者胜、后到者不覆盖。 */
/* 拆分说明（v0.20.0）：version 与 domains 已移至 src/world/state.js（须在本文件之前加载）；
   本文件只登记里程碑（milestones），正文与拆分前一字未动。 */
window.GAME_REGISTRY.milestones = {
  "abroad_study": {
   "setters": [
    "proc_abroad_kind"
   ],
   "note": "留学链在读旗（CL-105 立，照 CL-104 编年稿脊柱设计）：proc_abroad_kind 的 3 个留学选项（选项级 eraIn [c1985,c1995,c2000]）与 setState abroadKind 同落 choice 级 set；普通旗，不进状态域。消费者：pack116 留学链①②全部条目（require 本旗）——没走留学门的人（窗口外推断补值只补 kind、补不了本旗）不进本链，与 r_abroad_pr 稀有事件的通用落点并行不冲突。第二片③毕业就业拍起转 abroad_worked"
  },
  "abroad_worked": {
   "setters": [
    "p117_004",
    "p117_005"
   ],
   "note": "留学链已在地就业旗（CL-105 占位登记，照 CL-78/CL-93 空集占位先例）：CL-111 第二片已转实登——p117_004 对口形/p117_005 不对口形两选项同落（INDEX S03-04/S03-05）；消费者：pack117 的④站稳 7 条以本旗 require 为链门，此后⑤永住/⑥买房条目同读本旗。abroad_study→abroad_worked 两旗接力即本链脊柱，零新状态域"
  },
  "ad_first": {
   "setters": [
    "p2_037"
   ]
  },
  "ai_daily": {
   "setters": [
    "p10_055",
    "p22_056"
   ]
  },
  "ai_read_assist": {
   "setters": [
    "p21_001"
   ]
  },
  "asked_borrow": {
   "setters": [
    "p5_003",
    "p5_007",
    "p11_002"
   ],
   "note": "有人开口借过钱（时序回响修复段立）：事实是「开口问过」、与借没借无关，故立在呈现上——p5_007（朋友借三千）、p5_003（老同学借钱）、p11_002（表弟借钱周转）任一呈现即立。消费者：p5_010「朋友第二次开口借钱」的 require——无此旗不出，挡「没人开过口直接第二次」。人物口径从宽：三条任一出过即算「又一次有人开口」，严格同人分旗成本不值（分析报告登记）。旧存档失败关闭：中途局无此旗时 p5_010 本局可能不再出，不产生矛盾"
  },
  "asked_regret": {
   "setters": [
    "p1_003"
   ],
   "note": "聚餐时问过二战同学后不后悔（P1 补因果立）：同学上岸回响认领"
  },
  "back_home_stay": {
   "setters": [
    "p11_040",
    "ab37_023",
    "ab37_024",
    "p117_006",
    "p117_008"
   ],
   "note": "回老家落脚（v0.20.1 面板急修补）：ab37_023 派遣项目结束选「回了」与 ab37_024 晚年选「回去在老家过」同立此旗，居所轨迹 residenceTrail 据此把终点写成 home，与 p11_040 同一写法。CL-111 补登：留学链回程两正脸 p117_006（读完回）/p117_008（读不下去回）的「回」选项同立此旗；消费者另有 p117_007（回来找活，require 本旗＋abroad_study）"
  },
  "back_to_city": {
   "setters": [
    "p11_041"
   ],
   "note": "回老家住一阵之后回城落定（v0.24.4 AN-2）：p11_041 条目级 set 落旗，居所轨迹 residenceTrailOf 只读此旗认回城（出国线记回 abroad）；旧存档无此旗，轨迹兼容读账本 p11_041 条目一个版本周期"
  },
  "back_to_work_soon": {
   "setters": [
    "p16_063"
   ],
   "note": "另一半出院后请几天假就回去上班（P1 立）：工作线回响认领"
  },
  "badminton_captain": {
   "setters": [
    "p10_025"
   ]
  },
  "band_member": {
   "setters": [
    "p19_015"
   ],
   "note": "年轻时组过乐队（时序回响修复段立）：起源只有 p19_015（组小乐队、年会上台）。消费者：p22_070 的 require——没组过乐队不出「年轻时组过的那个乐队又凑齐了人」。旧存档失败关闭"
  },
  "bookkeeping": {
   "setters": [
    "p12_058"
   ]
  },
  "bought_car": {
   "setters": [
    "e65_035"
   ]
  },
  "bought_commodity": {
   "setters": [
    "e65_027"
   ]
  },
  "bought_cotton_coat": {
   "setters": [
    "p29_005"
   ],
   "note": "打短工临走给自己买了件厚棉袄（P1 立）：过冬回响认领"
  },
  "bought_fangai": {
   "setters": [
    "e65_026"
   ]
  },
  "bought_house": {
   "setters": [
    "e78_006",
    "fork33",
    "fork33f",
    "p17_021",
    "p17_024",
    "p18_049",
    "p118_010",
    "p3_033"
   ],
   "note": "购房旗：CL-114 补登 p118_010（留学链⑥落旗拍，选项带 houseLoc city/suburb，captureHouse 路线盲照常捕获）。消费者含 p118_011（搬家，require 本旗）"
  },
  "care_plan_stated": {
   "setters": [
    "p21_068"
   ],
   "note": "把住院陪护安排对孩子念一遍说清了（P1 落事实）：消费者在结算批——「没办完的事」槽预期认领，本批只落事实不写判词"
  },
  "care_plan_vague": {
   "setters": [
    "p21_068"
   ],
   "note": "住院陪护安排只说了个大概（P1 落事实）：同上，结算批预期认领为悬着的事"
  },
  "checked_house_price": {
   "setters": [
    "p17_062"
   ],
   "note": "动过卖房念头、先看了行情（P1 立）：p22_045 空房处理与换房类条目的前置事实；不动住房参数"
  },
  "chess_circle": {
   "setters": [
    "p6_051"
   ],
   "note": "钓鱼改去公园下棋（P1 立）：棋局回响认领"
  },
  "cleaner_hired": {
   "setters": [
    "p4_011"
   ],
   "note": "给父母请了钟点工只做重活（P1 立）：双亲回响认领"
  },
  "coin_dabbled": {
   "setters": [
    "p19_047"
   ],
   "note": "注册买过一点币（P1 立）：币价波动回响认领"
  },
  "cousin_helped_first": {
   "setters": [
    "e78_030"
   ],
   "note": "父亲住院托表弟先帮着问（P1 立）：亲戚人情回响认领"
  },
  "cousin_stayed": {
   "setters": [
    "p11_007"
   ],
   "note": "表姐在自家沙发住过一阵（P1 立）：表姐落脚回响认领"
  },
  "cut_loss_once": {
   "setters": [
    "p1_036"
   ],
   "note": "基金割肉认过学费（P1 立）：投资话题回响认领；p13_044 规矩拍是它的叙事下游"
  },
  "data_course_done": {
   "setters": [
    "p18_038"
   ],
   "note": "报了厂内数据分析课（P1 立）：报表线回响认领"
  },
  "debt_free": {
   "setters": [
    "p12_064"
   ],
   "note": "补偿金先清了信用卡和零碎欠款、无债一身轻（P1 立）：借钱/月供类条目预期认领"
  },
  "delivered_meals_week": {
   "setters": [
    "p24_018"
   ],
   "note": "老朋友丧偶后接下来一周给对方送饭（P1 立）：老友线回响认领"
  },
  "elder_video_circle": {
   "setters": [
    "p14_063"
   ],
   "note": "跟老伙计们开起了视频局（P1 立）：老友条目预期按旗出场"
  },
  "elec_post_taken": {
   "setters": [
    "p23_032"
   ],
   "note": "拿电工证去应聘上岗（P1 立）：岗位事实回响认领；活计形态已由 craft_work 在管，工资档不另接"
  },
  "elevator_led": {
   "setters": [
    "p16_061"
   ],
   "note": "加装电梯时牵头把账算清（P1 立）：电梯装成回响的前置认领；health.js 电梯口径读条目发生事实，与本旗分工"
  },
  "escort_note_posted": {
   "setters": [
    "p23_062"
   ],
   "note": "把陪诊流程写成纸条贴了活动室（P1 立）：陪诊成摊回响认领；结算关系槽后续可读"
  },
  "fishing_circle": {
   "setters": [
    "p6_051"
   ],
   "note": "跟老同事钓鱼下周还去（P1 立）：钓鱼局回响认领"
  },
  "gave_parents_appliance": {
   "setters": [
    "p18_042"
   ],
   "note": "探亲留钱给家里换了空调（P1 立）：双亲回响认领（物件一侧）"
  },
  "gig_asked": {
   "setters": [
    "p1_030"
   ],
   "note": "问过骑手兼职怎么算（P1 立）：回响拍落 side_job，副业线由此开口"
  },
  "helped_classmate_job": {
   "setters": [
    "p1_015"
   ],
   "note": "帮教培转行的同学问过岗位（P1 立）：与 offered_hand 共用同学转行回响"
  },
  "huiqian_chosen": {
   "setters": [
    "p30_003"
   ],
   "note": "拆迁回迁线（v0.20.1 W5）：p30_003 选回迁选项立旗，p30_020 回迁房交钥匙以此为 require 门"
  },
  "bought_renzheng": {
   "setters": [
    "e65_009",
    "p15_031",
    "p18_020"
   ]
  },
  "calligraphy_teach": {
   "setters": [
    "p10_014",
    "p6_054"
   ]
  },
  "car_bought": {
   "setters": [
    "p12_045",
    "p2_081"
   ]
  },
  "car_sold": {
   "setters": [
    "p12_049"
   ],
   "note": "车已卖掉（v0.24.4 AN-2）：p12_049 条目级 set 落旗；车辆派生 carOf 的 now = 买过且未卖。旧存档无此旗，now 回落为 ever（卖过车的老玩家再卖一次前仍按有车读，一次性偏差，版本说明登记）。p12_047 的「卖了换电车」是以旧换新、不落此旗"
  },
  "care_stage": {
   "setters": [
    "proc_dad_care",
    "proc_mom_care"
   ],
   "note": "引擎在任一父母进程进入照护段呈现时立（renderProcItem 的 beat=care 分支），表示家里已进入照护期；父母离世后不撤销，读它的条目须自带在世门（v0.19.0 审计急修登记，此前为未登记的引擎内部旗）"
  },
  "care_hired": {
   "setters": [
    "e78_031",
    "fork52",
    "p17_052",
    "p21_016",
    "p21_021",
    "proc_dad_care",
    "proc_dad_hosp",
    "proc_mom_care",
    "proc_mom_hosp"
   ],
   "note": "请人照护·父母（v0.20.1 拆分）：自本轮起只由父母照护的 set 点立旗，结算父母槽读它不会再读错人；伴侣/自照护的请人点改立 care_hired_spouse"
  },
  "care_hired_spouse": {
   "setters": [
    "p21_055",
    "p24_006",
    "p24_024",
    "p25_009"
   ],
   "note": "请人照护·伴侣与自照护（v0.20.1 新旗）：另一半住院/出院请人（p24_006、p24_024、p25_009）与孩子给玩家请住家保姆（p21_055）的 set 点；与父母照护的 care_hired 分家，父母槽不读本旗"
  },
  "care_rotate": {
   "setters": [
    "e78_031",
    "fork52",
    "p17_052",
    "p21_016",
    "p25_009"
   ]
  },
  "care_self": {
   "setters": [
    "fork52",
    "p24_006",
    "p24_042",
    "proc_dad_care",
    "proc_dad_hosp",
    "proc_mom_care",
    "proc_mom_hosp"
   ]
  },
  "care_ss_gap": {
   "setters": [
    "p21_031"
   ]
  },
  "cataract_done": {
   "setters": [
    "p14_043",
    "p21_041",
    "p25_024",
    "p26_017"
   ],
   "note": "白内障手术做过（时序回响修复段立）：同题五条全按初诊初刀写、无一记账，两现即穿帮（审计 D F7 实锤）。四条首现者条目级自立＋互 forbid，谁先出谁占；p26_003 改作第二只眼后继拍（require 本旗＋flagAgeMin 1 年，不自立、不 forbid），白内障本就常两只眼分开做。旧存档有界放行：中途局已出过一条而旗未立时，最多再放行一条"
  },
  "cert_study_started": {
   "setters": [
    "p20_005",
    "p9_035"
   ]
  },
  "cert_try": {
   "setters": [
    "p16_010",
    "p20_044",
    "p2_019"
   ]
  },
  "choir_member": {
   "setters": [
    "p14_017",
    "p23_020",
    "p24_013",
    "p6_066"
   ],
   "note": "进过合唱团（时序回响修复段立）：起源四条——p14_017 社区合唱团、p23_020 县文化馆合唱团、p24_013 跨城合唱团、p6_066 老年大学合唱团名额，呈现即成员。消费者：p26_030 的 require（默认已在团里的排练拍）。c1955 年轻时厂/社区合唱团的四条回忆（p23_027、p23_065、p26_063、p26_065）全仓无年轻时期起源可接，已改文本降断言（主角降为听众/新加入者），不挂本旗。旧存档失败关闭"
  },
  "classmate_table": {
   "setters": [
    "p11_020"
   ]
  },
  "community_active": {
   "setters": [
    "p9_020"
   ]
  },
  "consult_work": {
   "setters": [
    "cr_consult_003",
    "cr_consult_004",
    "cr_consult_005",
    "cr_consult_006"
   ],
   "note": "咨询入行（CL-93 注册落地片）：行当与旗已在 trades.js／work.js FORM_OF_FLAG 登记，本条目为注册占位——现池无任何条目立此旗（setters 空集，validate-state 双向对账空集自洽），入行拍随咨询线内容片（CL-95）补入后逐条补登。形态 employee 正职层（不进 WORK_FORMAL_FLAGS／WORK_INFORMAL_FLAGS，退休落 fallback 58–63、养老金率 0.45），族籍 word 与 teach/press 同族；与销售职称的置业顾问（pack17 买房面）/销售顾问（p19_018）/早教课程顾问（p3_051）、留学顾问（pack18 留学中介面）、他线晚年返聘顾问面（p14_007/p14_008/p25_005、cr_forest_079、cr_dev_095 等⑥回响）分家——那些都不是咨询公司里的顾问，本旗只认乙方咨询公司的入行（校招直入与行业转入）。CL-95 补登（pack111）：四扇入行门 cr_consult_003（厂里老兵转乙方，require factory_work）/004（甲方老兵通用转入，anyFlag 七源）/005（专家型转入，anyFlag med/teach，只立一面）/006（校招直入，ctx.entry＋ctx.eduGate 严口径、eraIn 只 c1995/c2000）；种子 p111_001（宣讲会印象面，seed:consult）不立旗不在此列"
  },
  "cooking_recipe": {
   "setters": [
    "p10_028"
   ]
  },
  "crypto_old": {
   "setters": [
    "p22_055"
   ]
  },
  "cut_stock_2015": {
   "setters": [
    "p23_040"
   ]
  },
  "dca": {
   "setters": [
    "p2_070"
   ]
  },
  "door_neighbor": {
   "setters": [
    "p11_023"
   ]
  },
  "e78_ai": {
   "setters": [
    "e78_027",
    "p22_037"
   ]
  },
  "e78_car": {
   "setters": [
    "e78_036"
   ]
  },
  "edu_fund": {
   "setters": [
    "p12_032",
    "p15_015",
    "p16_042"
   ]
  },
  "ev_car": {
   "setters": [
    "p12_047"
   ]
  },
  "ex_colleague_neighbor": {
   "setters": [
    "p11_063"
   ]
  },
  "exam_landed": {
   "setters": [
    "p16_072",
    "cr_teach_105",
    "cr_press_095",
    "cr_med_hosp_027"
   ],
   "note": "体制内上岸落点（v0.20.1 W6 改链）：面试（p16_005）只落 exam_passed，录取（p16_071）→报到（p16_072）链尾才落本旗，后续体制内在行文本以此为据"
  },
  "exam_passed": {
   "setters": [
    "p16_005"
   ],
   "note": "考试线面试通过（v0.20.1 W6 新旗）：p16_005 面试拍的通过选项立旗，录取拍 p16_071 以 require+chain 承接"
  },
  "exam_admitted": {
   "setters": [
    "p16_071"
   ],
   "note": "录取落点（X-1 新旗）：p16_071 呈现即立；p16_072 以此为 require，报到不得先于录取；exam_passed 仍为面试通过旗、语义不变"
  },
  "exam_failed": {
   "setters": [
    "p16_007"
   ],
   "note": "考试线明确落空（v0.20.1 W9 新旗）：p16_007 第二年再考仍差一点的选项立旗；与 exam_retry（单次未中、仍可再试）分工——本旗只在再试也落空时落下。消费者：record.js 的路线未决门（落空后放行其他行当入行拍）、备考类通用文本的 forbid"
  },
  "edu_bridge": {
   "setters": [
    "p16_073",
    "p16_077"
   ],
   "note": "学历桥（v0.20.1 W6 新旗）：schooling=never/left 的人 22–26 岁走夜校/自考桥立旗——study 路线 p16_073、home 路线 p16_077（考试门片·审议单 #5 补开到回家乡路线），学历门文本以 ctx.eduGate/eduGateHalf 认本旗或 schooling"
  },
  "exam_bridge_declined": {
   "setters": [
    "p16_077"
   ],
   "note": "考试桥明确不补（考试门片·审议单 #5 新旗）：home 路线桥拍 p16_077 的选项二立旗——没读书记录的人已明确表态不补这一课。消费者：record.js 的考试窗谓词 examPending（立旗即出窗，不再为不可能的考试结果空等）；本旗只记表态，不给任何岗位"
  },
  "exam_retry": {
   "setters": [
    "p16_004",
    "p16_005"
   ]
  },
  "exam_shortlist": {
   "setters": [
    "p16_004",
    "p16_007"
   ]
  },
  "faded": {
   "setters": [
    "p3_038",
    "p3_043"
   ]
  },
  "fam_shop_in": {
   "setters": [
    "p11_005"
   ]
  },
  "fangai_kept": {
   "setters": [
    "p23_042"
   ]
  },
  "fangai_sold": {
   "setters": [
    "p23_042"
   ]
  },
  "fish_spot": {
   "setters": [
    "p10_002"
   ]
  },
  "frugal_rule": {
   "setters": [
    "e65_046",
    "p22_006"
   ]
  },
  "fund_bought": {
   "setters": [
    "p2_068"
   ]
  },
  "garden_share": {
   "setters": [
    "p10_021",
    "p25_036"
   ]
  },
  "grandkid_seen": {
   "setters": [
   ],
   "note": "孙辈已在本局以在场人物出现过（时序回响修复段立）：孙辈没有出生状态域，只有 kidAgeMin 年龄代理，「第一次抱孙辈」类断言无从查证（G6 一轮 e95_009 实例）。本旗无数据层 setter：由 work.js 的 syncGrandkidSeen 扫账本——名单 21 条（p14_027、p14_028、p14_030、p14_031、p14_032、p14_034、p16_059、p16_070、p23_066、p25_006、p25_017、p25_027、p25_037、p25_042、p25_063、p26_013、p29_019、e55_044、e55_050、e55_069、e95_009，凡把孙辈写成主角自己的在场人物者）任一呈现即立，flagAges 记首次呈现年龄，与 syncPensionPaid 同型、setters 为空以本注记为准；新增同类条目须同步把 id 加进 work.js 的 GRANDKID_BEAT_IDS。消费者：p14_028、e55_044 的 forbid（第一次抱/有了孙辈的到来语义必须是真的第一次）。旧存档账本自愈"
  },
  "held_stock_2015": {
   "setters": [
    "p23_040"
   ]
  },
  "helped_divorce_colleague": {
   "setters": [
    "p9_009"
   ]
  },
  "hobby_badminton": {
   "setters": [
    "p10_024"
   ]
  },
  "hobby_calligraphy": {
   "setters": [
    "p10_013"
   ]
  },
  "hobby_cooking": {
   "setters": [
    "p10_027"
   ]
  },
  "hobby_fishing": {
   "setters": [
    "p10_001"
   ]
  },
  "hobby_garden": {
   "setters": [
    "p10_020"
   ]
  },
  "hobby_music": {
   "setters": [
    "p10_016"
   ]
  },
  "hobby_photo": {
   "setters": [
    "p10_005"
   ]
  },
  "hobby_run": {
   "setters": [
    "p10_009",
    "p22_009"
   ]
  },
  "hook_books": {
   "setters": [
    "cf_02"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "kept_running": {
   "setters": [
    "p4_039"
   ],
   "note": "晨跑把闹钟定回去继续跑（P1 立）：健康线回响认领"
  },
  "kid_chose_far": {
   "setters": [
    "e78_048"
   ],
   "note": "孩子高考志愿以自己拿主意为主、去了远处（P1 落回响事实）：只落事实供孩子线后续回响读，不碰孩子线的门和链"
  },
  "kid_cost_memo": {
   "setters": [
    "p27_008"
   ],
   "note": "孩子升学费与对方按新比例写进备忘（P1 立）：只作回响取材，不碰孩子线的门和链"
  },
  "kid_cost_padfirst": {
   "setters": [
    "p27_008"
   ],
   "note": "孩子升学费谁宽裕谁先垫（P1 立）：同上"
  },
  "kid_debut": {
   "setters": [
   ],
   "note": "孩子已首次正面露面（孩子线批次 S2 立）：无数据层 setter——由 spouse.js 的 syncKidDebut 扫账本同步立旗：出生年（kidsBornAt ?? kidsAt，与 scheduler 的 kidAgeTrue 同源；e_kid_settle/e_kid_final 同拍落定者认 kidsAt）起，首条孩子拍（state/stateAll 门 kids=has 或带 kidAgeMin/kidAgeMax 的条目；出生拍本体 p3_046/lk_born/e55_057 不算露面）呈现即立，flagAges 记呈现年龄，与 syncGrandkidSeen 同型、setters 为空以本注记为准。保底生产者：进程判定 kidDebutDue——出生满 3 年仍未露面，当年必达一条低龄孩子拍（kidAgeMax≤3 且 met、按 w 加权），无合格条目时呈现保底拍 proc_kid_debut（process-beats.js，其 kidAgeMax=3 使其呈现本身即被同步认作露面、闭环）；呈现当年即由 syncKidDebut 立旗，不等次年。消费者：结算判词批（读 flagAges.kid_debut 与出生年之差写孩子首次露面时点）。旧存档账本自愈"
  },
  "kid_stayed_near": {
   "setters": [
    "e78_048"
   ],
   "note": "孩子高考志愿挑了离家近的稳妥专业（P1 落回响事实）：同上"
  },
  "land_all_transferred": {
   "setters": [
    "p29_021"
   ],
   "note": "大田全流转出去（P1 立）：务农形态事实，农活/身体线回响认领"
  },
  "land_half_kept": {
   "setters": [
    "p29_021"
   ],
   "note": "大田先流转一半再种两年（P1 立）：务农形态事实，同上"
  },
  "meds_checked": {
   "setters": [
    "p22_066"
   ],
   "note": "复查时照用药记录逐个问清（P1 立）：健康线信号入口——用药在管事实；死亡片 B 预期消费"
  },
  "mentored_through_crisis": {
   "setters": [
    "p13_047"
   ],
   "note": "深夜陪带过的人捋了一个小时（P1 立）：带人线回响认领"
  },
  "met_after_divorce": {
   "setters": [
    "p27_006"
   ],
   "note": "离异后经人张罗见了面、约着喝了咖啡（P1 立）：再结伴回响认领（入 dating 进程）"
  },
  "neighbor_on_speaking": {
   "setters": [
    "p5_020"
   ],
   "note": "楼上漏水敲门商量、处成说得上话的邻里（P1 立）：邻里条目预期按旗分文案"
  },
  "new_neighbors_made": {
   "setters": [
    "p23_055"
   ],
   "note": "在新小区处新邻居（P1 立）：新邻居条目认领"
  },
  "offered_hand": {
   "setters": [
    "p1_012"
   ],
   "note": "给网店被封的同学递过「来你这边干着」的话（P1 立）：与 helped_classmate_job 共用同学转行回响"
  },
  "old_neighbors_kept": {
   "setters": [
    "p23_055"
   ],
   "note": "逢年过节回老楼看老邻居（P1 立）：老邻居线回响认领"
  },
  "parents_activity_class": {
   "setters": [
    "p13_007"
   ],
   "note": "给父母报了社区活动班（P1 立）：双亲进程回响认领（父母社交一侧）"
  },
  "parents_live_near": {
   "setters": [
    "p21_043"
   ],
   "note": "父母同住试后改成住得近勤走动（P1 落居住事实）：晚年照护线预期读"
  },
  "parents_live_together": {
   "setters": [
    "p21_043"
   ],
   "note": "父母同住再试一个月（P1 落居住事实）：晚年照护线预期读"
  },
  "partner_taught_chores": {
   "setters": [
    "p26_049"
   ],
   "note": "慢慢教对方一点自己的活防万一（P1 落事实）：判词批伴侣史分型预期认领；本批只认领事实，不写判词"
  },
  "pension_base_asked": {
   "setters": [
    "p12_017"
   ],
   "note": "就最低基数交社保找人事问过（P1 立）：退休核定回响认领；替代率分档沿用 wage.js 现成口径，本旗不动参数"
  },
  "pension_base_low": {
   "setters": [
    "p12_017"
   ],
   "note": "社保按最低基数交到底没问（P1 立）：退休核定回响认领；同上，不动参数"
  },
  "phone_class_done": {
   "setters": [
    "e55_050"
   ],
   "note": "去社区手机课堂学智能手机（P1 立）：社区课堂条目认领"
  },
  "phone_note_on_wall": {
   "setters": [
    "e55_050"
   ],
   "note": "让孩子写操作纸条贴墙学智能手机（P1 立）：孩子回响认领"
  },
  "process_craft": {
   "setters": [
    "p18_038"
   ],
   "note": "没报课、先吃透手头工序（P1 立）：工序线回响认领"
  },
  "promised_next_summer": {
   "setters": [
    "p33_004"
   ],
   "note": "答应侄子明年还来讲书（P1 立）：约定型回响认领，与立约线同语法"
  },
  "quit_drinking": {
   "setters": [
    "p26_015"
   ],
   "note": "体检三项箭头后先戒了酒（P1 立）：健康线疾病信号——干预方式事实；死亡片 B 预期消费"
  },
  "re_div_start": {
   "setters": [
    "p31_001"
   ],
   "note": "再结伴·离异线起步（v0.13.0）：相识环选项立旗，相处/落点以此为 require 门"
  },
  "re_wid_start": {
   "setters": [
    "p32_001"
   ],
   "note": "再结伴·丧偶线起步（v0.13.0）：同上"
  },
  "hook_counter": {
   "setters": [
    "cf_01"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_frail": {
   "setters": [
    "ct_13"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_grandma": {
   "setters": [
    "cf_07"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_moved_kid": {
   "setters": [
    "cf_08"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_siblings": {
   "setters": [
    "cf_06"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "only_child": {
   "setters": [
    "cf_11"
   ],
   "note": "出身牌钩子（v0.20.1 W5）：cf_11「家里就你一个」立旗，兄弟姐妹类文本以 forbid 排除独生出身"
  },
  "hook_sporty": {
   "setters": [
    "ct_01"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_stage": {
   "setters": [
    "ct_11"
   ],
   "note": "出身牌钩子（v0.13.0）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_radio": {
   "setters": [
    "ce55_05"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_tape": {
   "setters": [
    "ce65_04"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_south": {
   "setters": [
    "ce78_04"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_pager": {
   "setters": [
    "ce85_05"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_olympic": {
   "setters": [
    "ce95_01"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "hook_era_lottery": {
   "setters": [
    "ce00_04"
   ],
   "note": "时代牌钩子（童年深度一期）：setter 为牌 id，消费事件 pack33"
  },
  "house_contract_kept": {
   "setters": [
    "p26_069"
   ]
  },
  "ins_critical": {
   "setters": [
    "p12_001"
   ]
  },
  "jizi_house": {
   "setters": [
    "e65_020"
   ]
  },
  "job_hop": {
   "setters": [
    "fork25"
   ]
  },
  "kid2": {
   "setters": [
    "e78_017",
    "e85_004"
   ]
  },
  "kid_abroad": {
   "setters": [
    "e65_040"
   ]
  },
  "laid_off": {
   "setters": [
    "p15_025",
    "p2_012"
   ]
  },
  "recheck_full": {
   "setters": [
    "p21_013"
   ],
   "note": "体检三项标红全查了一遍（P1 立）：健康线疾病信号入口——复查范围事实；死亡片 B 预期消费"
  },
  "recheck_logged": {
   "setters": [
    "p26_008"
   ],
   "note": "把对方复查结果记在台历上（P1 立）：健康线信号同族——复查在管事实；死亡片 B 对表"
  },
  "recheck_partial": {
   "setters": [
    "p21_013"
   ],
   "note": "体检三项标红只复查一项（P1 立）：健康线疾病信号入口——复查范围事实；死亡片 B 的 diseaseState 预期消费，与 p15_013/p21_032 同族对表"
  },
  "recipe_book": {
   "setters": [
    "p14_065"
   ],
   "note": "把成功菜式抄成了手抄本（P1 立）：厨房条目预期认领"
  },
  "rehab_kept": {
   "setters": [
    "p21_039"
   ],
   "note": "膝盖手术后好好配合康复（P1 立）：后续身体条目（爬楼/出门）回响认领"
  },
  "reimburse_expired": {
   "setters": [
    "p21_028"
   ],
   "note": "报销材料先放着（P1 立）：单子过期回响认领"
  },
  "reimburse_filed": {
   "setters": [
    "p21_028"
   ],
   "note": "陪父母看病的报销材料备齐去问清了（P1 立）：到账回响认领"
  },
  "rent_repair_fund": {
   "setters": [
    "p23_048"
   ],
   "note": "房改房租金单独存作维修基金（P1 立）：房屋大修类条目预期按旗抵扣认领"
  },
  "self_help_parents": {
   "setters": [
    "p4_011"
   ],
   "note": "没请钟点工、自己回去多干（P1 立）：照护回响认领"
  },
  "senior_u_one": {
   "setters": [
    "p25_052"
   ],
   "note": "老年大学只报一门课（P1 立）：课程回响认领"
  },
  "senior_u_two": {
   "setters": [
    "p25_052"
   ],
   "note": "老年大学报了两门课（P1 立）：课程回响认领"
  },
  "shebao_left_hanging": {
   "setters": [
    "p12_013"
   ],
   "note": "社保转移先放着没办（P1 立）：断缴发现回响认领"
  },
  "shebao_transferred": {
   "setters": [
    "p12_013"
   ],
   "note": "换城市时线上提交了社保转移（P1 立）：办结回响认领"
  },
  "spare_house_kept": {
   "setters": [
    "p22_045"
   ],
   "note": "空房先留着、先安顿父母（P1 落去留事实）：同上"
  },
  "spare_house_sold": {
   "setters": [
    "p22_045"
   ],
   "note": "空着的那套房挂牌处理了（P1 落去留事实）：只记去留，不动住房任何参数；住房账预期对表"
  },
  "spouse_hosp_done": {
   "setters": [
    "p14_049",
    "p15_063",
    "p16_063",
    "p22_031",
    "p23_057",
    "p24_006",
    "p24_024",
    "p24_042",
    "p25_008"
   ],
   "note": "配偶住过院（时序回响修复段立）：p24_024、p24_042 两条「另一半第一次住院」此前不设防，同代内任一配偶住院拍先出即成假话。九条配偶住院叙述者条目级自立（含两条第一次住院条目自身——呈现即住过院），两条第一次住院条目另加 forbid 本旗。p25_009（出院回家排班）另 require 本旗保证住过院。旧存档有界放行"
  },
  "spouse_passed": {
   "setters": [
    "p28_001"
   ],
   "note": "伴侣离世落点（v0.19.0 三相）：p28_001 呈现即立旗，引擎 flagAges 记落点年龄；p28_002 以 flagAgeWithin{flag:spouse_passed,years:2} 只在离世后 2 年内可抽，挡身后手续隔多年重办"
  },
  "late_parent": {
   "setters": [
    "lk_born",
    "e_kid_settle",
    "e_kid_final"
   ],
   "note": "晚育标记（v0.16.0）：中年以后得子（fork45 再试链 lk_born，或 e_kid_settle 42–50 / e_kid_final 52–58 选「要」）。隐含孩子已成年的 has 门控事件以 forbid 排除本旗持有者，清单与口径见 STATE-MATRIX §2 与本轮报告"
  },
  "late_settle": {
   "setters": [
    "fork_kid"
   ],
   "note": "到期再问时主动落定不要：原由 45 岁分岔落（v0.16.0），孩子线批次 S4 起改由 fork_kid 的到期再问「不要」（kidReask 选项）落，呈现层 kidForkCovenant 同拍补落 kid_no；旗义与读法不变"
  },
  "kid_yes": {
   "setters": [
    "fork_kid"
   ],
   "note": "站稳门内选要（孩子线批次 S4）：进程分岔 fork_kid 首问/再问选「要」（呈现年龄 <44）同拍落此旗并登记 covenant{kind:has, since=开门年龄}，次年 bornDue 保送出生拍。对应旧 cov38_has，但 since 不再是 38；≥44 岁选要不落此旗、改落 late_try 走晚育链"
  },
  "kid_no": {
   "setters": [
    "fork_kid"
   ],
   "note": "站稳门内选不要（孩子线批次 S4）：fork_kid 选「不要」落此旗、kids 同拍落 none、链关闭；到期再问选不要时由 kidForkCovenant 补落（该选项本体落 late_settle）。对应旧 cov38_none"
  },
  "kid_wait": {
   "setters": [
    "fork_kid"
   ],
   "note": "站稳门内选再等等（孩子线批次 S4）：fork_kid 首问选「再等等」落此旗并登记 covenant{kind:wait, since=开门年龄, due=since+7}，到期年由 kidGateDue 再问（只剩要/不要）。对应旧 cov38_wait；cov_solo_due 的门改读 kid_wait ∪ cov38_wait 并集（lines/covenant.js 用 any）"
  },
  "cov38_has": {
   "setters": [
   ],
   "note": "立约·要（v0.17.0）：38 岁分岔选「要」登记的持续之约，年度流 cov_has_flow 读此旗（S4 起该流改读 cov38_has ∪ kid_yes 并集）；只记约不碰 kids 状态机。孩子线批次 S4 起 fork38 退役、新局不再产生此旗，登记保留供旧存档与旧账本读取，setters 清空以本注记为准"
  },
  "cov38_none": {
   "setters": [
   ],
   "note": "立约·不要（v0.17.0）：同上，年度流 cov_none_flow（S4 起改读 cov38_none ∪ kid_no 并集）。S4 起新局不再产生，保留登记供旧存档，setters 清空以本注记为准"
  },
  "cov38_wait": {
   "setters": [
   ],
   "note": "立约·再等等（v0.17.0）：悬账之约，年度流 cov_wait_flow（S4 起改读 cov38_wait ∪ kid_wait 并集），到期点原为 45 岁分岔与 e_kid_settle/final 的既有落定路；S4 起旧约到期改由 kidGateDue 再问呈现 fork_kid（伴侣在场时）或 cov_solo_due 单身对账（其门同改并集）。S4 起新局不再产生，保留登记供旧存档，setters 清空以本注记为准"
  },
  "cov_solo_done": {
   "setters": [
    "cov_solo_due"
   ],
   "note": "立约单身对账（v0.20.1）：45 岁无伴侣时 cov_solo_due 一个人把约对完立此旗；结算对账行与没办完槽读它给单身版本。W8 补修：选「收了这份约」的选项另带 setState kids→none（边载体已登记），约与孩子一并结账；选「约先对到这儿」不落定，kids 仍走 e_kid_settle/final 单身收养版"
  },
  "mark_deskmate": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（v0.17.0）：开学第一天的半块橡皮；成年回响 echo_deskmate，影子回响见 src/content/prologue/prologue.js MARKS"
  },
  "mark_river": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（v0.17.0）：放学路上的河沟；成年回响 echo_river"
  },
  "mark_tree": {
   "setters": [
    "pr_child4"
   ],
   "note": "童年记号（v0.17.0）：校门口的老梧桐；成年回响 echo_tree"
  },
  "mark_candy": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（v0.21.1 变体）：开学第一天的水果糖；成年回响 echo_candy，影子回响见 prologue.js MARKS"
  },
  "mark_window": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（v0.21.1 变体）：坐了一年的靠窗座位；成年回响 echo_window，影子回响见 prologue.js MARKS"
  },
  "mark_wrongline": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（v0.21.1 变体）：开学第一天站错队；成年回响 echo_wrongline，影子回响见 prologue.js MARKS"
  },
  "mark_pencil": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容批）：开学第一天落了铅笔盒、借同桌的笔；纯发放，无成年回响，影子回响见 prologue.js MARKS"
  },
  "mark_namecall": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容批）：开学点名老师念错一个音；纯发放，无成年回响，影子回响见 prologue.js MARKS"
  },
  "mark_satchel55": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：大人用旧的军挎包；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_bench55": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：上学抱去的小板凳；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_ink55": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：蘸水笔洇开的墨团；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_top55": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：木头陀螺；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_kite55": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：旧报纸糊的风筝；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_slingshot55": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：柳木叉弹弓；纯发放，无成年回响，影子回响见 prologue-c1955.js MARKS"
  },
  "mark_satchel65": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：旧布拼的书包；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_bench65": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：上学抱去的小板凳；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_chalk65": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：上讲台捏断的粉笔；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_redscarf65": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：入队戴上的红领巾；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_top65": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：枣木陀螺；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_swim65": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：学会游泳的那条河；纯发放，无成年回响，影子回响见 prologue-c1965.js MARKS"
  },
  "mark_crayon78": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：十二支新蜡笔；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_satchel78": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：军绿挎包；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_stool78": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：上学抱去的小板凳；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_shuttlecock78": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：鸡毛毽子；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_sandbag78": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：碎布缝的沙包；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_hoop78": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：滚铁环；纯发放，无成年回响，影子回响见 prologue-c1978.js MARKS"
  },
  "mark_bag85": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学第一天背家里用旧布缝的书包；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_abacus85": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学带去学珠算的旧算盘；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_bench85": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学坐的两人合坐长板凳；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_top85": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：放学在院里抽的木陀螺；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_kite85": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：开春糊的风筝断线挂在树上；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_cicada85": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：夏天傍晚摸的知了猴；纯发放，无成年回响，影子回响见 prologue-c1985.js MARKS"
  },
  "mark_paint95": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学买的十二色水彩笔；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_wrap95": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学第一晚给新书套的书皮套；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_badge95": {
   "setters": [
    "pr_child1"
   ],
   "note": "童年记号（变体扩容第二轮）：开学发的校牌；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_yoyo95": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：线总断的悠悠球；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_silk95": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：鞋盒里养的蚕宝宝；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_shuttle95": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容第二轮）：放学踢的鸡毛毽子；纯发放，无成年回响，影子回响见 prologue-c1995.js MARKS"
  },
  "mark_hoop": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（v0.21.1 变体）：巷口滚铁环；成年回响 echo_hoop，影子回响见 prologue.js MARKS"
  },
  "mark_corn": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（v0.21.1 变体）：暑假钻玉米地；成年回响 echo_corn，影子回响见 prologue.js MARKS"
  },
  "mark_icepop": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（v0.21.1 变体）：一毛钱的冰棍；成年回响 echo_icepop，影子回响见 prologue.js MARKS"
  },
  "mark_hopscotch": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容批）：放学后在巷口跳房子；纯发放，无成年回响，影子回响见 prologue.js MARKS"
  },
  "mark_jumprope": {
   "setters": [
    "pr_child2"
   ],
   "note": "童年记号（变体扩容批）：放学后拴在树上的皮筋；纯发放，无成年回响，影子回响见 prologue.js MARKS"
  },
  "mark_shop": {
   "setters": [
    "pr_child4"
   ],
   "note": "童年记号（v0.21.1 变体）：校门口小卖部关门；成年回响 echo_shop，影子回响见 prologue.js MARKS"
  },
  "mark_yearbook": {
   "setters": [
    "pr_child4"
   ],
   "note": "童年记号（v0.21.1 变体）：毕业留言册；成年回响 echo_yearbook，影子回响见 prologue.js MARKS"
  },
  "mark_classphoto": {
   "setters": [
    "pr_child4"
   ],
   "note": "童年记号（v0.21.1 变体）：毕业照；成年回响 echo_classphoto，影子回响见 prologue.js MARKS"
  },
  "grab_wen": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了文那一样（书/笔/绘本，按年代物件面）；六族一局恰好落一个、零数值零门；成年回指挂 p2_024 的 textMark 变体，影子回响见 prologue.js MARKS"
  },
  "grab_cai": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了财那一样（算盘/钱/计算器，按年代物件面）；成年回指挂 p5_086 的 textMark 变体，影子回响见 prologue.js MARKS"
  },
  "grab_gong": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了工那一样（尺子/小扳手，按年代物件面）；无干净成年宿主，只入典藏大事记与影子回响（prologue.js MARKS）"
  },
  "grab_shi": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了食那一样（鸡蛋/糖/巧克力/小蛋糕，按年代物件面）；只入典藏大事记与影子回响（prologue.js MARKS）"
  },
  "grab_yin": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了印那一样（私章/印章，按年代物件面）；只入典藏大事记与影子回响（prologue.js MARKS）"
  },
  "grab_wan": {
   "setters": [
    "pr_grab"
   ],
   "note": "童年记号·抓周（0–4 小段）：周岁抓了玩那一样（拨浪鼓/玩具/积木/电脑鼠标，按年代物件面）；只入典藏大事记与影子回响（prologue.js MARKS）"
  },
  "late_tried": {
   "setters": [
    "lk_none",
    "lk_fade"
   ],
   "note": "认真试过而没有（v0.16.0）：治疗走完（lk_none）或断续试到停下（lk_fade）"
  },
  "late_try": {
   "setters": [
    "fork_kid"
   ],
   "note": "晚育再试标记：原由 45 岁分岔选「再认真试一回」落（v0.16.0），孩子线批次 S4 起改由 fork_kid 在呈现年龄 ≥44 时选「要」（kidLate 选项）落，开启 pack34 链与 synergy 晚育稀有；旗义与读法不变"
  },
  "legacy_sharing_done": {
   "setters": [
    "p25_040",
    "p25_043",
    "p9_064"
   ]
  },
  "less_work": {
   "setters": [
    "fork44"
   ]
  },
  "let_go": {
   "setters": [
    "p3_054"
   ]
  },
  "library_volunteer": {
   "setters": [
    "p9_018"
   ]
  },
  "loan_swap": {
   "setters": [
    "p2_060"
   ]
  },
  "long_dist": {
   "setters": [
    "p3_008"
   ]
  },
  "mentor_bond": {
   "setters": [
    "p18_009",
    "p20_001",
    "p9_003"
   ]
  },
  "money_rules_set": {
   "setters": [
    "p12_060",
    "p13_016"
   ],
   "note": "婚后管钱规矩已经谈过/定过（时序回响修复段立）：p13_016（第一次为钱吵、选项当场定规矩）与 p12_060（认真谈了一回、没吵架）写同一件家务事，两条互不记账、窗口重叠 12 年，同局两现既重复又口径相反（B85-03 实例）。两条条目级自立＋互 forbid，先到者占。旧存档有界放行"
  },
  "moved_city": {
   "setters": [
    "fork28m",
    "p11_035",
    "p15_006",
    "p15_009",
    "p17_001",
    "p17_011",
    "p17_018"
   ]
  },
  "moved_school": {
   "setters": [
    "p11_038"
   ]
  },
  "music_stage": {
   "setters": [
    "p10_018"
   ]
  },
  "near_family": {
   "setters": [
    "fork28m",
    "fork33",
    "p17_054"
   ]
  },
  "new_friend": {
   "setters": [
    "p11_055"
   ]
  },
  "night_school": {
   "setters": [
    "e65_019",
    "p16_011",
    "p16_036",
    "p20_041"
   ]
  },
  "no_ins": {
   "setters": [
    "p12_001"
   ]
  },
  "often_back": {
   "setters": [
    "fork28"
   ]
  },
  "p19_p2p_in": {
   "setters": [
    "p19_001"
   ]
  },
  "p19_stock_add": {
   "setters": [
    "p19_064"
   ]
  },
  "p19_stock_hold": {
   "setters": [
    "p19_064"
   ]
  },
  "p19_stock_trim": {
   "setters": [
    "p19_064"
   ]
  },
  "p1_ai_user": {
   "setters": [
    "p1_023"
   ]
  },
  "p20_cnc_retrain": {
   "setters": [
    "p20_025"
   ]
  },
  "p20_newline_trained": {
   "setters": [
    "p20_016"
   ]
  },
  "p20_toolbox_kept": {
   "setters": [
    "p20_056"
   ]
  },
  "parent_help": {
   "setters": [
    "p2_075"
   ]
  },
  "pension_paid": {
   "setters": [
    "p12_019",
    "p14_011"
   ],
   "note": "养老金已到账已当众说过（内容修复批，退休进程三连）：事实来源是 proc_retire_full 的正文/无单位变体（「退休的钱已经打进来了」）。落定载体的 set 位已被 retired_begun 占用、无空位可再立一旗，故由 work.js 的 syncPensionPaid 在账本出现 proc_retire_full 呈现记录时同步立旗、flagAges 记呈现年龄——与 retire_final_said 的引擎同步同型。消费者：p12_019、p14_011 的 forbid——「第一次到账」类文本领过即不出。再退变体（textAgain）正文不提到账、口径从宽计入：p12_019 的 flagAgeWithin 两年窗在再退时点已过，不产生实际误伤。时序回响修复段补：p12_019、p14_011 两条叙述者本身呈现时亦条目级自立此旗（两条 set 位本为空）——旧口径下走 node/auto 落定者此旗永不立、两条可先后各说一次第一次到账；自立后谁先出谁立、另一条被自身 forbid 挡住，setters 补登此二条，同步仍是 proc 落定路径的来源"
  },
  "parents_money_guard": {
   "setters": [
    "p12_039"
   ]
  },
  "photo_work": {
   "setters": [
    "p100_014",
    "p100_015",
    "p100_016",
    "p100_017",
    "p100_018"
   ],
   "note": "摄影入行（CL-78 注册落地片）：行当与旗已在 trades.js／work.js FORM_OF_FLAG 登记，本条目为注册占位——现池无任何条目立此旗（setters 空集，validate-state 双向对账空集自洽），入行拍随摄影师线开线批补入后逐条补登。形态 flex 机会层（ENTRY_OPPORTUNITY_FLAGS 在册、退休 informal 63–68），族籍 hand 与 craft 同族；与爱好旗 hobby_photo（p10_005）、出片旗 photo_show 分家——爱好是种子土壤不是入行。CL-84 开线第一片（pack100）补登五门 setters：p100_014 馆学徒进暗房／p100_015 影楼化妆助理／p100_016 报社通讯员转／p100_017 爱好卖图起步／p100_018 器材店店员转跟拍；五门之外的立旗者仍为零（关口入行走 career.js 机制不入本表）"
  },
  "photo_show": {
   "setters": [
    "p10_006"
   ]
  },
  "photos_scanned": {
   "setters": [
    "p10_052",
    "p25_079"
   ]
  },
  "prepaid": {
   "setters": [
    "p12_067",
    "p2_056"
   ]
  },
  "promise_grandkid": {
   "setters": [
    "e65_054"
   ]
  },
  "rehire": {
   "setters": [
    "fork58",
    "p15_042",
    "e_rehire_1",
    "e_rehire_2"
   ]
  },
  "renting": {
   "setters": [
    "e78_006",
    "fork33",
    "p17_003",
    "p17_021",
    "p17_024"
   ]
  },
  "renzheng_drawer": {
   "setters": [
    "p26_057"
   ]
  },
  "retired_checkup_done": {
   "setters": [
    "e55_047",
    "p14_041",
    "p14_047",
    "p24_007",
    "p24_028",
    "p25_034"
   ],
   "note": "退休后体检已被叙述过（时序回响修复段立）：退休后体检的叙述者多条并存本身无碍，坏事的只有 p14_041「退休后第一次全面体检」的断言没人记账（批一盲审已抓它在别的体检拍之后出）。六条叙述者条目级自立，p14_041 自立＋forbid——第一次只能是真第一次。旧存档有界放行"
  },
  "retired_full": {
   "setters": [
    "fork58"
   ],
   "note": "58 岁分岔「退」选项专属（v0.19.0 厘清）：退休相位进程（proc_retire_*）只写 workPhase 状态、不立此旗——此旗是 end_traveler 等特殊结局的证据点，生产者集合不变，结局门槛不动"
  },
  "retired_begun": {
   "setters": [
    "proc_retire_full",
    "proc_retire_auto",
    "proc_retire_node"
   ],
   "note": "首次进入 retired 的落点旗（v0.19.0 审计急修）：只记首次全退年龄供 flagAgeWithin 读（如 e_retire_firstmonth 的两年窗）；与 retired_full 分工——retired_full 仍为 fork58 专属证据旗，生产者不变"
  },
  "retire_final_said": {
   "setters": [
    "e_retire_firstmonth"
   ],
   "note": "退休落定已当众说过（v0.20.1 W2，退休单一事实源之一）：首次全退落定起立、一局只认第一次。数据层 setter 为 e_retire_firstmonth（落定后两年窗内呈现即立）；引擎侧由 work.js 的 syncRetireFinalSaid 在账本首次出现 workPhase>retired 流转时同步立旗并按流转年龄记 flagAges——落定载体（proc_retire_node/full/auto 的 set 位已被 retired_begun 占用、fork58 已被 retired_full 占用）无空位可再立一旗，故以引擎同步补齐，口径与 retired_begun 的首次落点一致。消费者：proc_retire_full 的再退变体选择（workPhaseDue 按账本判）、p14_010 的 require、规划类文本（p10_065 等）的 forbid；呈现任何落定文本前先查此旗"
  },
  "run_marathon": {
   "setters": [
    "p10_010"
   ]
  },
  "saw_home": {
   "setters": [
    "e78_050",
    "fork28"
   ]
  },
  "self_hosp_done": {
   "setters": [
    "p21_039",
    "p23_022",
    "p27_007"
   ],
   "note": "主角本人住过院（时序回响修复段立）：此前「出院/病后恢复期」类文本（p25_028）没有任何住院事实可依，既能在从没住过院的局里凭空出院、也能在住院六年后还写近时态恢复期。设置者：p21_039（膝盖手术）、p23_022（县医院）、p27_007（胆结石）条目级自立；p26_003（白内障住院四天）的条目 set 位归 cataract_done 族占用，故另由 work.js 的 syncSelfHosp 扫账本四条 id 补立（含旧存档自愈）。注意 flagAges 口径与全仓不同：本旗记最近一次住院年龄（sync 每年按账本最近一条重算）——p25_028 的恢复期语义要读近时窗（require＋flagAgeWithin 2），首次口径会让它在第二次住院后仍被早年记录误挡，分析报告已登记此取舍。急诊不算住院：p3_030（半夜发烧急诊输液）不在名单"
  },
  "shop_closed": {
   "setters": [
    "p2_040",
    "p30_008"
   ]
  },
  "side_job": {
   "setters": [
    "fork44",
    "p15_044",
    "p20_034",
    "p1_088"
   ]
  },
  "side_start": {
   "setters": [
    "fork25"
   ]
  },
  "slow_life": {
   "setters": [
    "fork58",
    "proc_retire_node"
   ]
  },
  "ss_fixed": {
   "setters": [
    "p12_011",
    "p22_005"
   ]
  },
  "stall_breakfast": {
   "setters": [
    "e55_033",
    "p15_029"
   ]
  },
  "stay_put": {
   "setters": [
    "fork25"
   ]
  },
  "stayed_city": {
   "setters": [
    "fork28"
   ]
  },
  "stayed_home_halfmonth": {
   "setters": [
    "p16_063"
   ],
   "note": "另一半出院后在家陪了半个月（P1 立）：伴侣康复回响认领"
  },
  "steady_job": {
   "setters": [
    "fork44",
    "p15_023"
   ]
  },
  "stock_2008": {
   "setters": [
    "e65_037"
   ]
  },
  "switch_wanted": {
   "setters": [
    "cr_want_cold",
    "cr_want_seed",
    "cr_med_027",
    "cr_med_hosp_017",
    "cr_nurse_014",
    "cr_img_011",
    "cr_factory_089",
    "cr_factory_090",
    "cr_factory_091",
    "cr_farm_083",
    "cr_farm_084",
    "cr_farm_085",
    "cr_shop_085",
    "cr_shop_086",
    "cr_shop_087",
    "cr_craft_075",
    "cr_craft_076",
    "cr_craft_077",
    "cr_shop_091",
    "cr_shop_099",
    "cr_shop_100",
    "cr_factory_121",
    "cr_factory_128",
    "cr_craft_087",
    "cr_craft_088",
    "cr_teach_098",
    "cr_teach_099",
    "cr_teach_100",
    "cr_teach_111",
    "cr_press_084",
    "cr_press_085",
    "cr_press_086",
    "cr_press_090",
    "cr_press_091",
    "cr_press_093",
    "cr_press_096",
    "cr_dev_056",
    "cr_med_042",
    "cr_img_015",
    "cr_forest_051",
    "cr_consult_023",
    "p111_007",
   ],
   "note": "在职想走（第 2 期 P2-3 立）：后段想走拍 cr_want_cold（冷门来处）与 cr_want_seed（种子/承继来处）的「想换」选项立旗，两拍自身以 forbid 本旗关门防复读。消费者：world/career.js 的 gateSwitchDue——待业段满 1 年且想走、或在职想走（已立旗且不在待业段）两条支路开 gate_switch（框走 want；unit_gone 硬推走 fact 框）。立旗不清空：想走而没走（关口里又选了原行或推掉）旗仍在，冷却后再开（设计 §3.5，中年转行的口子留得住）。CL-49 补登（v0.60.70）：cr_dev_056 想走面立旗"
  },
  "switched_to_walk": {
   "setters": [
    "p4_039"
   ],
   "note": "晨跑改成晚饭后散步（P1 立）：健康线回响认领"
  },
  "taiji_class": {
   "setters": [
    "p6_054"
   ],
   "note": "书法班改报了太极班（P1 立）：太极回响认领"
  },
  "team_captain": {
   "setters": [
    "p22_010",
    "p23_003"
   ]
  },
  "team_member": {
   "setters": [
    "p15_004",
    "p16_023",
    "p17_010",
    "p19_014",
    "p20_029"
   ],
   "note": "进过球队（时序回响修复段立，统一履历旗）：此前三个起源旗互不通用（unit_team/league_team/p20_league_member 已退役摘除）＋p15_004/p19_014 不立旗，而五个回忆拍全无门预设球队履历。本旗设置者：p16_023 选项 1、p17_010 选项、p20_029 选项 1（旧三旗的立旗点平移）、p15_004 条目级（正文已在场上踢第一场）、p19_014 条目级（试训写进替补名单）。消费者：p16_024、p17_047、p20_030（旧三旗消费者平移）、p23_003、p22_054、p26_056 的 require。p23_003 呈现另立 team_captain 喂 p23_013。旧存档失败关闭：旧三旗不迁移，老局里回忆拍本局可能不再出，不产生矛盾"
  },
  "together": {
   "setters": [
    "p3_038",
    "p3_043"
   ]
  },
  "took_over_job": {
   "setters": [
    "e55_007"
   ]
  },
  "traj_award": {
   "setters": [
    "r_award"
   ]
  },
  "traj_book": {
   "setters": [
    "r_book"
   ]
  },
  "traj_captain": {
   "setters": [
    "r_captain_final"
   ]
  },
  "traj_champ": {
   "setters": [
    "r_marathon"
   ]
  },
  "traj_craft": {
   "setters": [
    "r_craft_apprentice"
   ]
  },
  "traj_drug1": {
   "setters": [
    "r_drug1"
   ]
  },
  "traj_drug2": {
   "setters": [
    "r_drug2"
   ]
  },
  "traj_funded": {
   "setters": [
    "r_funding"
   ]
  },
  "traj_fortune_acct": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_builder": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_consult": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_craft": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_dev": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_farm": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_fin": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_media": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：自媒体是 write 线的线面、旗名单列（CL-109 §二.2 点名 traj_fortune_media）；坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_photo": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_sea": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_shop": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_fortune_write": {
   "setters": [
   ],
   "note": "富贵尾巴坐实旗（CL-109 §二.2／CL-112 占位登记）：本线尾巴坐实拍未施工（后续 W 片），setters 先空集占位，照 trial_done 先例以本注记为准。消费者先行：settlement.js 钱槽富贵档（FORTUNE 旗组）与 end_selfmade 的 any/evidence——旗未落时两处恒不命中，不改变存量行为。"
  },
  "traj_ipo": {
   "setters": [
    "r_ipo"
   ]
  },
  "traj_lottery": {
   "setters": [
    "r_lottery"
   ]
  },
  "traj_oldhouse": {
   "setters": [
    "r_oldhouse"
   ],
   "note": "拆迁链中间旗（CL-112 新立）：r_oldhouse 落点环选钱/选房两选项同落此旗，供坐实环 r_oldhouse_move 的 chain+require 双门消费；本身不进结算与结局口径。"
  },
  "traj_school": {
   "setters": [
    "r_school1"
   ]
  },
  "traj_startup": {
   "setters": [
    "r_startup"
   ]
  },
  "traj_taoli": {
   "setters": [
    "r_teacher_students"
   ]
  },
  "traj_trucker": {
   "setters": [
    "r_trucker_route"
   ]
  },
  "traj_village_doc": {
   "setters": [
    "r_village_doc"
   ]
  },
  "traj_viral": {
   "setters": [
    "r_viral"
   ]
  },
  "traj_vp": {
   "setters": [
    "r_school2"
   ]
  },
  "traj_windfall": {
   "setters": [
    "r_oldhouse_move"
   ],
   "note": "拆迁坐实旗：CL-112 前由 r_oldhouse 一拍直落；改造后落点环只落 traj_oldhouse，本旗改由坐实环 r_oldhouse_move 落（CL-109 §五两环制）。"
  },
  "trial_done": {
   "setters": [
   ],
   "note": "单位球队试训发生过（时序回响修复段立）：p16_023 与 p19_014 写同一场试训（借鞋、大一号）、互不知晓，同局两现且鞋的来历打架（A F-13）。本旗无数据层 setter：由 work.js 的 syncTrialDone 扫账本，两条 id 任一呈现即立，与 syncPensionPaid 同型、setters 为空以本注记为准。消费者：两条自身的 forbid——试训一生一次。旧存档账本自愈"
  },
  "tried_stock": {
   "setters": [
    "e65_008",
    "p17_028",
    "p18_019",
    "p19_049"
   ]
  },
  "trip_cut_short": {
   "setters": [
    "p10_040"
   ],
   "note": "旅行中对方病倒后提前回家（P1 立）：伴侣旅行回响认领"
  },
  "trip_stayed": {
   "setters": [
    "p10_040"
   ],
   "note": "旅行中对方病倒后多住两天缓过来（P1 立）：伴侣旅行回响认领"
  },
  "tutor_hard": {
   "setters": [
    "p3_054"
   ]
  },
  "two_cities": {
   "setters": [
    "p11_042"
   ]
  },
  "rel_strained": {
   "setters": [
    "p3_007",
    "p13_016"
   ],
   "note": "关系紧张事实（v0.20.1 W5 立，W8 收紧）：只认「吵完没收尾」的留痕——p3_007 冷战一晚无和好收尾、p13_016 仅「各管各的」选项（立规矩和好的选项不立）。吵完和好/误会查清的事件不立此旗：c_partner（对方先递热水、日子续上）、p3_020（日期两边都记错、查清即收尾）已摘。p27_001 离婚以前情门 any[two_cities, rel_strained, long_dist] + 当前关系值门（stats relation<85）双认（v0.20.3 回调，用户裁定离婚更方便一点：窗口 30–58→28–60、加 w=800 提抽取可靠性、relation 门 70→85、any 增列 long_dist——p3_008「去吧，我这边稳住」的两地分开两年事实，与 two_cities 同类；前情事实门整段保留，无前情仍不可抽，rel_strained 的立旗标准不放宽）"
  },
  "unit_gone": {
   "setters": [
    "p22_010"
   ],
   "note": "单位没了（时序回响修复段立）：p22_010「单位早散了」此前只是随口一说、不记账，其后老领导送别会/前辈告别饭/单位口吻退休正文照旧出。p22_010 条目级自立（呈现即前提成立、与选项无关）；另由 work.js 的 syncUnitGone 扫账本同 id 补立，旧存档自愈。消费者：p9_026、e_mentor、p14_001、p14_002、p14_004、e55_045、p14_007 的 forbid，及 work.js 的 noCurrentUnit 扩读（进程落定正文走无单位变体）"
  },
  "video_addict": {
   "setters": [
    "p10_045"
   ]
  },
  "video_quit": {
   "setters": [
    "p10_046"
   ]
  },
  "visit_home_more": {
   "setters": [
    "p18_042"
   ],
   "note": "探亲后改成每年多回来一趟（P1 立）：双亲回响认领（陪伴一侧）"
  },
  "volunteer_regular": {
   "setters": [
    "p9_022"
   ]
  },
  "wages_all_home": {
   "setters": [
    "p29_005"
   ],
   "note": "打短工的工钱全带回家（P1 立）：家里用上这笔钱的回响认领"
  },
  "walk_regimen": {
   "setters": [
    "p26_015"
   ],
   "note": "体检三项箭头后每天走四十分钟（P1 立）：健康线疾病信号——干预方式事实；死亡片 B 的 diseaseState 预期消费"
  },
  "walk_with_dad": {
   "setters": [
    "p13_007"
   ],
   "note": "每天陪父亲散步打卡（P1 立）：双亲进程回响认领（父亲身体一侧）"
  },
  "warned_family_scam": {
   "setters": [
    "p10_068"
   ],
   "note": "在家庭群提醒过防诈骗电话（P1 立）：家人版回响认领"
  },
  "wednesday_new_dish": {
   "setters": [
    "p14_065"
   ],
   "note": "固定周三试新菜（P1 立）：新菜回响认领"
  },
  "went_home_for_dad": {
   "setters": [
    "e78_030"
   ],
   "note": "父亲住院自己请假跑回去办（P1 立）：双亲进程父亲一侧回响认领"
  },
  "xiahai": {
   "setters": [
    "e65_011"
   ]
  },
  "med_work": {
   "setters": [
    "e_med_start",
    "p40_015",
    "p40_016",
    "p40_017",
    "p40_018"
   ],
   "note": "从医经历（v0.18.0，职业语境门）：卫生院入行拍立旗，村医类稀有与结局以此为门。CL-04（v0.60.23）补登 pack40 四条入行拍 p40_015–018（赤脚医生培训/卫校分配/乡村医生注册/订单定向）"
  },
  "truck_work": {
   "setters": [
    "e_truck_start",
    "p39_013",
    "p39_014",
    "p39_015",
    "cr_shop_093",
    "cr_farm_118",
    "cr_truck_045",
    "cr_truck_046",
    "cr_truck_048",
    "cr_truck_049",
    "cr_truck_050",
    "cr_sea_082",
   ],
   "note": "长途职业线入行（v0.18.0，职业语境门）：跟车入行拍立旗。CL-03（v0.60.24）补登 pack39 三条入行拍 p39_013–015（车队招工学徒/物流干线招司机/买车挂靠夫妻同车）"
  },
  "truck_veteran": {
   "setters": [
    "e_truck_years"
   ],
   "note": "长途跑满十来年（v0.18.0）：入行链后继立旗，「跑满一百万公里」结局以此为门"
  },
  "literacy_gain": {
   "setters": [
    "pr_never2"
   ],
   "note": "识字线（v0.18.0）：never 处境 15 岁夜校拍立旗，成年段有回响事件"
  },
  "half_grown": {
   "setters": [
    "pr_half3"
   ],
   "note": "半读出身补课（v0.18.0）：half 线 19 岁拍立旗，成年段有回响事件"
  },
  "factory_work": {
   "setters": [
    "p15_071"
   ,
    "farm_exit_settle",
    "cr_shop_092",
    "cr_craft_083",
    "cr_farm_113",
    "cr_sea_083",
   ],
   "note": "工厂制造入行（v0.19.0，职业语境门）：招工入行拍立旗，工厂主簇以此为门"
  },
  "craft_work": {
   "setters": [
    "p20_001",
    "p20_002",
    "p20_003",
    "p20_008",
    "cr_shop_098",
    "cr_truck_063",
   ],
   "note": "技工入行（v0.19.0）：钳/焊/机修/家电维修学徒拍立旗，技工簇以此为门"
  },
  "fitter_work": {
   "setters": [
    "p20_001"
   ],
   "note": "钳工工种（内容修复批二轮）：钳工入行拍条目级立旗，与 craft_work 并置；点名钳工的文本以 craft_work+fitter_work 双旗为门"
  },
  "welder_work": {
   "setters": [
    "p20_002"
   ],
   "note": "焊工工种（内容修复批二轮）：焊工入行拍条目级立旗，与 craft_work 并置；点名焊工的文本以 craft_work+welder_work 双旗为门"
  },
  "married": {
   "setters": [
    "p3_003",
    "p3_086",
    "proc_dating"
   ],
   "note": "结过婚（时序回响修复段立）：此前全系统只有 spouse 状态机到 partnered，「婚后」文本只能拿 partnered 当已婚用、时序靠年龄窗碰运气，「结婚第一年」反复跑到领证前头（跨四代实例）。设置者：p3_003 条目级（正文前提即领证之后）、p3_086 条目级（领证拍本体，补 fork31 直落 partnered 路径的结婚事实——实测曾 partnered 的局里两旧设置者皆无的占 11/13，不补则整族饿死）、proc_dating 选项 1「把关系定下来」（两家人吃饭定局）。fork31 选项 1 不立：文案是「往结婚的方向走」，未结。消费者：p3_004（require＋flagAgeWithin 1，第一年即距婚一年内）、p3_010、p13_016、p12_060（require）。旧存档失败关闭：中途局无此旗时四条消费者本局可能不再出，不产生矛盾"
  },
  "mech_work": {
   "setters": [
    "p20_003"
   ],
   "note": "机修工种（内容修复批二轮）：机修入行拍条目级立旗，与 craft_work 并置；点名机修的文本以 craft_work+mech_work 双旗为门"
  },
  "appliance_work": {
   "setters": [
    "p20_008"
   ],
   "note": "家电维修工种（内容修复批二轮）：家电维修入行拍条目级立旗，与 craft_work 并置；点名家电维修的文本以 craft_work+appliance_work 双旗为门"
  },
  "grad_work": {
   "setters": [
    "e_grad_start"
   ],
   "note": "研究在行（AN-3 D-5c）：深造路线课题组入行拍立旗，与 exam_landed 并置同为 employee 形态入行旗；实验室/药研簇以 ctx.gradGate 为门（旧档以 traj_drug1/traj_drug2 宽门回落）"
  },
  "sew_work": {
   "setters": [
    "p15_003",
    "p15_012"
   ],
   "note": "缝纫亚工种（AN-3 D-6）：pack15 缝纫组首抽条目级立旗，与 loom_work/assembly_work 互斥；旧档无此旗时三组首抽都够得着，首抽后自愈"
  },
  "loom_work": {
   "setters": [
    "p15_024",
    "p15_030",
    "p15_035"
   ],
   "note": "织造亚工种（AN-3 D-6）：pack15 织造组首抽条目级立旗，与 sew_work/assembly_work 互斥"
  },
  "assembly_work": {
   "setters": [
    "p15_047"
   ],
   "note": "装配亚工种（AN-3 D-6）：pack15 装配组首抽条目级立旗，与 sew_work/loom_work 互斥"
  },
  "miner_work": {
   "setters": [
    "p20_009",
    "p41_011",
    "p41_012",
    "p41_013",
    "p41_014",
    "p41_015"
   ],
   "note": "矿工入行（v0.19.0）：矿上招工签约选项立旗，井下簇以此为门。CL-05（v0.60.25）补登 pack41 五条入行拍 p41_011–015（矿务局招工/子女顶替/农民轮换工/乡镇煤矿招工/劳务派遣）"
  },
  "fab_work": {
   "setters": [
    "p18_032"
   ],
   "note": "半导体入行（v0.19.0）：进晶圆厂跟线入行拍立旗，晶圆/封测簇以此为门"
  },
  "shop_work": {
   "setters": [
    "p19_005",
    "p19_025",
    "p19_055",
    "cr_factory_122",
    "cr_craft_081",
    "cr_farm_115",
    "cr_teach_104",
    "cr_write_110",
    "cr_driver_taxi_038",
    "cr_sea_081"
   ],
   "note": "店主入行（v0.19.0）：批发学徒/接手家店/开网店拍立旗，商户簇以此为门"
  },
  "gig_work": {
   "setters": [
    "p22_071",
    "cr_shop_095",
    "cr_factory_125",
    "cr_farm_117",
    "p85_014",
    "cr_sea_084",
   ],
   "note": "零工/自由职业入行（v0.19.0）：劳务市场报名接活拍立旗，零工簇以此为门；与 side_job（副业）分家。CL-61 补登 p85_014：众包骑手注册门（宝妈时段单，孩子上学那天注册）——骑手脸按 DESIGN 分工与 courier 共用机会层日常池，众包本体归 gig 落账"
  },
  "courier_work": {
   "setters": [
    "p22_002",
    "p22_072",
    "cr_shop_097",
    "cr_factory_127",
    "p85_011",
    "p85_012",
    "p85_013",
   ],
   "note": "快递物流入行（v0.19.0）：转运分拣/站点招工拍立旗，快递簇以此为门。CL-61 开线补登 pack85 三门：p85_011 直营兼职转正、p85_012 下岗走进外卖站点、p85_013 跑腿平台培训注册（与 v0.19 两门、两扇他线转入门共七扇，形状互不重复）"
  },
  "farm_work": {
   "setters": [
    "p29_001",
    "p29_002",
    "farm_entry_new",
    "farm_entry_main",
    "cr_shop_094",
    "cr_craft_084",
    "cr_sea_085",
   ],
   "note": "种地入行（v0.19.0）：分家单过/分地到户拍立旗，种地簇以此为门；农民路线立项后此旗为该路线立线旗（入口含 pack35 接班拍）"
  },
  "sea_work": {
   "setters": [
    "p63_012",
    "p63_013",
    "p63_014",
    "p63_015",
    "p63_016",
    "p63_017",
    "p63_018",
    "p115_005",
    "p115_006"
   ],
   "note": "出海入行（CL-27 新线，用户 2026-11-10 亲点）：pack63 七条入行拍立旗（渔业队上船/顶替进渔业公司/跟船学徒/码头招季节船员/远洋招工/承包滩涂网箱养殖/潜水海钓体验）；三脸（捕捞/养殖/海上体验）共用一旗，脸靠公历门与 ctx 分。CL-107 补登两门：远洋劳务签约门 p115_005（经劳务公司、先凑费用，与 p63_016 公司直招分开）／养殖公司技术员门 p115_006"
  },
  "forestry_work": {
   "setters": [
    "p75_015",
    "p75_016",
    "p75_017",
    "p75_018",
    "p75_019"
   ],
   "note": "林业入行（CL-47 开线）：pack75 五条入行拍立旗（顶替进林业局 p75_015/苗圃临时工转正 p75_016/回家种山 p75_017/中专分配到林业站 p75_018/生态护林员选聘 p75_019）；五脸共用一旗，脸靠公历门与 ctx 分"
  },
  "farm_returned": {
   "setters": [
    "farm_township_back",
    "cr_factory_123"
   ],
   "note": "乡镇企业回落（立项新增）：厂散后回地里立旗——flagAges 只记首落点，重立 farm_work 翻不动活计形态，故用新旗承接回落落点，FORM_OF_FLAG 映射 farm，R1 按落点年龄把形态拽回"
  },
  "farm_left": {
   "setters": [
    "fork28f"
   ],
   "note": "农民路线退出层（立项新增）：28 岁分岔选「全家进城」立旗——scheduler.met 以派生判据把务农线条目整系关门（不逐条写 forbid，免抬 saliency 具体度扰动老路线抽取序），居所轨迹按 city 记账，人转入通用城市池"
  },
  "selfbuilt_house": {
   "setters": [
    "fork33f"
   ],
   "note": "农民路线自建房（立项新增）：33 岁分岔在宅基地上拆老房盖新房立旗——housingOf 读作 owned/selfbuilt（有房可住），不进 house.js 购房旗全集（无档、无月供、终局不变现，土地不进资产账）"
  },
  "township_work": {
   "setters": [
    "farm_township",
    "cr_farm_114"
   ],
   "note": "乡镇企业入行（立项新增）：农民路线混合层——FORM_OF_FLAG 映射 employee、工资走 C 档；farm_work 旗不清，土地池保持开门；厂散回落由 farm_township_back 立 farm_returned 接回"
  },
  "teach_work": {
   "setters": [
    "r_school1",
    "p37_015",
    "p37_016",
    "p37_017",
    "p37_018",
    "p37_019",
    "cr_craft_086",
    "cr_press_097",
    "cr_med_041",
    "cr_sea_086"
   ],
   "note": "教师入行（v0.19.0）：r_school1 分配到校呈现即立（两选项均为教书），教师簇以此为门；traj_school 仍为轨迹旗。v0.60.20 补登 pack37 五条入行拍（代课/接班/考编/特岗/临聘，均 ctx entry 立 teach_work）"
  },
  "acct_work": {
   "setters": [
    "p16_016",
    "p74_004",
    "p74_005",
    "p74_006",
    "p74_007",
    "p93_001",
    "p93_002"
   ],
   "note": "财会入行（v0.19.0）：第一份出纳活入行拍立旗，出纳簇以此为门；CL-46 开线补登四门 p74_004–007（供销社学徒/乡办厂出纳/支行培训上柜/事务所分配）"
  },
  "builder_work": {
   "setters": [
    "cr_factory_126",
    "cr_craft_082",
    "cr_farm_116",
    "p99_013",
    "p99_014",
    "p99_015",
    "p99_016",
    "p99_017",
    "cr_builder_105"
   ],
   "note": "建筑工人入行（第 2 期注册扩版 v0.60.19 立行当，先有 trades/FORM_OF_FLAG 登记；CL-19 工厂线转行段 cr_factory_126 为首个立旗条目，本条目随之新建）；CL-96 收口补登矿工关停分流转入面 cr_builder_105"
  },
  "care_work": {
   "setters": [
    "p21_073",
    "cr_shop_096",
    "cr_factory_124",
    "cr_craft_085",
    "cr_farm_119",
    "cr_nurse_022",
    "p81_015",
    "p81_016",
    "p81_017",
    "p81_018",
    "p81_019",
    "p94_007",
    "p94_008",
    "p94_009",
    "p94_010",
   ],
   "note": "职业陪护入行（v0.19.0）：陪护接活入行拍立旗；与家庭照护旗 care_ss_gap/care_self 分家"
  },
  "write_work": {
   "setters": [
    "p2_086",
    "cr_teach_107",
    "cr_press_092",
    "p71_013",
    "p71_014",
    "p71_015",
    "p71_016",
    "p71_017",
    "p71_018",
    "cr_write_136"
   ],
   "note": "写作入行（v0.19.0）：副业写作留用拍立旗，r_book/end_bestseller 以此为证据门；CL-37 开线（v0.60.61）补登六个入行门 p71_013–018；CL-98（2026-11-11）原 p87_003 改挂转行通道、改号 cr_write_136，同位替换本行"
  },
  "nurse_work": {
   "setters": [
    "p21_072",
    "p40_021"
   ],
   "note": "医护·病房护士支（v0.19.0）：医院分科拍病房选项立旗。CL-04（v0.60.23）补登 pack40 分科转岗拍 p40_021"
  },
  "med_hosp": {
   "setters": [
    "p21_071",
    "p40_019",
    "p40_020"
   ],
   "note": "医院线入行（v0.19.0）：市医院招工培训拍立旗，影像/病房/药房三支共用此门。CL-04（v0.60.23）补登 pack40 两条入行拍 p40_019/020（公开招考/规培结业留院）"
  },
  "img_work": {
   "setters": [
    "p21_072",
    "p40_022"
   ],
   "note": "医护·影像科支（v0.19.0）：医院分科拍影像选项立旗，影像簇以此为门。CL-04（v0.60.23）补登 pack40 分科转岗拍 p40_022"
  },
  "heavy_work": {
   "setters": [
    "p20_004"
   ,
    "farm_township_back"
   ,
    "farm_exit_settle"
   ],
   "note": "重工业入行（v0.19.0）：进钢铁厂入行拍立旗，钢铁/油田支以此为门（工厂线支线）"
  },
  "dev_work": {
   "setters": [
    "p22_073",
    "p72_009",
    "p72_010",
    "p72_011",
    "p72_012",
    "p72_013",
    "p84_007",
    "p107_001",
    "p107_002"
   ],
   "note": "软件开发入行（v0.19.0）：c2000 软件公司入行拍立旗；CL-39 开线（v0.60.63）补登五门 p72_009–013；CL-94 补登运维专用两门 p107_001（网管门）／p107_002（系统集成门）"
  },
  "press_work": {
   "setters": [
    "p30_022",
    "p38_013",
    "p38_014",
    "p38_015",
    "p38_016",
    "p38_017",
    "cr_teach_106",
    "p89_009",
    "p89_010",
    "p89_011",
    "p89_012",
    "p89_013",
    "p89_014",
    "p89_015",
    "p89_016",
    "p89_017",
    "p89_018",
    "p89_019"
   ],
   "note": "报社入行（v0.19.0）：报社招工入行拍立旗（全池仅 p30_012 一条在行）。CL-02（v0.60.22）补登 pack38 五条入行拍 p38_013–017（公开招考/印刷厂学徒/转业分配/通讯员转正/都市报创刊招人）"
  },
  "driver_taxi": {
   "setters": [
    "p30_021",
    "p39_016",
    "p39_017",
    "p39_018",
    "cr_driver_taxi_026",
    "cr_driver_taxi_027",
    "cr_driver_taxi_029",
    "cr_driver_taxi_037"
   ],
   "note": "出租车入行（v0.19.0）：出租车公司招工入行拍立旗。CL-03（v0.60.24）补登 pack39 三条入行拍 p39_016–018（出租承包/退伍安置/网约车注册）"
  },
  "fin_work": {
   "setters": [
    "p18_021",
    "p74_008",
    "p93_004"
   ],
   "note": "证券柜台入行（v0.19.0，年代内小线）：营业部柜台留任选项立旗，仅 c1965 两条；CL-46 开线补登入职报到门 p74_008（公历窗 1990–2000，与 eraIn 扩代裁定配套）"
  }
 };

/* ---- v0.23 WP1 登记区（E11 枚举事实 / E5 examBand 分表 / E9 家庭事实旗与登记合入）----
   本段是 WP1 的登记骨架本体：枚举事实与家庭事实旗在此定版登记；各内容包的新登记不许改
   本文件，写独立登记数据文件（形状见文件头注释与 src/content/registry-v023.js），由本段
   尾部的合入器在加载期并入（同名先登记者胜）。 */

// 枚举事实（E11）：{ values 值集, host 宿主域（伴随字段的归属域，只作口径标注）, note }
// 缺省恒 absent（未发生）——S.facts 里无此键、或存档无 facts 容器，都按 absent 读。
window.GAME_REGISTRY.enumFacts = {
  "examBand": {
    "values": ["high", "mid", "low"],
    "host": "track",
    "note": "考试分数档（三档，v0.23 E5）：序章分岔拍内经考试场景由 rollExamBand（序章自有流）掷定；分布是设计参数、按代×处境分表登记在 examBandTables，无统计出处；band 只切第一次的单子、不锁终身（出口见蓝图 §3.2 总则④）"
  },
  "schoolingDepth": {
    "values": ["full", "cut", "none"],
    "host": "schooling",
    "note": "读到哪儿的深度标（v0.23 E6）：full=读完高中段 / cut=短读 / none=没读；不新开状态域，按枚举事实登记、validate-state 按值集校验；F55-a 写、F55-c 的高考门按 depth 划（不按 track）"
  },
  "siblingForm": {
    "values": ["sisterAndBrother", "only", "unspecified"],
    "host": "schooling",
    "note": "手足形（fix3 B1 子类 1b）：来历线的伴随事实——序章来历幕物化点由引擎按家底牌（cf_06=sisterAndBrother / cf_11=only）与开场白独生断言（originOpenAssert.only）定版写入，写手只有引擎；平年/处境幕的手足句一律按此事实分文，不再各自断言兄姐弟妹；旧档无此键按 absent 读、分文回落原文"
  },
  "sentdownForm": {
    "values": ["chadui", "changdui", "bingtuan"],
    "host": "track",
    "note": "下乡去向构成（三形，v0.23 F55-b 第二层掷定）：chadui=插队 / changdui=场队 / bingtuan=农场兵团；只对已下乡者掷，absent=没下乡（含留城与农村形）；决定 17–21 按轨分文与返城拍的出法"
  },
  "quotaHolder": {
    "values": ["mine", "sibling", "none"],
    "host": "track",
    "note": "顶替名额归属（v0.23 F65-a/L65-家）：只能由 L65-家的发放规则函数按已立家庭事实写，familyBeat 小应对的 effects/setFact 永远不许写它（validate-state 专门断言，E4）"
  },
  "studyForm": {
    "values": ["zhongzhuan", "putong"],
    "host": "track",
    "note": "玩家亲选的升学身份（v0.23 Q4 甲案）：zhongzhuan=中专形 / putong=普通高中形；与 PACK-SPEC 的 trackAlt（序章文本变体义）分家，两义不许混登记"
  },
};

// 家庭事实旗（familyFact）：familyBeat 与处境发放立的家庭层事实旗全量登记（E8 分根复制清单按此表逐项点名）。
// 旗本体仍是 S.flags 里的布尔旗；本表是「哪些旗算家庭事实」的单一事实源——新家庭旗先在此登记再写内容。
window.GAME_REGISTRY.familyFacts = {
  "famSplit55": { "beat": "L55-家", "note": "一家分两处（c1955）：大人调动/支援建设，孩子跟走或留亲戚家" },
  "originLB": { "beat": "L85-留/L95-留", "note": "留守来历（沿 PACK-SPEC 已定名）：父母外出，孩子留祖辈处；c1985/c1995 同名同义、参数分代" },
  "migrantExam": { "beat": "L95-考/L00-考", "note": "随迁升学议题已立：回原籍考还是留当地考，墙在升学端" },
  "famTight78": { "beat": "L78-家", "note": "家里的钱先紧起来（c1978）：父母下海/开店或下岗，紧的那一样落到孩子身上" },
  "famLaidOff85": { "beat": "L85-岗", "note": "你爸下岗（c1985，14–15 岁变体：厂子买断工龄）：家里的钱紧了，先紧孩子的哪一样" },
  "famArrears85": { "beat": "L85-岗", "note": "你爸的厂子发不出工资（c1985，11–13 岁变体）：停发、找零活，家里的钱紧了" },
  "famRestructure95": { "beat": "L95-婚", "note": "父母离异后的日常安排（c1995）：跟谁住的日常尺寸事实，克制写事不写惨" },
  "famCare00": { "beat": "L00-护", "note": "看护翻转预告（c2000）：祖辈住院，孩子第一次在病房跑腿" },
  "famSentdownEcho": { "beat": "L65-衔", "note": "兄姐下乡/返城的衔接记号（c1965，只作记号不立新线）：饭桌上少一副/多一副碗筷" },
  "movedHome78": { "beat": "L78-搬", "note": "小时候家里搬了家（c1978 搬家拍·搬支）：住处换了地方，落 residence 级记号；同拍也是分家预约源头（pendingSplit source=move）" },
  "stayedHome78": { "beat": "L78-搬", "note": "小时候家里商量过搬、最后没搬（c1978 搬家拍·不搬支）：住处没动，落 residence 级记号" },
  "movedHome00": { "beat": "L00-搬", "note": "小时候家里搬了家（c2000 搬家拍·搬支）：住处换了地方，落 residence 级记号；同拍也是分家预约源头（pendingSplit source=move）" },
  "stayedHome00": { "beat": "L00-搬", "note": "小时候家里商量过搬、最后没搬（c2000 搬家拍·不搬支）：住处没动，落 residence 级记号" },
  "split_moved": { "beat": "分家记账", "note": "分家记账（丙案第一步）：分家点来自童年搬家预约、且本命选了「不搬」那一支时，由 applySplitFactToShadow 在影子出生同拍标到影子轨的反面家庭事实——那条路上家里搬了。只作事实层记号，无任何内容门读取，不影响影子的人生走向；因立旗者是引擎代码而非内容条目，故登记在本表（家庭事实层）而非里程碑表" },
  "split_not_moved": { "beat": "分家记账", "note": "分家记账（丙案第一步）：分家点来自童年搬家预约、且本命经历了这场搬家时，由 applySplitFactToShadow 在影子出生同拍标到影子轨的反面家庭事实——那条路上家里没搬。只作事实层记号，无任何内容门读取，不影响影子的人生走向；登记归属同 split_moved" },
};

// examBand 分布表（E5）：按代 × 处境登记三档权重——设计参数，无统计出处（蓝图 §3.2 总则②注）。
// 本包只落 c2000 占位登记（精确值随各代包在其 CALIB 头定版后经登记数据文件合入同名键覆盖申请——
// 合入规则先登记者胜，故各代包的定版表须直接改本表对应键或在本文件登记，不走 extra 覆盖）。
window.GAME_REGISTRY.examBandTables = {
  "c2000": {
    "school": { "high": 45, "mid": 35, "low": 20 },
    "half": { "high": 25, "mid": 35, "low": 40 },
    "note": "c2000 定版（v0.23 WP5）：数值是设计参数、无统计出处；WP1 占位值经 WP5 定版确认不改、即为定版（定版对账见 registry-wp5.js 同值登记）。fix3 B1（子类 3a）：never 行删除——没进过校门的人不掷 band（与 c1985/c1995 口径对齐，另由 pr_fork16 的 bandSkipSchooling 在引擎侧兜底）"
  },
};

// 登记数据文件合入（E9）：window.GAME_REGISTRY_EXTRA 是各内容包登记数据文件 concat 出的数组，
// 加载位在 state.js 之前、registry.js 之前（index.html / sim / 各校验工具同序）。同名键先登记者胜：
// 本体登记优先，extra 只补本体没有的键——防内容包静默覆盖 WP1 定版口径。
(function mergeRegistryExtra() {
  const REG = window.GAME_REGISTRY;
  for (const x of window.GAME_REGISTRY_EXTRA || []) {
    if (!x) continue;
    for (const [k, v] of Object.entries(x.milestones || {})) if (!(k in REG.milestones)) REG.milestones[k] = v;
    for (const [k, v] of Object.entries(x.enumFacts || {})) if (!(k in REG.enumFacts)) REG.enumFacts[k] = v;
    for (const [k, v] of Object.entries(x.familyFacts || {})) if (!(k in REG.familyFacts)) REG.familyFacts[k] = v;
    for (const [k, v] of Object.entries(x.examBandTables || {})) if (!(k in REG.examBandTables)) REG.examBandTables[k] = v;
    if (x.trades) { REG.trades = REG.trades || {}; for (const [k, v] of Object.entries(x.trades)) if (!(k in REG.trades)) REG.trades[k] = v; } // 第 1 期 P1-1：行当注册表（src/content/trades.js）合入，本体无 trades 登记、恒由 extra 补入
  }
})();
