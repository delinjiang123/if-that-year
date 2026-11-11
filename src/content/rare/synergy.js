// [M1-B 内容重组] 本文件现位于 src/content/rare/synergy.js（按领域重组搬入），除本行外内容一字未动。
// 《如果那年》协同组合与稀有系统数据 v1（设计：docs/SYNERGY-AND-RARE-ENDINGS.md）
// combos：多标记组合事件，进普通池；rare：条件+骰子双门，含轨迹链（traj_*）；endings：65 岁特殊结局评定。
// endings.evidence（v0.17.0，F1/F4）：每条结局声明证据组（组内任一命中算一点，备选项可为事件/稀有/旗标 id 或 {stat} 数值门），
// 结算时除 met() 条件外还须凑满 2 个独立证据点才落定；凑不满就不出，宁可没有特殊结局。口径见 docs/DESIGN-FOUNDATION-V2.1.md §4.6。
// 红线：不涉政（无官职/党派/选举/军队；校长、院士、行业标准、企业家、作家为民间/学术/市场荣誉）；
//       不玄幻（神药=真实新药研发获批；彩票概率如实极低）；稀有不等于高贵，文案不贬低普通活法。
window.GAME_SYNERGY = {
  combos: [
    { id: "cb_family3", kidAgeMin: 3, kidAgeMax: 6, all: ["bought_house"], stateAll: { spouse: "partnered", kids: "has" }, min: 40, max: 55, text: "周六早上，孩子在客厅地板上搭积木，搭到第三层塌了，又从头来。对方在厨房煎蛋，鸡蛋是昨晚超市买的，一盒12个，小票上18块9，够吃四天。你在阳台给那盆薄荷浇完水，把水壶放回窗台。早饭三个人吃了二十分钟，煎蛋有点糊。", effects: { relation: 3, health: 1 } },
    { id: "cb_solo_free", stateAll: { spouse: "single" }, stats: [{ k: "freedom", gt: 68 }], min: 40, max: 58, text: "你一个人去看了场午夜场电影，会员票 45，座位随便挑，你坐了正中间。散场时整条街都是刚下班的年轻人，你在路边摊买了份炒粉，15 块，加了个蛋，边走边吃，到家十二点四十。", effects: { freedom: 2, health: 1 } },
    { id: "cb_care_near", all: ["care_self", "near_family"], stateAll: { dad: "alive" }, min: 53, max: 64, text: "父亲半夜胃不舒服，电话打过来，你开车七分钟就到了。急诊抽血、做心电图，折腾到凌晨三点，医生说先留观。你在走廊的自助机上交了 480，自费部分。他看见缴费单，先说的是：把你折腾起来了。你说，没事，我住得近。", effects: { relation: 3, health: -1 } },
    { id: "cb_dink_plan", stateAll: { spouse: "partnered", kids: "none" }, ctx: { house: "owned" }, stats: [{ k: "money", gt: 58 }], min: 44, max: 58, text: "你和对方把养老的账认真算了一遍，列了张表：养老金还要交几年、存款够花几年、现在这套小房子的月供还剩多少。算完你们去吃了顿火锅，两个人 178。计划表压在茶几玻璃板下面，压了两年，一直没动过。", effects: { money: 1, freedom: 2 } },
    { id: "cb_old_couple", all: ["retired_full"], stateAll: { spouse: "partnered" }, min: 59, max: 64, text: "退休后第一个长假，你和对方报了个慢团，六天，一个人 4200，全程没赶过景点，中午还回酒店睡午觉。团里另一对老夫妻跟你们拼了四次饭，散团那天互相加了微信，约好明年还走这一条线。", effects: { relation: 2, health: 2, money: -2 } },
    { id: "cb_sandwich", kidAgeMin: 6, kidAgeMax: 15, all: ["care_self"], stateAll: { kids: "has", dad: "alive" }, min: 53, max: 60, minYear: 2013, text: "这一天你两头跑：上午请了半天假，去学校坐最后一排开家长会；下午赶到医院，父亲的复查号是提前一周在手机上抢的，取报告、排队缴费，来回打车 63。晚上回家，你把成绩单和复查单夹进同一个文件夹，放在抽屉第二层。", effects: { relation: 2, health: -2 } },
    { id: "cb_rent_free", all: ["renting", "less_work"], ctx: { house: "renting" }, stats: [{ k: "freedom", gt: 63 }], min: 45, max: 60, minYear: 2012, text: "房东在微信上问：续三年就不涨租，续一年要涨 100。你回：先续一年吧。签完你把合同塞进抽屉，抽屉里还有前两年的合同，三份叠在一起，租金那一栏一年比一年高一点。你给阳台那几盆花浇了水，明年住哪，到时候再说。", effects: { freedom: 2, wisdom: 5 } },
    { id: "cb_hop_viral_base", ctx: { form: ["employee", "public"] }, all: ["job_hop", "side_start"], min: 30, max: 45, minYear: 2016, text: "跳槽面试聊到一半，面试官把手机转过来：这个账号也是你做的？那是你下班更新的小账号，粉丝不多，置顶那条有两万多播放。后面又聊了四十分钟，聊的全是它，岗位本身只占了十分钟。临走对方说，账号别停更。", effects: { growth: 2, relation: 1 } },
  ],
  rare: [
    // —— 创业轨迹链：side_start + side_job 凑齐 build，三环骰子相乘 ——
    { id: "r_startup",ctx: { form: ["employee","public"] }, label: "副业超过工资那晚", clue: "白纸摊在书桌上，只写了一行字的人。", min: 38, max: 50, all: ["side_start", "side_job"], chance: 0.05, text: "副业的收入第一次超过工资。晚上你坐在书桌前，面前摊着一张白纸，上面就写了一行：要不要把它当正事干？",
      choices: [
        { label: "干。辞职，全职做这件事", effects: { money: -6, growth: 5, freedom: 4 }, set: "traj_startup", echo: "离职那天你把工牌交了，保安说：慢走。你走出大楼，脚步比上班时快。" },
        { label: "再稳一年，副业先养着", effects: { freedom: 1, money: 2, wisdom: 3 }, echo: "白纸被收进抽屉。这个念头没死，只是睡下了。" },
      ] },
    { id: "r_funding", label: "投资人那杯咖啡", clue: "咖啡喝了两个小时，听完一句『没有回头路』的人。", min: 40, max: 55, chain: "r_startup", require: "traj_startup", chance: 0.055, text: "投资人约你喝咖啡，聊了两个小时。临走他说：钱可以投，但你要想清楚，拿了钱就没有回头路了。",
      choices: [
        { label: "拿。把盘子做大", effects: { money: 10, growth: 3, health: -3 }, set: "traj_funded", echo: "签完协议那晚你失眠了。账户里的数字变多了，肩上的东西也变重了。" },
        { label: "不拿。慢慢长大也行", effects: { money: 3, freedom: 2, wisdom: 5 }, echo: "公司不大，但每一分钱都是自己挣的。你睡了个好觉。" },
      ] },
    { id: "r_ipo", label: "敲钟那天", clue: "西装衬衫是前一天熨好的，锣声里站着不动的人。", min: 45, max: 60, chain: "r_funding", require: "traj_funded", stats: [{ k: "money", gt: 54 }], chance: 0.05, text: "敲钟那天，你西装里的衬衫是对方前一天熨的。锣声一响，身边的人都在喊，你站在原地，想起了书桌前那张白纸。", effects: { money: 25, growth: 3 }, set: "traj_ipo" },
    // —— 神药轨迹链：study 路线 + 高成长 ——
    { id: "r_drug1", ctx: { eduGate: true, gradGate: true }, label: "十年起步的课题", clue: "在实验记录本第一页写下日期，说『那就十年』的人。", min: 30, max: 42, route: "study", stats: [{ k: "growth", gt: 61 }], chance: 0.022, text: "你牵头的课题立项了：一种针对罕见病的药。评审专家说，这条路线很难，十年起步。你说，那就十年。",
      choices: [
        { label: "接。十年就十年", effects: { growth: 5, money: -2, health: -2 }, set: "traj_drug1", echo: "实验室的灯，那天亮到很晚。你在实验记录本的第一页写了日期。" },
        { label: "换个容易出成果的题目", effects: { growth: 2, money: 2 }, echo: "新题目稳妥得多。只是有时候路过那间实验室，你会慢下来。" },
      ] },
    { id: "r_drug2", label: "二期数据出来那天", clue: "实验室里先没人说话、然后有人哭了的那天，在场的人。", min: 36, max: 52, chain: "r_drug1", require: "traj_drug1", chance: 0.025, text: "临床二期的数据出来那天，实验室里先是没人说话，然后有人哭了。有效。真的有效。你给家里打电话，只说了一句：今晚早点回，有好消息。", effects: { growth: 5, relation: 2 }, set: "traj_drug2" },
    // —— 校长轨迹链：home 路线，早年分到学校 ——
    { id: "r_school1", ctx: { entry: true }, label: "考进县一中", clue: "报到那天，被老校长指着操场说话的人。", min: 23, max: 30, route: "home", chance: 0.05, set: "teach_work", text: "县一中招老师，你考上了。报到那天，老校长指着操场说：这学校比你岁数大，好好干。往后的日子，就围着这所学校转了。",
      choices: [
        { label: "留下教书，先把课讲好", effects: { relation: 3, growth: 2 }, set: "traj_school", echo: "你的第一堂课，紧张得粉笔都拿反了。最后一排的男生憋着笑，憋得很辛苦。" },
        { label: "先干着，以后再说调动", effects: { growth: 1 }, echo: "调动的事后来没人再提。课倒是越讲越顺。" },
      ] },
    { id: "r_school2", label: "站上开学典礼台下", clue: "推了两次没推掉，站到台下看一操场学生的人。", min: 34, max: 50, chain: "r_school1", require: "traj_school", stats: [{ k: "relation", gt: 54 }], chance: 0.019, text: "学校让你当教导主任。你推了两次没推掉。开学典礼上你站在台下，看着一操场的学生，忽然想起自己报到那天。", effects: { relation: 3, growth: 2 }, set: "traj_vp" },
    // —— 写作 / 流量轨迹 ——
    { id: "r_book", label: "编辑找上门", clue: "合同薄薄几页，在家里看了三遍的人。", min: 33, max: 55, all: ["side_start", "write_work"], stats: [{ k: "growth", gt: 65 }], chance: 0.008, text: "出版社的编辑找到你，说你陆续写的那些东西，想结集出本书。合同寄到家里，薄薄几页，你看了三遍。", effects: { growth: 3, money: 2 }, set: "traj_book" },
    { id: "r_viral", label: "一夜六个零", clue: "早上醒来，手机烫得像块铁的人。", min: 30, max: 50, minYear: 2016, all: ["side_start", "side_job"], chance: 0.012, text: "你随手发的一条视频，第二天早上醒来，播放量后面跟了六个零。手机烫得像块铁，一整天都在震。", effects: { money: 6, relation: 2, health: -2 }, set: "traj_viral" },
    // —— 学术荣誉 ——
    { id: "r_award",ctx: { form: ["employee","public"] }, label: "提名名单上有你", clue: "横幅拉起来，路过时放慢脚步的人。", min: 46, max: 62, stats: [{ k: "growth", gt: 84 }], chance: 0.02, text: "提名名单公布，你的名字在里面。单位拉了条横幅，你有点不好意思，但路过的时候，还是放慢脚步看了一眼。", effects: { growth: 3, relation: 2 }, set: "traj_award" },
    // —— 独立稀有点 ——
    { id: "r_lottery", label: "楼下中了头奖", clue: "楼下彩票站贴出红纸那天，名字没写、照常去上班的人。", min: 23, max: 60, chance: 0.00015, text: "楼下彩票站贴了张红纸：本站中出头奖。名字没写，但你知道是你——那组号码，是你随手写的生日组合。税后的钱到账那天，你照常去上了班。", effects: { money: 40 }, set: "traj_lottery" },
    { id: "r_patent", label: "小专利卖了个好价", clue: "捣鼓了两年的方案，被人找上门来买的人。", min: 32, max: 55, stats: [{ k: "growth", gt: 71 }], chance: 0.015, text: "你业余捣鼓出来的一个小专利，被一家公司看上了，开价比你想的高得多。签约的时候对方说：我们找这个方案找了两年。", effects: { money: 14, growth: 2 } },
    // CL-112（CL-109 §五改造）：拆迁落点环——原一拍抽奖（chance 0.015／窗 40–60／无年代门）改两环：
    // 落点只落链旗 traj_oldhouse，钱/房的大头与 traj_windfall 都在坐实环 r_oldhouse_move（表末追加）；
    // 年代门 minYear 2003（城市更新成规模的起点），routeIn 补 farm 成六线（城乡两形同门：近郊老家
    // 与老城老屋都靠 near_family 这一「住在家人近处、老家那片还在」的事实代理）；补偿不写具体数字。
    // 选房档不接 bought_house：captureHouse 只认第一套且按工资档定价收首付，安置房不是买房，
    // 硬接会把回迁房写成商品房/房改房（机制核查见 CL-112 REPORT）——选房只给过渡钱、
    // 房的去向在本拍回响与坐实环文本里交代（等回迁、搬回老地方住），不悬空。
    { id: "r_oldhouse", label: "那片要动了", clue: "丈量那天站在自家门口，看人往墙上写号的人。", min: 38, max: 58, any: ["near_family"], routeIn: ["home", "corp", "abroad", "study", "gap", "farm"], minYear: 2003, chance: 0.007, text: "老家那片要动了。消息先在街坊之间传，后来街道的人来丈量，邻居都在场，墙上写了号。协议摆在你面前，签之前得先选一样：要钱，还是要安置房。",
      choices: [
        { label: "要钱。利落，往后自己安排", effects: { money: 10, freedom: 1 }, set: "traj_oldhouse", echo: "签完字，你在老屋门口站了一会儿，拍了张照。钱到账那天，你请老邻居吃了顿饭。" },
        { label: "要房。等回迁，还住回这片", effects: { money: 3, relation: 1 }, set: "traj_oldhouse", echo: "先搬出去租着，等那片盖回来。房的去向就这么定下了：不换地方，盖好了搬回去住。" },
      ] },
    { id: "r_marathon", label: "年龄组第一名", clue: "冲线时计时员愣了一下，又看了一眼号码布的人。", min: 52, max: 64, stats: [{ k: "health", gt: 74 }], chance: 0.05, text: "城市马拉松，你拿了年龄组的第一名。冲线的时候计时员愣了一下，看了看你的号码布，又看了看你。", effects: { health: 3, freedom: 2 }, set: "traj_champ" },
    { id: "r_rescue","stateAll":{"mom":"alive"}, label: "河边救起一个人", clue: "救完人发现鞋掉了一只，母亲把新闻存进手机的人。", min: 28, max: 55, minYear: 2008, chance: 0.002, text: "河边有人落水，你跳下去了。人救上来的时候你才发现自己鞋掉了一只。本地新闻播了四十秒，母亲把那段视频存在手机里，给亲戚挨个看。", effects: { relation: 5, health: -2 } },
    { id: "r_antique", label: "旧瓷瓶擦不得", clue: "被告知『别擦了，这个擦不得』之后，把房顶修了的人。", min: 35, max: 60, chance: 0.003, text: "清理老柜子时翻出个旧瓷瓶，拿去给懂行的人看了一眼。对方戴上眼镜看了很久，说：别擦了，这个擦不得。后来它拍出去的钱，正好够把老房的房顶修了。", effects: { money: 8 } },
    // —— v0.11.0 新增：五条轨迹链（各挂一个新结局，立旗事件本身都带代价）——
    { id: "r_teacher_students",ctx: { mainLine: "teach_work" }, label: "学生回来当同事", clue: "把磨毛了边角的备课本，借给三个后辈传看的人。", min: 44, max: 55, chain: "r_school1", require: "traj_school", chance: 0.03, text: "教了这么多年书，你带过的一届学生里，有三个考回县里当老师，一个就分在你隔壁办公室。期中考试前，三个人抱着教案来问你压轴题怎么讲。你把当年的备课本找出来，边角都磨毛了，借给他们传看。你自己掏钱给班里印卷子，已垫了600多。", effects: { relation: 4, growth: 2, money: -3, health: -1 }, set: "traj_taoli" },
    { id: "r_craft_apprentice",ctx: { mainLine: ["craft_work","factory_work"] }, label: "车间里收徒弟", clue: "徒弟车废了工件，站在旁边没吭声的人。", min: 40, max: 55, any: ["took_over_job", "p20_cnc_retrain"], chance: 0.025, text: "你在机床边站了二十多年。这天车间主任领来个刚满十八岁的年轻人，说跟你学手艺。年轻人手有点抖，第一天就把一个工件车废了，站在那儿不敢说话。你看了看废件，没吭声。",
      choices: [
        { label: "收下。废件的料钱从我这儿出", effects: { money: -2, relation: 3, health: -2, growth: 2 }, set: "traj_craft", echo: "头三个月他出的活你件件复查，慢是慢了点。可你下班时，工具箱头一次有人帮你收拾好了。" },
        { label: "不收。自己干惯了", effects: { freedom: 2, money: 1 }, echo: "年轻人后来跟了别的师傅。你照旧一个人开工，一个人收工。" },
      ] },
    { id: "r_village_doc", label: "卫生院那通电话", clue: "摸了摸白大褂口袋里的处方笺，没当场答复的人。", min: 36, max: 52, route: "home", ctx: { flag: "med_work" }, chance: 0.010, text: "你在乡镇卫生院当了几年医生，门诊一天最多看四十多个人，输液室的椅子常年坐满。这天县医院来电话，说有个进修之后留院的名额，问你去不去。你把白大褂口袋里的处方笺摸了摸，没当场答复。",
      choices: [
        { label: "留下。这一摊离不开人", effects: { money: -3, relation: 4, health: -2 }, set: "traj_village_doc", echo: "你回了电话，说不去了。当晚有个老人骑电动车来敲门，说家里孩子发烧，先找你看看再说。" },
        { label: "去。往大医院走", effects: { money: 3, growth: 2, relation: -1 }, echo: "交接那天，输液室的人挨个跟你道别。你走的时候，药房的窗户还开着。" },
      ] },
    { id: "r_captain_final", label: "最后一场球", clue: "喷了两次止痛喷雾，被年轻人抬起来先喊腰的人。", min: 53, max: 62, all: ["team_captain"], chance: 0.04, text: "这支业余球队你张罗了这么多年。这场是联赛最后一场，你的膝盖热身时就开始疼，喷了两次止痛喷雾，还是顶完了全场。终场哨响，你们赢了一个球。年轻人把你抬起来的时候，你先喊的是：慢点，我的腰。", effects: { relation: 4, health: -3, growth: 1, wisdom: 2 }, set: "traj_captain" },
    { id: "r_trucker_route", label: "九百公里长途线", clue: "里程表跳得飞快，一个月瘦了六斤的人。", min: 35, max: 46, ctx: { flag: "truck_work" }, chance: 0.012, text: "运输公司新开了一条跨省长途线，单程 900 多公里，跑一趟歇一天，工资比市内短途多出一截。调度问你愿不愿意固定跑这条线。你的驾照年限够，就是夜里赶路、白天补觉，日子要整个翻过来。",
      choices: [
        { label: "接。固定跑长途", effects: { money: 5, health: -4, relation: -2 }, set: "traj_trucker", echo: "第一个月你跑了九趟。服务区的泡面吃了四种口味，里程表跳得飞快，人瘦了六斤。" },
        { label: "不接。还是跑短途", effects: { money: 2, freedom: 1 }, echo: "你照旧每天能回家吃饭。就是工资条上那个数，一直没怎么动。" },
      ] },
    // —— v0.11.0 新增：苦味/负面/两难（稀有≠幸运）——
    { id: "r_scam_big", label: "投资群第五个月", clue: "利息准时到了四个月，第五个月群里全在问同一句话的人。", min: 38, max: 52, minYear: 2012, stats: [{ k: "money", gt: 54 }], chance: 0.008, w: 2, text: "熟人拉你进了一个投资群，说是熟人项目，保本，每月返息。前四个月利息一分不少打到卡上，你又追加了一笔，前后投进去的是你存了六年的数。第五个月群主失联，群里200多号人都在问同一句话。报警、登记、跑经侦，你跑了七趟。", effects: { money: -9, relation: -2, wisdom: 3 } },
    { id: "r_industry_overnight",ctx: { mainLine: ["factory_work","fab_work"] }, label: "产品线一夜凉了", clue: "公告栏的名单贴出来，名字在第三行的人。", min: 40, max: 55, any: ["stay_put", "steady_job"], chance: 0.009, w: 2, text: "你干了十几年的这条产品线，一夜之间就凉了。新的技术路线出来，客户的订单全转去了别家。厂里贴出通知：这条线的人，要么转岗降一档工资，要么拿补偿走人。名单贴在公告栏上，你的名字在第三行。",
      choices: [
        { label: "转岗。从头学新产线", effects: { money: -5, growth: 3, health: -1 }, echo: "新产线的活你干得比年轻人慢，笔记却记了三大本。工资条矮了一截，饭还得照吃。" },
        { label: "拿补偿。先歇一阵再说", effects: { money: -4, freedom: 2, health: -1, wisdom: 2 }, echo: "补偿款到账那天，你把工牌放进抽屉。歇了半个月，人是缓过来了，下一步还没想好。" },
      ] },
    { id: "r_oldfriend_gone", label: "同桌的葬礼", clue: "开车两个多小时去邻县，在花圈里找自己那个的人。", min: 42, max: 55, minYear: 2012, ctx: { car: "now" }, chance: 0.007, w: 2, text: "初中同桌去世的消息，是同学群里转发的。你上次见对方还是五年前同学聚会，散场时约了下次，对方说忙完这阵就约。葬礼在邻县，你请了一天假，开车两个多小时过去，在花圈里找到自己送的那个，站着看了一会儿上面的挽联。", effects: { relation: -2, health: -1, money: -1, wisdom: 4 } },
    { id: "r_friend_debt", label: "发小那笔借款", clue: "把聊天记录翻到转账那一页，停了一会儿的人。", min: 36, max: 50, minYear: 2005, stats: [{ k: "money", gt: 50 }], chance: 0.011, w: 2, text: "发小开口借钱周转，说三个月就还。你转过去一笔，是你攒了两年的数。三个月变半年，半年变一年，电话从秒接变成隔天回。最后一次见面在茶馆，两杯茶没喝完，话先说僵了。",
      choices: [
        { label: "认了。钱不要了，人也断了", effects: { money: -6, relation: -3, wisdom: 3 }, echo: "你把聊天记录翻到转账那一页，停了一会儿，还是退了出来。" },
        { label: "走法律程序，追回多少算多少", effects: { money: -3, relation: -5, wisdom: 2 }, echo: "调解室里坐了一下午，最后签了分期还款的纸。钱回来得很慢，逢年过节的问候先没了。" },
      ] },
    { id: "r_health_operation", label: "报告上圈出的指标", clue: "扶着走廊扶手走了一圈，比术前慢了一半的人。", min: 35, max: 55, stats: [{ k: "health", lt: 60 }], chance: 0.007, w: 2, text: "体检报告上圈出一个指标，复查、增强 CT、主任会诊，前后跑了五趟医院。结论是得做手术，不算大，但要在家歇一个月。手术费自费部分刷了你大半年的结余，出院那天，你扶着走廊的扶手走了一圈，比术前慢了一半。", effects: { health: -4, money: -6, wisdom: 2 } },
    { id: "r_guarantee_trap", label: "担保签的那个字", clue: "催告函寄到家里那年，年夜饭没在一张桌子上吃的人。", min: 39, max: 54, stats: [{ k: "relation", gt: 54 }], chance: 0.005, w: 2, text: "亲戚买房差首付，求你做贷款担保，说就签个字，周转开就还上。你签了。两年后银行的催告函寄到你家：对方断供四个月，担保人要先行代偿。你替对方还了大半年的月供，两家人的年夜饭，那年没在一张桌子上吃。", effects: { money: -8, relation: -3, wisdom: 2 } },
    { id: "r_old_neighbor", label: "巷口站着聊的那次", clue: "在小卖部门口站着聊了四十多分钟，请对方吃了碗十四块钱面的人。", min: 47, max: 58, chance: 0.005, text: "搬走十几年的老邻居回老街办事，在巷口碰见你。你们在小卖部门口站着聊了四十多分钟：谁谁搬去了哪，巷口那棵树是哪年砍的。临走互相留了新号码，你请对方吃了碗面，14 块。之后谁也没再联系谁，号码就躺在通讯录里。", effects: { relation: 1, money: -1 } },
    // v0.16.0 老来得子链的终点：不由玩家选，由概率落定。窗口错开——lk_born 先独占 48–50 的掷骰，lk_none 51–53 收尾，lk_fade 52–55 兜底（没走完治疗的人慢慢停下）
    // 定标：走完治疗的人里约四分之一等来孩子。chance 0.13 是按实测漏斗定的——lk_wait 完成得晚，多数人只剩 2–3 次掷骰（0.09 实测只得 17.5%，0.13 折算约四分之一）；现实中 45 岁以上两年累计活产率约一到两成，游戏略宽，文案只写概率低、不许诺
    { id: "lk_born", label: "这一回，等到了", clue: "快五十岁那年，把婴儿床拼了两个晚上的人。", min: 48, max: 51, require: ["late_try"], chain: "lk_wait", state: { kids: "undecided", spouse: ["partnered", "dating"] }, chance: 0.13, text: "消息是对方先看到的，验孕棒举在手里，半天没说出话。后面几个月，复查一次不落，报告都说平稳。孩子出生那天，你在产房外站了很久，护士抱出来，你先看对方——对方朝你点点头，你才伸手。", effects: { relation: 4, health: -2, money: -3 }, set: "late_parent", setState: { kids: "has" } },
    { id: "lk_none", label: "最后一次复查", clue: "把没用完的药对着单子点了一遍，又放回抽屉的人。", min: 51, max: 53, require: ["late_try"], chain: "lk_wait", state: { kids: "undecided", spouse: ["partnered", "dating"] }, chance: 0.55, text: "最后一次复查，医生把能说的都说了：该试的办法都试了，再往下，身体先受不了。回家路上你们在面馆停了一次，一人一碗，谁也没剩下。日子还得往下过，这话谁也没说出口，可两个人都懂。", effects: { wisdom: 2, health: -1 }, set: "late_tried", setState: { kids: "none" } },
    { id: "lk_fade", label: "慢慢就不提了", clue: "把医院的就诊卡收进钱包最里层，三年没再动过的人。", min: 52, max: 57, require: ["late_try"], state: { kids: "undecided", spouse: ["partnered", "dating"] }, chance: 0.5, text: "也没有哪一天正式说过停。就是复查的闹钟删了，药没有再续，就诊卡收进钱包最里面。这事从饭桌上慢慢退到了抽屉里。偶尔亲戚问起，你们笑笑，把话岔开。", effects: { wisdom: 2, freedom: 1 }, set: "late_tried", setState: { kids: "none" } },
    // CL-112（CL-109 §五）：拆迁坐实环，追加在存量 rare 表末（表序纪律：新链不抢存量链的掷骰序）。
    // chain+require 双门：落点环来过且选过钱/房（traj_oldhouse）才掷；chance 0.08 是链内高转化
    // （事已临头，搬完是常态）。traj_windfall 在此落（原由 r_oldhouse 直落，registry 已改指本条）。
    { id: "r_oldhouse_move", label: "搬出去那年", clue: "老屋里吃完最后一顿饭，把碗筷打包带走的人。", min: 39, max: 64, chain: "r_oldhouse", require: "traj_oldhouse", chance: 0.08, text: "搬出去那年，卡车停在巷口。老屋里最后吃了一顿饭，碗筷打包带走，门锁交出去。头一年路过那片，你还会放慢脚步看一眼。日子，就这么换了个地方往下过。", effects: { money: 2, wisdom: 1 }, set: "traj_windfall" },
  ],
  endings: [
    { id: "end_richest", clue: "把副业干成大公司，最后站在锣声里的人。", tier: "legendary", all: ["traj_ipo"], stats: [{ k: "money", gt: 69 }], title: "世界首富", evidence: [["r_ipo"],["r_funding"]],
      text: "公司上市之后又走了很多年。有那么一年，富豪榜把你的名字放在了第一位。记者问你秘诀，你说：哪有什么秘诀，就是当年书桌前那张白纸，我没扔。你还是习惯自己热饭，办公室的灯，也还是你走得最晚。" },
    { id: "end_drug", clue: "发布会上摆摆手说『是药好，不是我』的人。", tier: "legendary", all: ["traj_drug2"], stats: [{ k: "growth", gt: 69 }], title: "神药研发者", evidence: [["r_drug1"],["r_drug2"]],
      text: "你牵头的那款药，最终获批上市。发布会那天，台下坐着一位用过临床试验药的病人，站起来向你鞠了一躬。你摆摆手，说：是药好，不是我。回去的路上你想，实验室记录本第一页的那个日期，隔了快二十年了。" },
    { id: "end_academician", clue: "散场后一个人去食堂吃面，窗口阿姨照例多加了个蛋的人。", tier: "legendary", route: "study", all: ["traj_award"], stats: [{ k: "growth", gt: 96 }, { k: "wisdom", gt: 64 }], title: "院士", evidence: [["r_award"],[{"stat":{"k":"growth","gt":96}}]],
      text: "当选院士那年，你回了趟母校。礼堂还是那间礼堂，你坐在第一排，听校长介绍你的名字。散场后你一个人去食堂吃了碗面，窗口阿姨没认出你，照例多给你加了个蛋。" },
    { id: "end_principal", clue: "站在当年报到时老校长站的位置上，讲话很短的人。", tier: "epic", all: ["traj_vp"], stats: [{ k: "relation", gt: 88 }], title: "一校之长", evidence: [["r_school1"],["r_school2"]],
      text: "五十几岁那年，你成了这所学校的校长。开学典礼上你站在台上，看着一操场的学生，想起自己报到那天，老校长也是站在这个位置。你讲得很短：好好读书，也好好吃饭。台下笑了一片。" },
    { id: "end_bestseller", clue: "把读者来信和当年那份薄合同，收进同一个抽屉的人。", tier: "epic", all: ["traj_book", "write_work"], stats: [{ k: "growth", gt: 86 }], title: "畅销书作家", evidence: [["r_book"],[{"stat":{"k":"growth","gt":86}}]],
      text: "你的书一版再版，摆在书店门口的架子上。有读者来信说，是在最难的一年读到它的。你把信收在抽屉里，和当年那份薄薄的合同放在一起。" },
    { id: "end_influencer", clue: "自称『下班后比较忙的人』，灯还是那盏灯的人。", tier: "epic", all: ["traj_viral"], title: "千万粉丝", evidence: [["r_viral"],["side_job"]],
      text: "你的账号慢慢涨到了一千多万粉丝。有人问你现在算不算名人，你说：算个下班后比较忙的人。视频还是在那个小书桌上拍，灯也没换过。" },
    { id: "end_bigfamily", clue: "六十五岁生日摆了两桌，吹蜡烛时被一屋子人喊、称呼各不相同的人。", tier: "epic", stateAll: { spouse: "partnered", kids: "has" }, stats: [{ k: "relation", gt: 89 }, { k: "health", gt: 58 }], title: "子孙满堂", evidence: [["p14_028","p14_030","p14_031","p14_032","p14_034","p16_059","p16_070","p23_066","p25_006","p25_017","p25_027","p25_037","p25_042","p25_063","p26_013","p29_019","e55_044","e55_050"],["c_partner","cb_old_couple","c_has_kid"]],
      text: "65 岁生日那天，家里摆了两桌。孩子带着孩子，孩子又带着更小的孩子。吹蜡烛的时候一屋子人喊你，称呼各不相同。你眯着眼睛看了一圈，心想：这一屋子，都是从那一年开始的。",
      textThree: "65 岁生日那天，家里摆了两桌。孩子带着孩子，一屋子人挤得满满当当。吹蜡烛的时候一屋子人喊你，称呼各不相同。你眯着眼睛看了一圈，心想：这一屋子，都是从那一年开始的。",
      textFull: "65 岁生日那天，家里摆了两桌。一家人都到齐了，孩子坐在你旁边，另一半在对面。吹蜡烛的时候一屋子人喊你，称呼各不相同。你眯着眼睛看了一圈，心想：这一屋子，都是从那一年开始的。",
      // AN-5 R6：textFull 的无伴侣兜底变体（settlement.js 选文在终局 spouse 非 partnered 时取此变体）——
      // 只保留文案可验证的承重事实（65 岁、两桌、孩子在旁、称呼各不相同），不提伴侣、不称子孙满堂、语气不降格。
      textFullSolo: "65 岁生日那天，家里摆了两桌。孩子坐在你旁边，挨个给你夹菜。吹蜡烛的时候一屋子人喊你，称呼各不相同。你眯着眼睛看了一圈，心想：这一屋子，都是从那一年开始的。" },
    { id: "end_traveler", clue: "冰箱上贴满各地磁铁，说『剩下的时间慢慢走回程』的人。", tier: "epic", all: ["retired_full"], stats: [{ k: "freedom", gt: 76 }, { k: "money", gt: 54 }], title: "环游世界", evidence: [["retired_full"],["e_trip","cb_old_couple","c_no_kid","p14_059","p14_061"]],
      text: "退休金、存款、说走就走的身体，你都凑齐了。护照一直备着，行李箱就搁在柜子顶上，说走就能走。冰箱上贴着你从外头带回来的磁铁，空着的地方还多。有人问你还差哪没去，你说：不差了，剩下的时间，慢慢走回程。" }, // AN-5 R8(ii)：证据组一枚只证「至少走过一趟」，原句把一趟说成走遍——弱化到证据可证：「随时能走＋已经在走」；clue 引用的收束句原样保留
    { id: "end_standard", clue: "看到那份文件，总在心里默默改错别字的人。", tier: "epic", all: ["stay_put"], any: ["factory_work", "fab_work", "traj_craft"], stats: [{ k: "growth", gt: 94 }], title: "定标准的人", evidence: [["stay_put"],[{"stat":{"k":"growth","gt":94}}]],
      text: "行业里那份用了很多年的标准，起草人名单里有你。年轻人入行学的第一课，写的就是你定的规矩。你没跟人提过这事，只是每次看到那份文件，都把错别字在心里默默改一遍。" },
    { id: "end_localfounder", clue: "招工启事贴出去，来应聘的有小学同学孩子的人。", tier: "epic", route: "home", all: ["side_job"], any: ["shop_work"], forbid: ["moved_city"], stats: [{ k: "money", gt: 71 }], title: "县城企业家", evidence: [["side_job"],["c_side",{"stat":{"k":"money","gt":71}}]],
      text: "你在县城里的那摊生意，后来成了镇上最大的用工单位。招工启事贴出去，来的有你小学同学的孩子。你在办公室里看着窗外想：当年要是走了，这一切就都没有了。当然，走了也会有别的——只是这个版本，你过得不后悔。" },
    // CL-112（CL-109 §六）：各线富贵尾巴的共同结局家——any 任一 traj_fortune_* 坐实旗或 traj_ipo，
    // 钱门 gt 64；evidence 两点制：一点认旗（hasFact 并读口径，旗落即认）、一点认钱数字。
    // traj_fortune_* 的坐实拍由后续 W 片施工，在此之前本条仅 traj_ipo 一路可达（与 end_richest 分工：
    // 那条是 legendary 且要 money>69，本条 epic 收 65–69 的上市局与各线本业做大局）。
    { id: "end_selfmade", clue: "起家时手里没几个钱，后来这一片办事先想起他家的人。", tier: "epic", any: ["traj_fortune_acct", "traj_fortune_builder", "traj_fortune_consult", "traj_fortune_craft", "traj_fortune_dev", "traj_fortune_farm", "traj_fortune_fin", "traj_fortune_media", "traj_fortune_photo", "traj_fortune_sea", "traj_fortune_shop", "traj_fortune_write", "traj_ipo"], stats: [{ k: "money", gt: 64 }], title: "白手起家", evidence: [["traj_fortune_acct", "traj_fortune_builder", "traj_fortune_consult", "traj_fortune_craft", "traj_fortune_dev", "traj_fortune_farm", "traj_fortune_fin", "traj_fortune_media", "traj_fortune_photo", "traj_fortune_sea", "traj_fortune_shop", "traj_fortune_write", "traj_ipo"], [{ "stat": { "k": "money", "gt": 64 } }]],
      text: "你起家的时候，手里没几个钱。后来那摊事一点点做大，做成了这一片绕不开的名字。钱是挣到了，日子还是照常过：菜自己买，账自己记。有人问你这算不算白手起家，你笑笑说，算吧，就是慢了点。" },
    { id: "end_lottery", clue: "每年那一天还去买一注，还是那组生日号码的人。", tier: "rare", all: ["traj_lottery"], title: "天选之人", evidence: [["r_lottery"],[{"stat":{"k":"money","gt":59}}]],
      text: "中奖的事你没跟几个人说。钱一部分存了定期，一部分给家里添了几样大件，日子还是照常过。只是每年那一天，你会去楼下那家彩票站买一注，还是那组生日号码。店主问你图啥，你说：图个念想。" },
    { id: "end_champion", clue: "奖牌挂在书房门后，说秘诀是『还跑得动』的人。", tier: "rare", all: ["traj_champ"], title: "年龄组冠军", evidence: [["r_marathon"],[{"stat":{"k":"relation","gt":59}}]],
      text: "奖牌挂在书房门后，进门就能看见。年轻人问你跑步有什么秘诀，你说：没什么秘诀，就是还跑得动。这话比奖牌还让你得意。" },
    { id: "end_teacher_taoli", clue: "送行宴上只说『都坐下，先吃饭，菜凉了』的人。", tier: "epic", all: ["traj_taoli"], stats: [{ k: "relation", gt: 74 }], title: "桃李满天下", evidence: [["r_teacher_students"],["r_school1"]],
      text: "退休那年，你教过的学生凑了三桌给你送行，最早的一届头发都白了一半。有人把你当年借出去的那本备课本还了回来，说传了三届人，本子还在。你没讲什么大道理，就说：都坐下，先吃饭，菜凉了。" },
    { id: "end_craft_legacy", clue: "把用了二十多年的卡尺留给徒弟，盒子上的名字都磨浅了的人。", tier: "epic", all: ["traj_craft"], stats: [{ k: "growth", gt: 64 }, { k: "relation", gt: 54 }], title: "手艺有人接", evidence: [["r_craft_apprentice"],[{"stat":{"k":"growth","gt":64}}]],
      text: "你退休那天，徒弟已经能独立顶下整条线了。你把用了二十多年的那把卡尺留给对方，盒子上刻的名字都磨浅了。后来你路过车间，还能听见机器响，站在门口看一会儿，不进去。" },
    { id: "end_village_doctor", clue: "在乡镇卫生院的门诊椅子上，坐了一辈子的人。", tier: "epic", ctx: { flag: "med_work" }, all: ["traj_village_doc"], stats: [{ k: "relation", gt: 92 }], title: "一村的医生", evidence: [["r_village_doc"],[{"stat":{"k":"relation","gt":92}}]],
      text: "你在乡镇卫生院干到退休。辖区里几千口人，谁家的老人吃什么药、谁对什么过敏，你的本子上都记着。退休手续办完那天，输液室坐满了人，不是来看病的，是听说你要走，来送送你。你说：新医生比我强。没人接这句话。" },
    { id: "end_captain", clue: "把队长袖标交出去，之后坐在场边管哨子和记分牌的人。", tier: "rare", all: ["traj_captain"], stats: [{ k: "relation", gt: 59 }], title: "老队长", evidence: [["r_captain_final"],["team_captain"]],
      text: "你踢不动全场那年，把队长袖标交给了队里最年轻的那个。交完你们照常去吃宵夜，啤酒你只喝了一杯——膝盖还疼，回家得冰敷。后来每场比赛你都去，坐在场边，哨子和记分牌还归你管。" },
    { id: "end_trucker_million", clue: "服务区哪家的盒饭实在、哪段路雨天打滑，闭着眼都说得出来的人。", tier: "rare", ctx: { flag: "truck_veteran" }, all: ["traj_trucker"], stats: [{ k: "money", gt: 59 }], title: "跑满一百万公里", evidence: [["r_trucker_route"],[{"stat":{"k":"money","gt":59}}]],
      text: "你跑长途跑了大半辈子，里程表过了一百万公里，公司给你发了块无事故的牌子，挂在驾驶室里。你的腰落下了毛病，补觉要靠耳塞。可这条线上的服务区，哪家的盒饭实在、哪段路雨天打滑，你闭着眼都说得出来。" },
    // ===== 人生形状批（结局扩容，17→32）：不比高下、只认形状——普通人的一生过得完整，
    // 也落一个说得出口的名字。全批 tier=rare，排在出人头地诸条之后（同池排序口径不变）。
    // 其中七条（end_late_partner / end_one_partner / end_long_life / end_steady_life /
    // end_late_learner / end_early_full / end_rent_free）的定义含数据层表达不了的终局形状（终局年龄、
    // 伴侣史任数与成伴岁数、60 岁后成长涨幅、稀有事件零发生），门落在 settlement.js
    // specialEnding() 的形状门段（与 AN-5 R9 年龄门同位、只读、不掷骰）——本表只写
    // 数据层能表达的那一半，形状读不准时形状门 fail-closed 剔除，只少说不多说。
    { id: "end_care_parents", clue: "夜里老人起夜，听见动静就醒，比闹钟还准的人。", tier: "rare", stateAll: { dad: "dead", mom: "dead" }, all: ["care_self"], title: "在父母跟前", evidence: [["care_self"],["cb_care_near","c_care_self","cb_sandwich","p4_071","p4_082","p6_044","p4_074","p4_075"]],
      text: "父母都是你送走的。最后那几年，你请了长假住回去，夜里他们起夜，你在客厅听见动静就醒。手续办完，你把老屋的钥匙收在抽屉里，隔阵子回去开一回窗，通通风。" },
    { id: "end_solo_free", clue: "过年给自己做四个菜，吃得很慢的人。", tier: "rare", stateAll: { spouse: "single" }, stats: [{ k: "freedom", gt: 64 }, { k: "relation", gt: 44 }], title: "一个人也热闹", evidence: [["c_single"],["choir_member","team_member","hobby_run","hobby_fishing","hobby_photo","hobby_music","hobby_cooking"]],
      text: "你一个人过了一辈子。过年给自己做四个菜，吃得很慢。平时有自己的消遣，约饭的电话没断过，老邻居串门也熟门熟路。屋子不大，收拾起来快，日子都按自己的钟点过。" },
    { id: "end_two_home", clue: "把往后的安排列成一张表，贴在书房墙上的人。", tier: "rare", stateAll: { spouse: "partnered", kids: "none" }, all: ["kid_no"], title: "两个人的家", evidence: [["kid_no"],["c_partner","cb_dink_plan","cb_old_couple"]],
      text: "孩子的事，你们早年就商量定了，不要。往后的安排列过一张表：钱怎么放、房子怎么办、老了谁照顾谁。亲戚问起，你们就把表指给他们看，笑笑，不多解释。两个人把日子过得清清楚楚。" },
    { id: "end_late_partner", clue: "前半程各走各的，后来才坐到一张桌上吃饭的人。", tier: "rare", stateAll: { spouse: "partnered" }, title: "迟来的伴", evidence: [["c_partner","cb_old_couple"],[{"stat":{"k":"relation","gt":49}}]],
      text: "这个人，是你后半程才遇上的。前头的路各走各的，遇上以后，买菜做饭、看病复查，都有了个搭手的人。一张桌上吃饭，吃到了老。" },
    { id: "end_return_home", clue: "出去时拖着两个箱子，回来时还是两个箱子的人。", tier: "rare", routeIn: ["corp", "abroad"], ctx: { settle: "home" }, stats: [{ k: "relation", gt: 64 }], title: "落叶归根", evidence: [["back_home_stay"],["moved_city","stayed_city"]],
      text: "年轻时你拖着箱子出去，走了大半辈子，最后还是回来了。老屋收拾出来住下，老街上的人还认得你，见面先问一句在外面怎么样。你说，挺好，就是想回来住。" },
    { id: "end_farm_life", clue: "哪块地哪年旱、哪年涝，闭着眼都说得出来的人。", tier: "rare", route: "farm", ctx: { settle: "home" }, all: ["farm_work"], forbid: ["farm_left"], title: "守着土地", evidence: [["farm_work"],["p29_001","p29_002","p29_003","p29_004","p29_005","p29_006","p29_007","p29_008"]],
      text: "这一辈子，你没离开过这片地。春天播、秋天收，农机换了几代，院子还是那个院子。哪块地肥、哪块地薄，你闭着眼睛都摸得清。地里的活干到干不动那年，你才把锄头挂上墙。" },
    { id: "end_comeback", clue: "跌过一个大跟头，后来把日子重新过回原样的人。", tier: "rare", stats: [{ k: "money", gt: 54 }, { k: "health", gt: 54 }], title: "重新站起来", evidence: [["laid_off","shop_closed","r_scam_big","r_industry_overnight","r_health_operation","r_guarantee_trap","r_friend_debt"],["debt_free",{"stat":{"k":"money","gt":64}},{"stat":{"k":"health","gt":59}}]],
      text: "中年那几年，你栽过一个大跟头，缓了好一阵。后来活重新找下、账重新算清，日子一点点回到了原来的样子。那几年的事你很少提，提起来也只说一句：过来了。" },
    { id: "end_rent_free", clue: "东西越搬越少，最后只剩六个箱子的人。", tier: "rare", ctx: { house: "renting" }, stats: [{ k: "freedom", gt: 90 }], title: "无房一身轻", evidence: [["renting"],["c_rent",{"stat":{"k":"freedom","gt":89}}]],
      text: "你一辈子没买房，租过的房子有五六处。东西越搬越少，最后只剩几个箱子。哪儿住腻了，或者房租涨得不像话，收拾收拾就能走。这辈子没为月供发过愁。" },
    { id: "end_abroad_rest", clue: "永住手续批下来那天，去吃了顿好的，还是和平常一样的人。", tier: "rare", route: "abroad", ctx: { settle: "abroad" }, title: "异乡终老", evidence: [["r_abroad_pr","stayed_city"],["ab37_001","ab37_002","ab37_003","ab37_004","ab37_005","ab37_006"]],
      text: "当年落地那天，谁也不认识你。后来语言顺了、手续齐了，买菜认准一家摊子，看病认准一家医院，老了还认了几个能说话的人。老家你也回去看过，可住下来过日子的，是这边。" },
    { id: "end_old_hand", clue: "新来的年轻人遇上拿不准的事，都先来问一句的人。", tier: "rare", ctx: { tenureIn: [40, 999] }, stats: [{ k: "growth", gt: 64 }], title: "老把式", evidence: [["factory_work","fab_work","craft_work","teach_work","med_work","med_hosp","nurse_work","truck_work","shop_work","farm_work","dev_work","fin_work","acct_work","press_work","img_work","heavy_work","miner_work","driver_taxi","exam_landed","grad_work","write_work","care_work","gig_work","courier_work","stay_put"],["mentor_bond","legacy_sharing_done","traj_craft","took_over_job"]],
      text: "一门活，你干了大半辈子。单位的名字换过、机器换过、年轻人换过几茬，你手里这套活一直没换。新来的遇上拿不准的事，都先来问你一句。问完你摆摆手，说，没啥，干久了就会了。" },
    { id: "end_one_partner", clue: "吵过也和好过，到老还是一起买菜、推一辆车慢慢挑的人。", tier: "rare", stateAll: { spouse: ["partnered", "widowed"] }, title: "白头偕老", evidence: [["c_partner"],["cb_old_couple",{"stat":{"k":"relation","gt":54}}]],
      text: "从成家到老，你身边一直是同一个人。吵过，也和好过；对方病了，你在陪护椅上睡过；你病了，药盒是对方按早中晚分好的。到老了，还是一起买菜，推一辆车慢慢挑。" },
    { id: "end_long_life", clue: "九十多岁了，还自己下楼买早点的人。", tier: "rare", title: "九十多岁", evidence: [["retired_full"],[{"stat":{"k":"health","gt":49}}]],
      text: "你活到了九十多岁。日子还是平常日子：自己下楼买早点，午后晒会儿太阳，谁来了坐下聊几句。儿孙辈隔阵子来看你，坐一会儿又忙去了。你说，不用常来，我这儿挺好。" },
    { id: "end_steady_life", clue: "没发过大财，也没经过大难，年年都差不多的人。", tier: "rare", forbid: ["laid_off", "shop_closed"], stats: [{ k: "health", gt: 24 }, { k: "health", lt: 89 }, { k: "money", gt: 24 }, { k: "money", lt: 89 }, { k: "growth", gt: 24 }, { k: "freedom", gt: 24 }, { k: "freedom", lt: 89 }, { k: "relation", gt: 24 }, { k: "relation", lt: 89 }, { k: "wisdom", gt: 24 }], title: "安稳一生", evidence: [["retired_full",{"state":{"workPhase":"retired"}},{"state":{"workPhase":"part"}}],["c_partner","c_single","c_has_kid","c_no_kid","cb_old_couple","c_house","c_rent",{"state":{"kids":"has"}},{"state":{"spouse":"partnered"}}]],
      text: "这一辈子，没发过什么大财，也没经过什么大难。年轻时该上班上班，中年该养家养家，老了按月领退休金。回头看，年年都差不多，可就是这些差不多，一年一年把日子过完了。" },
    { id: "end_late_learner", clue: "退休以后，反倒把年轻时没学的慢慢补上的人。", tier: "rare", stats: [{ k: "growth", gt: 59 }], title: "越老越学", evidence: [[{"stat":{"k":"growth","gt":59}}],[{"stat":{"k":"wisdom","gt":54}},"legacy_sharing_done","p24_051","ai_daily"]],
      text: "年轻时忙着过日子，没顾上学什么。倒是退休以后，你把时间捡起来了：新玩意儿一样样上手，年轻时没读完的书也翻出来读。家里人说你越老越忙，你说，这才刚开始学。" },
    { id: "end_early_full", clue: "走的那天，送行的人多到屋里站不下的人。", tier: "rare", stats: [{ k: "relation", gt: 64 }, { k: "wisdom", gt: 54 }], title: "送行的人多", evidence: [[{"stat":{"k":"relation","gt":64}}],["c_partner","c_has_kid","cb_family3","cb_sandwich"]],
      text: "你走的时候，年纪不算大。这些年，家里家外都有人，饭局上从不缺你，朋友有事都愿意喊你。走的那天，来送的人很多，屋里站不下，有人站在门口。" },
  ],
};
