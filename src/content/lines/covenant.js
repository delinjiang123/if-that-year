// [M1-B 内容重组] 本文件现位于 src/content/lines/covenant.js（按领域重组搬入），除本行外内容一字未动。
// 扩展包 35（v0.17.0）：① fork38 立约的年度流——38 岁立下的约，后续年份要能读到这份账（cov38_has/none/wait 三条）；
// ② 童年记号的成年回响——序章记号 mark_deskmate / mark_river / mark_tree 各一条成年段回响事件。
// 立约只记旗与账，不碰 kids 状态机：三条的门都读现行 kids 状态，与 fork38/fork45/e_kid_settle 的既有流转并行不悖。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
  // —— 立约年度流 ——
  { id: "cov_has_flow", kidAgeMin: 1, kidAgeMax: 2, min: 39, max: 44, any: ["cov38_has", "kid_yes"], state: { kids: "has" }, stateAll: { spouse: "partnered", mom: "alive" }, text: "孩子一岁多，正是离不了人的时候。夜里醒三回，你和另一半排了班，一人半夜。白天你妈问孩子吃了多少、睡了多久，你一条一条回。日子被切得很碎，可想起 38 岁那回的决定，你心里是定的。",
    effects: { relation: 2, health: -1 } },
  { id: "cov_none_flow", min: 40, max: 48, any: ["cov38_none", "kid_no"], state: { kids: "none", spouse: "partnered" }, text: "你们把往后的安排列了张表，贴在书房墙上：钱怎么留，房子怎么处置，老了谁先走、剩下的那个靠什么。表是 38 岁那回定下之后慢慢补全的。亲戚再问孩子的事，你们就指指表，说都安排好了。",
    effects: { wisdom: 2, freedom: 1 } },
  { id: "cov_wait_flow", min: 39, max: 41, any: ["cov38_wait", "kid_wait"], state: { kids: "undecided" }, forbid: ["late_try"], text: "那张写着日期的纸还在文件夹最上面。这一年你又把它拿出来看了一眼，日期底下添了一行小字，是另一半写的：不急，先把身体养好。纸放回去，文件夹合上，这份账还没到期。", textState: { spouse: { single: "那张写着日期的纸还在文件夹最上面。这一年你又把它拿出来看了一眼，日期底下添了一行小字，是你自己写的：不急，先把身体养好。纸放回去，文件夹合上，这份账还没到期。", none: "那张写着日期的纸还在文件夹最上面。这一年你又把它拿出来看了一眼，日期底下添了一行小字，是你自己写的：不急，先把身体养好。纸放回去，文件夹合上，这份账还没到期。", divorced: "那张写着日期的纸还在文件夹最上面。这一年你又把它拿出来看了一眼，日期底下添了一行小字，是你自己写的：不急，先把身体养好。纸放回去，文件夹合上，这份账还没到期。", widowed: "那张写着日期的纸还在文件夹最上面。这一年你又把它拿出来看了一眼，日期底下添了一行小字，是你自己写的：不急，先把身体养好。纸放回去，文件夹合上，这份账还没到期。" } },
    effects: { wisdom: 1, relation: 1 } },
  // 单身对账拍（v0.20.1 返修，审计 run-06）：fork45 有伴侣状态门，单身的人到期分岔不出现、约悬一辈子。
  // 本拍在 45–47 岁给无伴侣（partnered/dating 以外）且约未结的人单独对账：高权重 + 窄窗 + 多重具体门，
  // 尽量让到期这年就撞上；万一没撞上，结算对账行还有单身版本兜底（spouse.js covenantSettleLine）。
  // 口径（v0.20.1 W8 补修，验收 N1）：选「收了这份约」= 约与孩子的事一并结账——选项直接落定
  // kids→none（边载体 cov_solo_due 已登记进 state.js 的 kids undecided→none 边），此后
  // e_kid_settle/e_kid_final 的 kids=undecided 状态门天然不再出题，结算对账也不会再改写成
  // 「等来了孩子」。选「约先对到这儿」只立 cov_solo_done、不落定 kids：门留着，往后真想要
  // 时走 e_kid_settle/final 的单身收养版（events.js 两拍已给单身者分版，带到来回响）。
  { id: "cov_solo_due", min: 45, max: 45, w: 60, any: ["cov38_wait", "kid_wait"], state: { kids: "undecided" }, stateNot: { spouse: ["partnered", "dating"] }, forbid: ["late_try"], text: "45 岁这年，你把文件夹从抽屉里拿了出来。那张写着日期的纸还在最上面，边角毛了。38 岁那会儿说好的，45 岁到期，再对一回。只是这回桌子对面没有人，这份账，得你一个人对。",
    choices: [
      { label: "收了这份约。孩子的事，一个人不再等了", effects: { freedom: 3, wisdom: 1 }, set: "cov_solo_done", setState: { kids: "none" }, echo: "纸折好，塞进抽屉底层。这件事，从今天起不用再搁在心上了。" },
      { label: "约先对到这儿。真有想要的那一天，再重新立", effects: { freedom: 1, wisdom: 2 }, set: "cov_solo_done", echo: "纸压回文件夹最上面。不是还等谁，是这扇门，你没替将来的自己关死。" },
    ] },
  // —— 童年记号回响 ——
  { id: "echo_deskmate", min: 24, max: 40, require: "mark_deskmate", text: "小学同桌要结婚了，喜帖寄到时，你先想起的是开学第一天那半块橡皮。你随了份子，人也去了。席间你们说起当年分橡皮的事，对方说，那块橡皮是他妈让他分的，他当时还有点舍不得。",
    effects: { relation: 2 } },
  { id: "echo_river", min: 25, max: 42, require: "mark_river", ctx: { car: "now" }, text: "回老家办事，车过桥的时候你往下看了一眼：河沟填平了一半，剩下的那段水还是浅的，几个孩子在桥洞底下，不知在摸什么。你把车停在路边站了一会儿，才重新上路。",
    effects: { freedom: 1, wisdom: 1 } },
  { id: "echo_tree", min: 26, max: 45, require: "mark_tree", text: "路过小学门口，你特意慢了一步：那棵梧桐还在，树底下修鞋摊换成了摊主的儿子，工具摆的位置都没变。你站着看了会儿，有个小孩跑出来喊师傅修鞋，答应声从摊子后头传出来，跟你小时候听的一样。",
    effects: { relation: 1, wisdom: 1 } },
  // —— 童年记号回响（v0.21.1 变体记号，与上方三条同规：require 本局记号，一条对一款）——
  { id: "echo_candy", min: 24, max: 40, require: "mark_candy", text: "街上碰见小学同桌，他早搬走了，这回是回来办事。你们站在路边说了会儿话，临走他塞给你一颗水果糖，你剥开吃了，甜味跟小时候那颗差不多，你俩站在路边都笑了。",
    effects: { relation: 1 } },
  { id: "echo_window", min: 25, max: 42, require: "mark_window", text: "出差路过母校，赶上课间，你站在校门口往里看。靠窗的位置上，有个小孩正趴在桌上睡觉。",
    effects: { wisdom: 1 } },
  { id: "echo_wrongline", min: 24, max: 38, require: "mark_wrongline", text: "单位组织去小学做活动，你站在校门口看放学。一队一队的孩子涌出来，有个小的跟错了队，又被老师牵回来。你站在原地，一下子想起自己开学第一天。",
    effects: { freedom: 1 } },
  { id: "echo_hoop", min: 25, max: 42, require: "mark_hoop", text: "回老家，巷口那块空地盖了楼，楼下停满了电动车。你绕着车走进巷子，脚下就是小时候滚铁环的地方。",
    effects: { freedom: 1 } },
  { id: "echo_corn", min: 26, max: 44, require: "mark_corn", ctx: { car: "now" }, text: "开车路过一片玉米地，赶上长得最盛的时候。你把车停下，站在地边看了一会儿。叶子比人高，风一吹哗啦啦响，跟你九岁那年一个动静。",
    effects: { health: 1 } },
  { id: "echo_icepop", min: 24, max: 40, require: "mark_icepop", text: "天热，你在便利店买了根冰棍，包装花花绿绿，价钱是小时候的几十倍。你站在店门口吃完才发现，这根从头到尾是你一个人吃的，没人跟你分。",
    effects: { relation: 1 } },
  { id: "echo_shop", min: 25, max: 42, require: "mark_shop", text: "路过从前的小学，校门口那排店换了好几茬。你想起关门前一天，老板站在店门口，把剩下的糖分给了你们几个。那间店后来卖过文具，开过快递站，这回门口贴着转让的纸。",
    effects: { relation: 1 } },
  { id: "echo_yearbook", min: 26, max: 45, require: "mark_yearbook", text: "搬家收拾东西，翻出毕业留言册。你一页一页翻过去，那句「勿忘我」还在，字迹你又认了半天，还是没认出是谁。你把本子搁在茶几上，想着回头问问老同学，又搁了好几天。",
    effects: { wisdom: 1 } },
  { id: "echo_classphoto", min: 26, max: 45, require: "mark_classphoto", text: "老同学在群里发了张毕业照。你把图放大，找后排边上的自己，站在台阶上，眯着眼。你把图存了下来——就是你箱子底压着的那一张。",
    effects: { relation: 1 } },
]);
