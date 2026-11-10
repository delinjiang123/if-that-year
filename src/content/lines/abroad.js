// [M1-B 内容重组] 本文件现位于 src/content/lines/abroad.js（按领域重组搬入），除本行外内容一字未动。
// 扩展包 37（v0.19.0）：出国路线正文包——国家原型（abroadKind）× 早/中/晚三段。
// 正文只写原型属性（离家多远、能不能长住、当地话这道墙多高、回来一趟多贵），不写具体国名；
// 入口拍 proc_abroad_kind 为 procOnly，只由引擎进程在 22–26 岁呈现，落 abroadKind 值；
// 未落值（含旧存档）由引擎 settleAbroadDefault 补推断。年代口径：主体 c1978/c2000，c1965 少量，c1955 不进本包。
// v0.23 WP6（abroad 年代门审计落地，蓝图 §3.1/WP6 第 5 条）：c1955/c1965 的 abroad 事件面只许
// 培训/进修/劳务协作（dispatch）形——① dispatch 形既有条目（ab37_005/014/023）eraIn 补进 c1955，
// 通信/汇款两条（ab37_007/009）补 c1955 并给信件口吻的 textEra；② 入口拍新增「派出去进修」选项
// （c1955/c1965 专属、落 dispatch），原移民/定居形三选项（anglo/eastasia/europe）加选项级 eraIn
// （c1978+ 才亮）。注意：选项级 eraIn 的呈现过滤在 renderProcItem/resolveProcHeadless（现行只过滤
// deferDating），须配合补丁稿 work/wp6-parents-patch.md 与 work/wp6-shadow-life-patch.md 合并后才
// 在呈现层生效；inferAbroadDefault 的年代权重另见 work/wp6-place-patch.md。审计逐条清单落
// sim-v023/logs/wp6/abroad-audit.md。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
  // —— 入口拍：去向（22–26 岁，route=abroad） ——
  { id: "proc_abroad_kind", min: 22, max: 26, procOnly: true, route: "abroad", text: "能去的地方摆在你面前，不止一个。每个地方脾气不一样，往后要过的日子，也就跟着两样。这一回，你往哪边去。",
    textEra: { c1955: "单位里传下消息：有个出去的名额。去处不多，路子就那么两条，名额还得争。这一回，你想走哪条。", c1965: "出去的名额落到单位头上。能走的路子不多，多半是跟着项目走，或是派出去学东西。这一回，你想走哪条。" },
    choices: [
      { label: "去远的那个地方，住下就不走了", eraIn: ["c1978", "c1985", "c1995", "c2000"], setState: { abroadKind: "anglo" }, effects: { growth: 3, freedom: 2, money: -2 }, echo: "落地的地方离家很远。住下来的路很长，得一年一年攒。头一件事，是把当地话学利索。" },
      { label: "去离家近的，想回就回", eraIn: ["c1978", "c1985", "c1995", "c2000"], setState: { abroadKind: "eastasia" }, effects: { money: 1, relation: 1, growth: 2 }, echo: "离家近，逢年过节回得去。字大半认得，话还得慢慢学，规矩也得慢慢摸。" },
      { label: "去日子慢、假期多的地方", eraIn: ["c1978", "c1985", "c1995", "c2000"], setState: { abroadKind: "europe" }, effects: { freedom: 3, health: 1, money: -1 }, echo: "那边的日子过得慢，税扣得重，假给得足。当地话难学，急不得。" },
      { label: "跟着项目出去挣钱，干完就回来", setState: { abroadKind: "dispatch" }, effects: { money: 4, health: -2, freedom: -1 }, echo: "合同签了几年，住处跟着项目走。钱是多，就是哪儿都住不长，行李不敢全拆开。" },
      { label: "跟着单位派出去进修，学完回来", eraIn: ["c1955", "c1965"], setState: { abroadKind: "dispatch" }, effects: { growth: 3, money: 1, relation: -1 }, echo: "名额是单位争来的，先学话，再学技术。走之前把家里的事安顿好，回来还回原单位。" },
    ] },
  // —— 早段（22–34）：落地、当地话、第一份活、身份节点 ——
  { id: "ab37_001", w: 2, min: 22, max: 27, route: "abroad", eraIn: ["c1978", "c2000"], text: "落地那天，箱子摊在出租屋的地板上，半箱子药、一包底料、一件厚外套。窗外黑得早，楼下店都关了。你把被子抖开，先睡了一觉，醒来才想起还没给家里报平安。",
    effects: { health: -1, relation: 1 } },
  { id: "ab37_002", w: 2, min: 23, max: 31, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: ["anglo", "europe"] }, text: "语言班在社区楼里，一周三晚。老师把一句话拆成三截教，你们跟着念，念到第三遍还是有人把尾音吞掉。课后你去超市，收银员说得快，你只听懂了价钱那一段。",
    effects: { growth: 2 } },
  { id: "ab37_003", w: 2, min: 23, max: 31, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "eastasia" }, text: "街上的字大半认得，话一出口就露馅。房东交代垃圾怎么分，说了五分钟，你记住三样，剩下的第二天又去问。对方笑笑，拿笔给你画在纸上，贴在门后。",
    effects: { growth: 2, relation: 1 } },
  { id: "ab37_004", w: 2, min: 23, max: 30, route: "abroad", eraIn: ["c1978", "c2000"], text: "第一份活是熟人介绍的，在后厨帮工，钱按周结。头一周你切坏了两筐菜，领班没骂，把刀换了把钝的给你，说先练手，别练到手上。周末结钱，数了两遍，先把房租留出来。",
    effects: { money: 2, health: -1 } },
  { id: "ab37_005", w: 2, min: 23, max: 32, route: "abroad", eraIn: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"], state: { abroadKind: "dispatch" }, text: "项目上的住处是排房，一间住四个人，床挨着床。食堂几点开饭，澡堂几点有热水，墙上都贴着。钱按月打回卡里，比在家里多不少，就是出了营地没处去，晚上只能在院里转圈。",
    effects: { money: 3, freedom: -2, health: -1 } },
  { id: "ab37_006", w: 2, min: 24, max: 33, route: "abroad", eraIn: ["c1978", "c2000"], text: "头一回续身份，材料要得细：雇主的信、住处的合同、这几个月的工资单。你跑了三趟，第三趟窗口的人把清单划掉最后一项，说齐了。你站在门口把回执看了两遍，才敢往回走。",
    effects: { growth: 1, wisdom: 2 } },
  { id: "ab37_007","stateAll":{"mom":"alive"}, w: 2, min: 24, max: 34, route: "abroad", eraIn: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"], text: "给家里打电话要算着时差，也算着话费。你妈接起来先问吃没吃，你说吃了，其实刚下班，锅还没热。聊到最后，她说家里都好，你别惦记。你挂了电话，在本子上把下回要说的事记下来，怕再打时又忘。", textEra: { c1955: "往家里写信要算着邮路，一封信走一个多月。你把要说的事先记在本子上，怕提笔时又忘。信里只报平安，末了添一句：家里别惦记。回信到时，你已经把寄出去的那封背下来了。", c1995: "跟家里视频要算着时差，也得等家里那边有网、得空的时候。你妈接起来先问吃没吃，你说吃了，其实刚下班，锅还没热。聊到最后，她说家里都好，你别惦记。挂了之后，你把下回要说的事记在手机备忘里，怕再聊时又忘。", c2000: "跟家里视频要算着时差，也得等家里那边有网、得空的时候。你妈接起来先问吃没吃，你说吃了，其实刚下班，锅还没热。聊到最后，她说家里都好，你别惦记。挂了之后，你把下回要说的事记在手机备忘里，怕再聊时又忘。" },
    effects: { relation: 2, money: -1 } },
  { id: "ab37_008", w: 2, min: 24, max: 32, route: "abroad", eraIn: ["c1978", "c2000"], text: "合租的屋子四个人，水电按人头摊。厨房排班表贴在冰箱上，谁的锅没刷，红笔圈出来。头一个月你圈了别人两次，自己被圈了一次。慢慢地，几个人凑钱买了口大锅，周末轮着做一顿家里的菜。",
    choices: [
      { label: "把规矩认下来，住得久些", effects: { relation: 2 }, echo: "排班表换了三张，锅一直没换。后来有人搬走，新来的人先看的就是那张表。" },
      { label: "攒钱，年底换个单间", effects: { money: 1, freedom: 1 }, echo: "你开始把零钱单独放一个信封，信封上写着房租，别的钱谁也不许动。" },
    ] },
  { id: "ab37_009","stateAll":{"mom":"alive"}, w: 2, min: 25, max: 34, route: "abroad", eraIn: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"], text: "第一次往家汇款，单子填了四遍，手续费扣得你心疼。你妈收到后打电话来，说数对上了，又说家里不缺钱，让你留着自己花。你说这边够用。挂了电话，你把汇款的回执夹在证件里，没舍得扔。", textEra: { c1955: "第一次往家汇款，单子填了四遍，手续费扣得你心疼。家里回信说数对上了，又说不缺钱，让你留着自己花。你把汇款的回执夹在证件里，没舍得扔。", c1995: "第一次用手机往家转钱，验证码等了两回，账号输错一位退了回来，又赶上当天限额，只能先转一半，手续费扣得你心疼。你妈收到后打电话来，说数对上了，又说家里不缺钱，让你留着自己花。你说这边够用。挂了电话，你把转账记录截了图，存进相册里，没舍得删。", c2000: "第一次用手机往家转钱，验证码等了两回，账号输错一位退了回来，又赶上当天限额，只能先转一半，手续费扣得你心疼。你妈收到后打电话来，说数对上了，又说家里不缺钱，让你留着自己花。你说这边够用。挂了电话，你把转账记录截了图，存进相册里，没舍得删。" },
    effects: { relation: 2, money: -2 } },
  { id: "ab37_010", w: 2, min: 24, max: 33, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: ["anglo", "europe"] }, text: "冬天的黑来得早，下午四点多天就暗了。屋里取暖费贵，你裹着毯子看书，隔壁的老人敲门，送来一碗汤，说天冷，喝点热的。你把碗洗好送回去，顺手帮对方把门口的雪铲了。",
    effects: { relation: 2, health: -1 } },
  // —— 中段（35–56）：扎根或漂着、与父母的距离 ——
  { id: "ab37_011", w: 2, min: 35, max: 48, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "europe" }, text: "在这边住下些年，日子慢是真慢：信要等，事要约，急也急不来。税从工资里扣一大截，可生病了去看，账单没你想的吓人。放假的日子多，你学会了提前三个月订票，回一趟家。",
    effects: { freedom: 2, wisdom: 2 } },
  { id: "ab37_012", w: 2, min: 36, max: 50, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "anglo" }, text: "长住的手续走到最后一段，材料按年份订了三本。窗口的人翻得很快，说还差一份早年的税单。你回家翻箱子，在旧行李的夹层里找着了。那天晚上，你给自己煮了碗面，加了个蛋。",
    effects: { growth: 1, freedom: 2 } },
  { id: "ab37_013", w: 2, min: 35, max: 48, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "eastasia" }, text: "离家近的好处，过年最明显：别人还在算假，你拎个包就回了，初五再赶回来上班，误不了事。这几年你攒下的钱大半换成了家里的东西：给爸妈换的热水器、修的屋顶，票据都在抽屉里。",
    effects: { relation: 2, money: 1 } },
  { id: "ab37_014", w: 2, min: 36, max: 50, route: "abroad", eraIn: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"], state: { abroadKind: "dispatch" }, text: "第二个项目又签了，还是排房、食堂、按月打钱。家里问你什么时候是个头，你说干完这个项目就回。话说了两年，项目一个接一个。你把挣的钱大半寄回去，自己的行李还是那两箱。",
    effects: { money: 3, relation: -1 } },
  { id: "ab37_015", w: 2, min: 38, max: 52, route: "abroad", eraIn: ["c1978", "c2000"], anyParentAlive: true, stateAll: { dad: "alive", mom: "alive" }, text: "你妈在电话里说，你爸最近上楼要歇两回。你问要不要回去看看，她说不用，先忙你的。挂了电话你坐了很久，把接下来三个月的假都查了一遍，又把机票的价格看了两回。",
    effects: { relation: 1, wisdom: 2 } },
  { id: "ab37_016", w: 2, min: 44, max: 56, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: ["anglo", "europe"] }, stateAll: { dad: "alive" }, text: "你爸住院的消息传过来时，你这边是半夜。请假的信写好了又删，机票改签的费用比平时贵一截。最后你先把钱打回去，请了护工，自己订了最近的一班。",
    choices: [
      { label: "订最近的一班，赶回去", effects: { money: -4, relation: 3 }, echo: "赶到病房时他刚睡醒，看见你，先问你吃饭了没有。你说吃了，其实一路没顾上。" },
      { label: "先请护工盯着，过几天再回", effects: { money: -2, relation: 1 }, echo: "护工每天发来消息，几点吃的药、睡得怎么样。你盯着手机，心里还是悬着。" },
    ] },
  { id: "ab37_017", w: 2, min: 42, max: 54, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "eastasia" }, stateAll: { mom: "alive" }, text: "你妈说想来你这边住一阵，看看你过得怎么样。离得近，票好买，她拎着一箱吃的就来了。住了一周，她把你的厨房摸了个遍，说你这锅该换了。走时她说，知道你过得还行，她就放心了。",
    effects: { relation: 3, money: -1 } },
  { id: "ab37_018", w: 2, min: 38, max: 50, route: "abroad", eraIn: ["c1978", "c2000"], text: "这些年活换了几份，住处搬了四回，箱子越搬越少。在这边认识的人，来来去去，有的回了国，有的去了别的城市。你过生日那天，收到七八条消息，人一个没在跟前。你下楼买了块蛋糕，自己吃了两块。",
    effects: { freedom: 1, wisdom: 2 } },
  { id: "ab37_019", kidAgeMin: 5, kidAgeMax: 7, w: 2, min: 36, max: 50, route: "abroad", eraIn: ["c1978", "c2000"], state: { kids: "has" }, text: "孩子到了上学的年纪，这边的学校怎么进、学什么，你和另一半打听了半个月。名单贴出来那天，你在人群里踮着脚找名字，找着了，回家的路上买了个新书包，孩子背着不肯摘。",
    effects: { relation: 2, money: -2 } , stateAll: { spouse: "partnered" }},
  { id: "ab37_020", w: 2, min: 45, max: 55, route: "abroad", eraIn: ["c1978", "c2000"], text: "留还是回，这一年被问了不下十回。你把两边的账摊在桌上算：这边的住处和活，那边的父母和老同学，孩子往后在哪儿。算到半夜，纸写满了，结论没有。另一半说，先过日子吧，账慢慢算。",
    choices: [
      { label: "先留下来，往长住上再走一步", effects: { freedom: 1, wisdom: 2 }, echo: "你把续手续的日子标在日历上，红笔圈了两圈。这事定下来，心里反倒安静了。" },
      { label: "开始为回去做准备", effects: { growth: 2, money: -1 }, echo: "你把国内老同学的联系方式挨个找回来，先问问那边的活好不好找。" },
    ] , stateAll: { spouse: "partnered" }},
  // —— 晚段（55–80）：去留节点、退休落点 ——
  { id: "ab37_021", w: 2, min: 58, max: 70, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "anglo" }, text: "退下来的事提上日程，你算了算在这边住的年头，比在家乡住的还长了。这边的诊所、超市、常走的那条路，都熟得不能再熟。你跟另一半说，落叶落在哪儿，有时候不是自己说了算的。",
    effects: { wisdom: 3, freedom: 1 } , stateAll: { spouse: "partnered" }},
  { id: "ab37_022", w: 2, min: 58, max: 70, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: "europe" }, text: "这边退下来的日子，慢有慢的过法：假多，事少，社区的活动排得满。你报了个园艺的班，种出来的东西分给邻居。就是冬天的黑还是长，屋里得早早开灯。",
    effects: { health: 1, relation: 1 } },
  { id: "ab37_023", anyFamilyAlive: true, w: 2, min: 55, max: 66, route: "abroad", eraIn: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"], state: { abroadKind: "dispatch" }, text: "最后一个项目结了，合同到期，行李还是那两箱，就是人比来时老了。这些年挣的钱，大半在家里：房子修了，孩子的事帮了，存折上还剩一笔。你站在营地门口等车，想着回去先睡个整觉。",
    choices: [
      { label: "回了，往后就在家过", effects: { health: 2, relation: 2 }, set: "back_home_stay", echo: "到家那晚，饭是家里人留的，热了三遍。你说还是家里的床睡得沉。" },
      { label: "歇半年，看看还有没有短活", effects: { money: 2, health: -1 }, echo: "电话留给了项目上的人。真有电话来时，你犹豫了半天，最后还是没接。" },
    ] },
  { id: "ab37_024", w: 2, min: 60, max: 72, route: "abroad", eraIn: ["c1978", "c2000"], stateAll: { spouse: "partnered" }, text: "回去过晚年的念头，这一年冒出来好几次。这边住惯了，那边人熟。老同学在电话里说，回来吧，院子里的菜给你留着。你把这事跟另一半说了，两个人谁也没先拍板，先把两边的房子都收拾了一遍。",
    choices: [
      { label: "回去，往后的日子在老家过", effects: { relation: 3, money: -2 }, set: "back_home_stay", echo: "走那天，邻居来送，塞给你一包自己种的豆子，说到了那边种上，算个念想。" },
      { label: "还是留下来，这边也是家了", effects: { freedom: 2, wisdom: 2 }, echo: "你把阳台收拾出来，种了两盆家里那边的菜。长出来时，你拍了照片发回去。" },
    ] },
  { id: "ab37_025", w: 2, min: 58, max: 72, route: "abroad", eraIn: ["c1978", "c2000"], text: "老同学建了群，把散在各地的人都拉了进来。过年时群里发老照片，你年轻时站在宿舍门口，瘦得风一吹就倒。你把照片存下来，放大看了很久，才认出旁边那个人是谁。",
    effects: { relation: 2, wisdom: 2 } },
  { id: "ab37_026", w: 2, min: 60, max: 72, route: "abroad", eraIn: ["c1978", "c2000"], text: "两边的钱要归拢了：这边的养老钱按月打，那边还留着一份。你拿个本子记着，哪个月换多少、哪笔留着探亲用，汇率涨了跌了，你不跟着动。记满一页，合上本子，日子照过。",
    effects: { money: 1, wisdom: 2 } },
  { id: "ab37_027", anyFamilyAlive: true, w: 2, min: 68, max: 80, route: "abroad", eraIn: ["c1978", "c2000"], text: "在这边住了大半辈子，常去的诊所医生换了第二任，超市的收银员见你就打招呼。你过日子用的词，一半是这边的，一半是家里的，混着说，家里人打电话来，有时还得停下来想想。",
    effects: { wisdom: 3, relation: 1 } },
  { id: "ab37_028", w: 2, min: 66, max: 78, route: "abroad", eraIn: ["c1978", "c2000"], state: { abroadKind: ["anglo", "eastasia", "europe"] }, text: "这一趟回国，你把行李减到最小：换洗衣服、常吃的药、给老同学带的点心。飞机上你睡得少，想着要见的人，名单在心里排了一遍，有两个已经见不着了。落地时天刚亮，你在出口站了会儿，往外走。",
    effects: { relation: 2, health: -1 } },
]);
