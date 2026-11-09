// 《如果那年》年代包 · c1985 成年段（v0.23 WP7）
// 原由 scripts/wp7-gen-era1985.js 从序章包 adultEntries 机械生成；合并后 adultEntries 已迁入本文件，
// 后续改动直接在本文件落（G6 修复线起，生成器口径作废）。
// 构成：记号回响 9（require 本代记号）＋家庭事实回响 2（require originLB / any famLaidOff85·famArrears85）＋搬家回响 2
// （require movedHome85 / mark_move85）＋年代门控 5（era:c1985），在册共 18 条，年龄窗 22–45 岁；
// e85_003（大盘五千点）原为 30 岁单年窗、而 30 岁是瞥视年（engine.js GLIMPSE_AGES），step() 在瞥视年
// 直接 renderGlimpse 并 return、到不了 planYear()——结构性不可达、命中恒为 0，不是抽样稀有
// （WP7 G6 降格，见 logs/wp7/fix-report.md）。出生年小片第五批改绑公历：龄带 [26,35]＋公历门
// 2015 年单年，呈现公历年恒为 2015（五千点正典年，G6 标定）；龄带是全覆盖派生带
// （2015－出生年，1980–1989 → 26–35）。唯一例外曾是 1985 出生者：呈现龄正好 30 岁、
// 被瞥视年挡住「自然不出」（与 e65_005 同类，当时不硬挪年份）；瞥视不占年批已解——
// 站位年照常过完、瞥视挂收尾，该格自此自然可达。达标条目数口径：总指挥裁定恢复计入
// 18 条（2026-11-09 集成时定）——当初排除的理由是结构性不可达，现已消失；1985 出生独缺
// 是瞥视年通则，不构成分条目排除的理由。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
  {"id":"echo_case85","min":24,"max":40,"require":"mark_case85","text":"小学同桌结婚，喜帖到了，你先想起开学第一天那个铁皮文具盒。席间说起来，他说盒盖后来合不严，是他用皮筋勒着用的，勒到了小学毕业。","effects":{"relation":2,"money":-1}},
  {"id":"echo_flag85","min":25,"max":42,"require":"mark_flag85","text":"路过母校，赶上升旗。队伍里有个孩子红领巾系得歪，旁边的同桌伸手给他重系了一遍。你站在校门外看了一会儿，跟当年一模一样。","effects":{"wisdom":1,"relation":1}},
  {"id":"echo_cover85","min":26,"max":45,"require":"mark_cover85","text":"同事家孩子开学，你顺手帮着包了两本书，用的挂历纸，边角折得整整齐齐。同事问你这手艺哪儿学的，你说，小学包出来的。","effects":{"relation":1,"freedom":-1}},
  {"id":"echo_marble85","min":25,"max":42,"require":"mark_marble85","text":"搬家收拾柜子，翻出一小袋弹珠，玻璃的，袋口扎着。你在手里掂了掂，又放了回去，没舍得扔。趴在地上瞄准的那股认真劲，你后来干活时还有。","effects":{"freedom":1}},
  {"id":"echo_game85","min":24,"max":40,"require":"mark_game85","text":"同事说起小时候的学习机，满屋子人都笑了。你说你字没打利索，坦克的路线倒记得清——报起第几关怎么走，比报自己的工号还顺。","effects":{"relation":1,"growth":1}},
  {"id":"echo_arcade85","min":24,"max":38,"require":"mark_arcade85","text":"路过一家电玩城，门帘还是那种塑料条的。你掀开看了一眼，没进去。当年站在椅子后头看会的招式，如今都用不上了。有个小孩站在椅子后头，踮着脚，跟你当年一样。","effects":{"wisdom":1}},
  {"id":"echo_football85","min":26,"max":45,"require":"mark_football85","text":"世界杯那阵，同事问你看不看球。你说看，还熬了两个大夜。十强赛那年你抄过赛程表，一场一场划到最后。你爸现在还看球，就是看着看着能在沙发上睡着。","effects":{"relation":1,"health":-1}},
  {"id":"echo_shop85","min":25,"max":42,"require":"mark_shop85","text":"回老家，校门口的小卖部还在，老板换成了老太太的儿子。你买了瓶水，他赊给后头的小学生一包干脆面，记在一个小本子上。你站在门口看了一会儿。","effects":{"relation":1,"wisdom":1,"money":-1}},
  {"id":"echo_car85","min":24,"max":40,"require":"mark_car85","text":"商场里摆着台四驱车展示，几个孩子围着看。你站了一会儿，想起自己改马达、换轮胎的那些下午——车跑出去，你追着跑，跑得比车还快。","effects":{"freedom":1,"health":1}},
  {"id":"echo_lb85","min":24,"max":45,"era":"c1985","require":"originLB","text":"过年回家，你给爷爷奶奶包了个大红包。奶奶说起你小时候跟她跟得紧，灶台边那张小板凳她还留着。你坐上去试了试，腿都伸不直了，一屋子人笑。","effects":{"relation":2,"money":-2}},
  {"id":"echo_laidoff85","min":25,"max":45,"any":["famLaidOff85","famArrears85"],"text":"发了工资，你先往家里转一份。这些年一直这样。当年饭桌上摊开的那个账本，你妈还留着，字都淡了，上头的数目你一眼还能认出来。","effects":{"relation":2,"money":-1}},
  {"id":"echo_move85","min":24,"max":42,"require":"movedHome85","text":"后来你自己也搬过几回家。给孩子办转学手续，站在教务处门口等章的时候，你想起小时候那回——原来站在门口的大人，心里也是这么没底。","effects":{"relation":1,"freedom":-1}},
  // echo_addr85 never 分文（WP7 搬家拍全表面收口线）：走成年呈现层现行 textState 通道（year.js stateVariant
  // 按 S.state 域查、validate-state 已登记 { 域: { 状态值: 文本 } } 形状）；情感落点（多年后想起搬家那年、
  // 想起断了联系的人）保留，载体换成说好写信又断了的那批人，与序章 echoBySchooling.never 措辞对齐。
  {"id":"echo_addr85","min":25,"max":45,"require":"mark_move85","text":"收拾旧物，翻出上学时的文具盒，盖子内侧还留着一行铅笔字，是老同桌的地址，淡得快看不见了。你对着那行字想了半天——门牌号对面的那家人，后来也搬走了。","textState":{"schooling":{"never":"收拾旧物，你忽然想起搬家那年：说好要写信的那些人，信写了几封，后来慢慢就断了。你对着窗外想了半天——他们住的那条巷子，后来也换了人家，那些人现在在哪儿，你一个也不知道了。"}},"effects":{"relation":1,"wisdom":1}},
  {"id":"e85_001","ctx":{"tenureIn":[1,1]},"min":22,"max":24,"era":"c1985","text":"你上班之后，同事凑钱买了套小房子，首付是两边家里凑的。饭桌上他说，再晚半年就买不起了。你回去把自己的存折翻出来数了数，离首付还差着一截。","choices":[{"label":"开始攒首付，玩的钱先砍掉","effects":{"money":2,"freedom":-1},"echo":"你把工资分成三份，一份雷打不动存起来。同事喊你打牌，你去了，坐在旁边看。"},{"label":"先租着，钱留在手里活泛些","effects":{"freedom":1,"money":1},"echo":"房东说下季度涨五十。你嗯了一声，回去把行李又归置了一遍，纸箱没舍得拆。"}]},
  {"id":"e85_002","min":25,"max":28,"era":"c1985","text":"家里装了宽带那天，你把电脑从客厅搬回自己屋。网吧的会员卡里还剩七块钱，你没去退。楼下的网吧换了新招牌，包夜比你上学那会儿还便宜。","effects":{"growth":1,"freedom":1,"money":-1}},
  // e85_003：绑公历 2015（龄带 [26,35] 为全覆盖派生带）；1985 出生者呈现龄 30 岁逢瞥视站——瞥视不占年批后照常可达，见文件头注。
  {"id":"e85_003","min":26,"max":35,"minYear":2015,"maxYear":2015,"era":"c1985","text":"大盘冲上五千点那阵，单位里连食堂阿姨都在谈股票。你开了户，买了第一只，午休时总要看一眼。行情转头往下，账户里的数字一天比一天小。这笔钱怎么办，你盯着屏幕想了半天。","choices":[{"label":"割了，剩下的取出来存了定期","effects":{"money":-2,"wisdom":3},"echo":"你把软件卸了，跟自己说，这笔学费交过一回就够了。"},{"label":"套着就套着，先放那儿不管了","effects":{"money":-1,"health":-1},"echo":"那只股票的代码你背得比工号还熟，就是不怎么打开看了。"}]},
  {"id":"e85_004","min":40,"max":45,"era":"c1985","kidAgeMin":6,"kidAgeMax":7,"ctx":{"house":"owned"},"state":{"kids":"has"},"stateAll":{"spouse":"partnered"},"text":"政策放开都好几年了，你妈在电话里又提起来。你和另一半关起门来算账：大的刚上小学，房贷还剩不少，老人的身体也是一年不如一年。孩子在客厅看动画片，声音开得很大。第二个孩子，要不要？","choices":[{"label":"要，趁老人还能搭把手","effects":{"relation":2,"money":-3,"health":-1},"echo":"产检本上写满了日期，你把假提前跟单位打了招呼。","set":"kid2"},{"label":"就一个，把这一个养好","effects":{"money":1,"freedom":1},"echo":"这话你们跟老人说了三回，第三回他们没再接话，算是默认了。"}]},
  {"id":"e85_005","min":38,"max":45,"era":"c1985","ctx":{"car":"now"},"stateAll":{"dad":"alive"},"text":"你爸查出腰椎间盘突出那年，你请假陪他跑了三家医院。回来的路上他说，人老了就是这样。你把车开得很慢，想起小时候他骑车带你，你坐在后杠上，脚一晃一晃。","effects":{"relation":2,"health":-1}},
]);
