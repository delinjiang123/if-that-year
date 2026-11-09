// [M1-B 内容重组] 本文件现位于 src/content/prologue/cards.js（按领域重组搬入），除本行外内容一字未动。
// 《如果那年》开局出身牌数据与发牌（v0.13.0，设计：docs/DESIGN-V013.md §A）
// 结构：家底 family 16 / 性子 temper 16 / 时代注脚 era 每代 6（按年代分池），共 56 张、每局可达 38。
// 配比（§A5.2）：每类池内 好 ≈1/4、权衡 ≈1/2、坏 ≈1/4；坏牌净负、带小额补偿（以智慧为主）。
// 预算（用户裁定，中档＋双预算）：单项 ≤±5、每张总量 ≤9；每类池期望净注入 ≈0（三类合计 ≈0）；
//   智慧主注入牌每类 ≤3、单卡智慧 ≤+3，坏牌补偿智慧计入预算。机器核算见 DEVLOG v0.13.0。
// 钩子旗（hook_*）：先登记注册表（setter=牌 id）再写数据，消费事件在 pack33；牌不写 setState、不碰状态域（§A1.4）。
// 发牌用独立派生流（种子字符串 + 类别后缀），不消费主 RNG——同种子同年代牌面恒同，
// 且不平移主线事件序列；选牌是玩家动作，不耗任何随机流（与分岔选项同理）。
(function () {
  "use strict";
  // 与引擎同构的 FNV-1a 种子哈希与 mulberry 变体流（独立实例，不共享引擎 RNG.a）
  function cardSeedFromString(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function cardStream(seedInt) {
    let a = seedInt | 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 池中抽 3 不重复：部分 Fisher-Yates，固定消费 3 次随机数（与玩家选哪张无关）
  function draw3(pool, next) {
    const idx = pool.map((_, i) => i);
    const out = [];
    for (let k = 0; k < 3 && k < pool.length; k++) {
      const j = k + Math.floor(next() * (idx.length - k));
      const tmp = idx[k]; idx[k] = idx[j]; idx[j] = tmp;
      out.push(pool[idx[k]].id);
    }
    return out;
  }
  // fix4（序章四修·来历兼容约束）：家底牌可带 parentForm 声明父母形态——"home"＝牌面把父母写在
  // 孩子日常身边（在店里/院里/同厂大院/饭桌边/盯着管着，或孩子跟着家搬、住处由牌面另定照看户），
  // "away"＝牌面本身就是父母在外地（cf_09）。序章 start() 在留守掷定后按此声明校正 leftBehind
  // （与旧硬编码 cf_09/cf_01/cf_03 同路：不消费流、不改掷点，收成单一事实源头）；未声明的牌
  // （cf_04 爷爷院子/cf_06 手足/cf_07 奶奶带大/cf_14 饭桌吵/cf_16 有人盯着——均未点名父母在场）为
  // 中性，留守照常掷。逐张依据见 fix4-prologue/REPORT.md 的组合清单。
  const FAMILY = [
    // —— 好 4 ——
    { id: "cf_01", parentForm: "home", name: "柜台后头长大的", setting: "town", text: "你记事起，家里在街口开小卖部。你在柜台后头写作业，找零比同班同学都快，赊账的人站在门口，你爸从不催。", textBySchooling: { never: "你记事起，家里在街口开小卖部。你在柜台后头守着摊，找零算得比大人还快，赊账的人站在门口，你爸从不催。" }, effects: { money: 2, growth: 1 }, set: "hook_counter" },
    { id: "cf_02", parentForm: "home", name: "一柜子书", text: "你家客厅有一面墙的书柜，是你爸年轻时自己打的。书不新，有水利的、种地的、还有半套没凑齐的小说。你小学就把能认字的都翻了一遍。", textBySchooling: { never: "你家客厅有一面墙的书柜，是你爸年轻时自己打的。书不新，有水利的、种地的、还有半套没凑齐的小说。你没事就抽一本下来翻图，碰上你爸闲着，还让他念一段给你听。" }, effects: { growth: 2, wisdom: 1 }, set: "hook_books" },
    { id: "cf_03", parentForm: "home", name: "院子里支着作坊", text: "你爸在院子里支了个小作坊，修车、焊东西，十里八乡都来找。你放学先在边上递扳手，手上有把子力气，也知道东西坏了先拆开看。", textBySchooling: { never: "你爸在院子里支了个小作坊，修车、焊东西，十里八乡都来找。你整天在边上递扳手，手上有把子力气，也知道东西坏了先拆开看。" }, effects: { growth: 2, health: 1 } },
    { id: "cf_04", name: "爷爷留下的院子", setting: "rural", text: "老家院子是爷爷盖的，枣树比你岁数大。家里不富裕，可逢年过节一大家子人挤在院里，你从没觉得自家比谁矮一头。", effects: { relation: 2, health: 1 } },
    // —— 权衡 8 ——
    { id: "cf_05", parentForm: "home", name: "一个厂里出来的", setting: "factory", text: "你爸妈在同一个厂里干了一辈子。你在厂区大院长大，谁家今晚吃什么，闻味儿就知道。子弟学校、厂办医院、年终的澡票，都用过。", textBySchooling: { never: "你爸妈在同一个厂里干了一辈子。你在厂区大院长大，谁家今晚吃什么，闻味儿就知道。厂办医院、年终的澡票，都用过。" }, effects: { relation: 3, freedom: -1, money: -2 } },
    { id: "cf_06", name: "上头有姐姐，下头有弟弟", text: "你排老二。小时候新衣服先紧着姐姐，你穿剩下的再传给弟弟。家里吵吵闹闹，可吃饭永远多一双筷子等你。", effects: { relation: 3, money: -3 }, set: "hook_siblings" },
    { id: "cf_07", name: "奶奶带大的", text: "爸妈忙，你小时候跟奶奶住。她的咸菜坛子在墙角，你的乳牙是在她的摇椅边换的。她不识字，可谁家欠谁家人情，她记得比账本还清。", effects: { relation: 2, freedom: -2 }, set: "hook_grandma" },
    { id: "cf_08", parentForm: "home", name: "搬过三回家", text: "你上小学搬过一回，初中又搬一回，学校换了三个。刚混熟的同学，转眼就断了联系。你收拾行李比谁都快，新地方睡第一晚也不认床。", textBySchooling: { never: "你小时候搬过一回，大些又搬一回，住处换了三个。刚混熟的玩伴，转眼就断了联系。你收拾行李比谁都快，新地方睡第一晚也不认床。" }, effects: { freedom: 3, relation: -3 }, set: "hook_moved_kid" },
    { id: "cf_09", parentForm: "away", name: "爸妈在外地那些年", text: "你小学有几年，爸妈在外地打工，过年才回来，带一包那边的水果糖。平时是爷爷接你放学。电话那头问你考试多少分，你报完成绩，两边就没话了。", textBySchooling: { never: "你小时候有几年，爸妈在外地打工，过年才回来，带一包那边的水果糖。平时是爷爷带着你。电话那头问你长高了没有、帮家里干了什么活，你报完，两边就没话了。" }, textByMigrant: "爸妈刚去外地打工那几年，你还没被接走，跟着爷爷过。过年他们才回来，带一包那边的水果糖。平时是爷爷带着你，电话那头问你长高了没有、帮家里干了什么活，你报完，两边就没话了。", effects: { money: 2, relation: -2 } },
    { id: "cf_10", parentForm: "home", name: "家里开过饭馆", setting: "town", text: "你家开过两年小饭馆，你在后厨择菜、记菜单，忙起来端盘子。后来不干了，灶台拆了，可你闻味儿就知道菜咸了还是淡了，嘴比一般人刁。", effects: { growth: 2, health: -1, money: -1 } },
    { id: "cf_11", parentForm: "home", name: "家里就你一个", text: "家里就你一个孩子。逢年过节，亲戚的红包都冲着你来；可家里的大事小事也没个商量的人，爸妈的眼睛全长在你身上。", effects: { relation: 2, freedom: -2 }, set: "only_child" },
    { id: "cf_12", parentForm: "home", name: "住在外婆家", text: "你中学几年住在外婆家，离学校近。她每天变着法给你加餐，鸡蛋永远卧两个。你长高得快，校服一年短一截，钱多半花在吃上了。", textBySchooling: { never: "你小时候有几年住在外婆家，离家里干活的地方近。她每天变着法给你加餐，鸡蛋永远卧两个。你长高得快，衣裳一年短一截，钱多半花在吃上了。" }, effects: { health: 2, money: -1, relation: -1 } },
    // —— 坏 4（净负，带智慧补偿）——
    { id: "cf_13", parentForm: "home", name: "家里欠着账", text: "你记事起，家里就欠着亲戚一笔钱。过年债主来家里坐坐，你妈让你回屋写作业。门关上，外头的说话声一直压得很低。", textBySchooling: { never: "你记事起，家里就欠着亲戚一笔钱。过年债主来家里坐坐，你妈让你回屋待着。门关上，外头的说话声一直压得很低。" }, effects: { money: -4, wisdom: 1 } },
    { id: "cf_14", name: "饭桌上吵的那些年", text: "你小时候，家里饭桌上经常吃着吃着就吵起来。你学会听脚步声判断今晚的气氛，作业写得飞快，就怕被喊去评理。", textBySchooling: { never: "你小时候，家里饭桌上经常吃着吃着就吵起来。你学会听脚步声判断今晚的气氛，手上的活干得飞快，就怕被喊去评理。" }, effects: { relation: -3, freedom: -1, wisdom: 1 } },
    { id: "cf_15", parentForm: "home", name: "家里出过一场大病", text: "你十来岁那年，家里有人住了大半年院。药费单子摞起来有一指厚，你妈把能借的亲戚都借遍了。你放学先去医院送饭，再回学校上晚自习。", textBySchooling: { never: "你十来岁那年，家里有人住了大半年院。药费单子摞起来有一指厚，你妈把能借的亲戚都借遍了。你天天先去医院送饭，送完再赶回家干活。" }, effects: { money: -3, health: -1, wisdom: 1 } },
    { id: "cf_16", name: "家里管得严", text: "你家规矩大：几点回家、跟谁玩、零花钱怎么花，都有人盯着。你没在外头闯过祸，可同学约的那些局你多半去不了，只能听他们第二天讲。", textBySchooling: { never: "你家规矩大：几点回家、跟谁玩、零花钱怎么花，都有人盯着。你没在外头闯过祸，可巷子里孩子们约的那些局你多半去不了，只能听他们第二天讲。" }, effects: { freedom: -3, growth: 1 } },
  ];
  const TEMPER = [
    // —— 好 4 ——
    { id: "ct_01", name: "板凳上像有钉子", text: "你小时候板凳上像有钉子，为这个挨过不少说。可爬墙上树你从来都是第一个，摔下来的次数也数不清，胳膊上的疤一直都在。", act: "坐不住，溜到院里爬树", actEcho: "你从树上下来，裤腿蹭破一块。婶子先笑后骂，喊你去换条裤子。", deed: "溜到院里爬了树", effects: { health: 3, freedom: 2, growth: -1 }, set: "hook_sporty" },
    { id: "ct_02", name: "眼镜片一年比一年厚", text: "你从小坐得住。一本书能从天亮看到天黑，家里人喊吃饭要喊三遍。为这个你近视来得早，眼镜片一年比一年厚。", act: "躲到里屋，抱着本书看", actBySchooling: { never: "躲到里屋，抱着本画书翻" }, actEcho: "喊你吃饭喊了三遍，你才把书扣下出来。", actEchoBySchooling: { never: "你把一本画书从头翻到尾。喊你吃饭喊了三遍，你才出来。" }, deed: "躲到里屋看书", deedBySchooling: { never: "躲到里屋翻画书" }, effects: { growth: 3, wisdom: 1, health: -1 } },
    { id: "ct_03", name: "见人先打招呼", text: "你从小嘴甜，见人先打招呼。亲戚都喜欢你，过年压岁钱总比哥哥多几张。你也早早学会了：话说得好听，路就宽一点。", act: "挨个给客人倒茶、打招呼", actEcho: "婶子拉着你的手不放，扭头跟你妈说，这孩子将来饿不着。", actEchoLB: "婶子拉着你的手不放，扭头跟你奶奶说，这孩子将来饿不着。", deed: "挨个给客人倒茶打招呼", effects: { relation: 2, growth: 1 } },
    { id: "ct_04", name: "拆过的闹钟能装回去", text: "你手巧，拆过的闹钟能装回去，坏了的插线板也敢修。邻居家电器出毛病，先敲你家的门。你为此得意了好多年。", act: "拆开那只停了的闹钟，试着装回去", actEcho: "闹钟真让你装响了。你爸当着客人夸了你一句。", actEchoLB: "闹钟真让你装响了。客人当场夸了你一句。", deed: "拆开闹钟又装了回去", effects: { growth: 2, relation: 1 } },
    // —— 权衡 8 ——
    { id: "ct_05", name: "饭吃到最后", text: "你干什么都不紧不慢。作业写到最后，饭吃到最后，可交到你手里的事很少出错。急脾气的老师点过你几回名，后来也习惯了。", act: "在灶台边慢慢择菜，不催不赶", actEcho: "大人看了一眼：菜择得干净，就是慢。头一桌都开席了，你还没择完。", deed: "在灶台边慢慢择菜", effects: { growth: 2, freedom: -1, relation: -1 } },
    { id: "ct_06", name: "心里存不住话", text: "你心里存不住话，高兴不高兴都写在脸上。为此得罪过人，也交下几个真朋友——他们说，跟你打交道不用猜。", act: "当场把听来的话学给客人听", actEcho: "桌上静了一下。你妈赶紧往你碗里夹了块肉。", actEchoLB: "桌上静了一下。你奶奶赶紧往你碗里夹了块肉。", deed: "当场学了大人背地里的话", effects: { relation: 2, freedom: -2 } },
    { id: "ct_07", name: "账算不清，对一晚上", text: "你认死理。账算不清你能对一晚上，理说不通你能跟人争到脸红。为这个家里人说你倔，可交给你的数字从没出过大错。", act: "抱着家里的账本，一笔一笔对", actEcho: "对到最后，一笔八毛钱的账对上了。你才肯去吃饭。", deed: "抱着账本一笔笔对", effects: { growth: 2, relation: -2 } },
    { id: "ct_08", name: "家里来客就躲屋里", text: "你小时候怕见生人，家里来客你就躲屋里。长大些好些了，可当众说话还是心跳得厉害，要提前在心里排练好几遍。", act: "客人一进门，先躲进里屋", actEcho: "你在里屋听了一下午热闹。饭摆好，你妈进来拉你，说就差你了。", actEchoLB: "你在里屋听了一下午热闹。饭摆好，你奶奶进来拉你，说就差你了。", deed: "躲进了里屋", effects: { growth: 2, wisdom: 1, relation: -2 } },
    { id: "ct_09", name: "河沟里的鱼", text: "你小时候心思不在书本上，弹珠、卡片、河沟里的鱼，哪样都比课本有意思。成绩单拿回家，你爸的脸比锅底还黑。", act: "吃两口就溜出去疯跑", actEcho: "回来时你一身土，饭菜都凉了。你扒了两口冷饭。", deed: "吃两口就溜出去疯跑", effects: { growth: -2, freedom: 1, health: 1 } },
    { id: "ct_10", name: "第一个睡不着", text: "你比同龄人懂事得早。大人说话你听得懂一半，就学会看脸色。家里有事，你是第一个被喊去商量的，也是第一个睡不着的。", act: "帮着端菜，照看小的那几个", actEcho: "你忙前忙后。散席了才发现，自己没吃饱。", deed: "帮着端菜照看小的", effects: { relation: 2, wisdom: 1, health: -1, freedom: -2 } },
    { id: "ct_11", name: "老师总点你上台", text: "学校汇演，老师总点你上台。你不怯场，报幕、朗诵都行，台下坐多少人都不慌。奖状没得几张，这份胆量你带了半辈子。", act: "被大人起哄，站到桌前唱了一段", actEcho: "唱完一桌人鼓掌。你耳朵有点热，倒没怯。", deed: "站到桌前唱了一段", effects: { growth: 2, freedom: -1, relation: -1 }, set: "hook_stage" },
    { id: "ct_12", name: "一个人走夜路", text: "你胆子大，敢爬最高的树，敢一个人走夜路。为此摔过、丢过、被找过，家里人的心跟着你提了十几年。", act: "自告奋勇，摸黑去巷口买盐", actEcho: "你跑了个来回，气没喘匀。盐递过去，正赶上下锅。", deed: "摸黑去巷口买了盐", effects: { freedom: 2, health: -2 } },
    // —— 坏 4（净负，带智慧补偿）——
    { id: "ct_13", name: "病历本比课本厚", text: "你小时候三天两头往医院跑，病历本摞起来比课本还厚。体育课你多半坐在边上看，看着看着，就把课本从头翻到尾了。", act: "在里屋躺着，听外头的热闹", actEcho: "热闹都是隔着门听的。有人进来给你掖被角，端了碗热汤。", deed: "在里屋躺着听热闹", nameBySchooling: { never: "病历本摞得老高" }, textBySchooling: { never: "你小时候三天两头往医院跑，病历本摞起来老厚一叠。别人在外头疯跑，你多半坐在边上看，看着看着，倒把大人的话记得比谁都全。" }, effects: { health: -4, growth: 1, wisdom: 1 }, set: "hook_frail" },
    { id: "ct_14", name: "三句问不出一句", text: "你性子闷，三句问不出一句。家里来客你打个招呼就回屋，同学聚会你总坐在边上。好多事你心里明白，就是不说。", act: "在人堆边上坐着，笑笑，不说话", actEcho: "一下午你没说几句话。谁的水杯空了，你倒是都看见了。", deed: "在人堆边上坐了一下午", effects: { relation: -3, growth: -1, wisdom: 1 } },
    { id: "ct_15", name: "话赶话就上头", text: "你脾气急，话赶话就上头，事后又后悔。为这个，你跟人红过脸，也跟自己生过闷气，胃就是那时候落下的毛病。", act: "跟表哥抢东西，话赶话吵起来", actEcho: "吵完你躲到院里生气。饭好了，还是他先来喊的你。", deed: "跟表哥吵了一架", effects: { relation: -2, health: -2, wisdom: 1 } },
    { id: "ct_16", name: "一道题做三遍", text: "你念书不开窍，同一道题别人一遍会，你要三遍。老师说你不用功，你在台灯底下坐到半夜，只有你自己知道。", act: "躲开热闹，在里屋把一道题算了三遍", actBySchooling: { never: "在灶屋学烧火，添柴添了三遍才稳住" }, actEcho: "等你算完，外头席都快散了。你倒不觉得亏。", actEchoBySchooling: { never: "等你把火看稳，外头席都快散了。你倒不觉得亏。" }, deed: "在里屋把一道题算了三遍", deedBySchooling: { never: "学烧火添了三遍柴" }, nameBySchooling: { never: "一件活上手三遍" }, textBySchooling: { never: "你学东西不开窍，同一件活别人看一遍就会，你得上手三遍。大人说你不用心，你在灯底下练到半夜，只有你自己知道。" }, effects: { growth: -3, wisdom: 1 } },
  ];
  const ERAS = {
    c1955: [
      { id: "ce55_01", calFrom: 1977, name: "赶上恢复高考", needsSchooling: ["school", "half"], text: "一九七七年，广播里说恢复高考了。你把箱子底的课本翻出来，煤油灯芯剪了又剪。这件事把你这一茬人的日子，从中间劈成了两半。", effects: { growth: 1, wisdom: 1 } },
      { id: "ce55_02", name: "拜师学艺的年月", text: "那年月，十几岁的孩子拜师学手艺是常事：管吃管住，没工钱，师傅骂得凶，看家的本事倒不藏着掖着。谁家孩子出了师，巷口都要议论两天。", effects: { growth: 2, relation: 1 } },
      { id: "ce55_03", name: "粮票布票的年月", needsSchooling: ["school", "half"], text: "你记事起，买什么都要票。粮票、布票、肉票，你妈用手绢包着，压在箱子底。你小学就会算家里这个月还剩几两油。", effects: { wisdom: 1, money: -2, health: -1 } },
      { id: "ce55_04", name: "上山下乡那些年", text: "那几年，城里的年轻人一批批下乡，插队、落户，学着挑水、插秧。走的时候敲锣打鼓，回城的人，那顶草帽还留在老乡家的墙上。", effects: { health: 2, growth: -1, freedom: -1 } },
      { id: "ce55_05", name: "家里那台收音机", text: "你家那台收音机是全巷子头一台。晚上一开，邻居端着小板凳就来了。你趴在桌边听评书，字就是那时候认全的。", effects: { growth: 1, relation: 1, money: -2 }, set: "hook_era_radio" },
      { id: "ce55_06", name: "念书断了几年", needsSchooling: ["school", "half"], text: "你正上学的年纪，学校停了课。你在家帮着干活，课本压在灶台边，落了灰。后来再捡起来，好些东西要从头补。", effects: { growth: -3, wisdom: 1 } },
    ],
    c1965: [
      { id: "ce65_01", name: "家里买了电视机", needsSchooling: ["school", "half"], text: "你上初中那年，家里咬牙买了台电视机，黑白的。搬回来那天，全楼的人都来看。你负责每天上房顶转天线，手举酸了，画面就稳了。", effects: { relation: 2, growth: 1 } },
      { id: "ce65_02", calFrom: 1978, name: "考不考大学那阵子", text: "恢复高考以后，考不考大学是家家都要吵一回的事：考上了是条道，进厂接班也是条道，两边说得都有理。报名的日子一到，学校门口排起长队。", effects: { growth: 2, relation: -2, freedom: 1 } },
      { id: "ce65_03", name: "万元户的新闻", needsSchooling: ["school", "half"], text: "你念书那几年，报纸上开始登万元户。老师把那页贴在教室后面。你回家算了算自家的存折，差着十万八千里，可心里有个数字，从此不一样了。", effects: { growth: 1, freedom: 1, relation: -1 } },
      { id: "ce65_04", name: "磁带和喇叭裤", text: "你年轻时攒钱买过一条喇叭裤、一台双卡录音机。磁带转起来，整条街都听得见。你为这个被你爸说了半个月，裤子还是穿出去了。", effects: { freedom: 2, money: -2, relation: 1 }, set: "hook_era_tape" },
      { id: "ce65_05", name: "亲戚下海赔过", needsSchooling: ["school", "half"], text: "你上中学时，有个亲戚辞职下海，头两年风光，后来赔了。过年他坐在角落里不说话，你爸把烟递过去，两个人抽了半宿。", effects: { money: -2, relation: -1, wisdom: 1 } },
      { id: "ce65_06", name: "家里分过家", text: "你十几岁那年，家里为老房子的事分了家。亲戚在院子里吵了三天，你搬着小板凳坐在门槛上，听了个全场。从此过年，有些人就不在一张桌子上了。", effects: { relation: -3, wisdom: 1 } },
    ],
    c1978: [
      { id: "ce78_01", name: "第一批学电脑的", needsSchooling: ["school", "half"], text: "你上中学时，学校机房刚配了电脑，上机要穿鞋套。你把键盘指法练得飞快，老师让你给全班演示，你紧张得手心全是汗。", effects: { growth: 2 } },
      { id: "ce78_02", name: "家里装了电话", text: "你家装电话那年，要排队等号。装好那天，你给每个同学打了一遍，就说一句：我家有电话了。话费单月底寄来，你妈心疼了好几天。", effects: { relation: 2, money: -2 } },
      { id: "ce78_03", name: "录像厅的年代", needsSchooling: ["school", "half"], text: "你中学时，街口有家录像厅，一块钱看一下午。你去过几回，回来被老师点名。那些片子里的城市和街道，你后来真的去过了。", effects: { freedom: 2, growth: -1, health: -1 } },
      { id: "ce78_04", name: "南方有亲戚", text: "你有个亲戚早早去了南方。每次回来，穿的、用的都跟本地不一样，还说那边遍地是机会。你听得心里痒痒，又有点怕。", effects: { freedom: 1, relation: -1 }, set: "hook_era_south" },
      { id: "ce78_05", name: "攒钱买随身听", needsSchooling: ["school", "half"], text: "你攒了半年零花钱，买了台随身听。磁带是借的，歌词抄在笔记本上。晚自习你塞一只耳机，被同桌告了密，机器在班主任抽屉里躺到期末。", effects: { freedom: 2, growth: 1, money: -2 } },
      { id: "ce78_06", name: "家里那回集资", needsSchooling: ["school", "half"], text: "你上小学时，家里跟风把钱投进过一个集资，说是利息高。后来那笔钱要回来一半都难，家里为这个吵了小半年，饭桌上不许再提那两个字。", effects: { money: -3, wisdom: 1 } },
    ],
    c1985: [
      { id: "ce85_01", name: "网吧那几年", text: "那几年，街口的网吧一家挨着一家，两块钱一小时，通宵还有包夜价。放学绕路去看一眼的人不少；家里添了电脑的人家，孩子就去得少了。", effects: { growth: 2, health: -1 } },
      { id: "ce85_02", calFrom: 2003, name: "非典那年", needsSchooling: ["school", "half"], text: "二〇〇三年，非典那年。街上空了好些日子，进出都要量体温，学校封了校门。你妈把口罩洗了又洗，挂在阳台上晾着。", effects: { growth: 1, wisdom: 1 } },
      { id: "ce85_03", name: "扩招那阵子", text: "你十八九岁那几年正赶上扩招，大学一年比一年招得多。考上的欢天喜地；等他们毕业才发现，找工作的人也一年比一年多。", effects: { growth: 1, freedom: 1, relation: -1 } },
      { id: "ce85_04", calFrom: 2001, name: "申奥那晚", text: "二〇〇一年，申奥成功那晚，你跟着大人在街上站了半宿，锣鼓响到后半夜。那股热乎劲，你后来好多年没再见过。", effects: { relation: 2 } },
      { id: "ce85_05", name: "你爸的呼机", text: "你爸腰里别着个呼机，响了就满街找电话回。你把要回的号码抄在小本子上，字写得又大又端正，怕他看不清。", effects: { relation: 1, money: -2 }, set: "hook_era_pager" },
      { id: "ce85_06", name: "MP3 不离耳", text: "你攒钱买了台 MP3，歌是从同学电脑里拷的。耳机戴了一年多，体检时医生让你少戴。你嘴上答应，转头又塞上了。", effects: { freedom: 2, health: -1, money: -1 } },
    ],
    c1995: [
      { id: "ce95_01", calFrom: 2008, name: "奥运那年", text: "二〇〇八年，北京开了奥运会。学校组织看开幕式，那年夏天，家里的电视几乎没关过。福娃那首歌，你听得都会唱了。", effects: { relation: 1, growth: 1 }, set: "hook_era_olympic" },
      { id: "ce95_02", name: "半夜起来偷菜", needsSchooling: ["school", "half"], text: "你上初中时班里都玩种菜偷菜。你定了半夜的闹钟起来收菜，第二天上课直点头。你妈发现后，把电脑设了密码。", effects: { freedom: 1, growth: -1, health: -1 } },
      { id: "ce95_03", name: "第一部智能手机", text: "那几年，大人换手机换得勤，家里换下来的旧机子就到了你手里。屏幕不大，看新闻、听歌都够用。你慢慢习惯了，睡前先看一眼手机才睡。", effects: { freedom: 1, relation: 1, health: -1 } },
      { id: "ce95_04", calFrom: 2011, name: "双十一帮着抢", text: "双十一刚热闹起来那几年，你帮你妈在电脑上抢东西，零点一过，手比翻书还快。包裹一个接一个送到家，你妈拆着拆着说，这个月说啥也不能再买了。", effects: { relation: 1, money: -1 } },
      { id: "ce95_05", name: "村里开了网店", needsSchooling: ["school", "half"], text: "你上中学时，村里有人开网店卖山货。你帮着拍过照、打过包，头一回知道，货还能这么卖。", effects: { growth: 2, freedom: -1 } },
      { id: "ce95_06", name: "眼睛先坏了", text: "你小学就迷上了电脑，眼镜三年换了四副。体检表上视力那栏，你妈看一次叹一回气，后来把电脑设了密码。", effects: { health: -3, growth: 1 } },
    ],
    c2000: [
      { id: "ce00_01", name: "兴趣班没白上", text: "你小学被送去学过画画，学了三年，没走这条路。可你配色、看构图的底子留下了，工作汇报的图，你做的总比别人清楚。", effects: { growth: 2, relation: 1 } },
      { id: "ce00_02", name: "网吧那几年", needsSchooling: ["school", "half"], text: "你上初中时，学校后门开了一排网吧。你去过，也在门口被班主任堵过。家里那台电脑买回来那天，拨号音响了整整一晚。", effects: { growth: 2, health: -1 } },
      { id: "ce00_03", name: "手机是高中才有的", needsSchooling: ["school", "half"], text: "你高中才有自己的手机，二手的，屏幕裂了一道。班里群聊你总跟不上，消息攒到晚上才看。为这个你落过几次通知，也躲过不少热闹。", effects: { freedom: 1, relation: -1 } },
      { id: "ce00_04", name: "小升初摇号那年", needsSchooling: ["school", "half"], text: "你小升初那年赶上摇号，电脑派到哪所算哪所。你妈盯着屏幕手心出汗，你倒先去洗了个澡。学校不算近，你骑车单程四十分钟，腿力就这么练出来了。", effects: { health: 1, freedom: 1, growth: -1 }, set: "hook_era_lottery" },
      { id: "ce00_05", name: "小店挨着网店的年月", text: "那几年，街上的小店一家家学着拍照上架，学得直揉眼睛。网上的货便宜，店里的货摸得着，两边的人说话都带着点火药味。", effects: { money: -2, relation: -1, wisdom: 1 } },
      { id: "ce00_06", name: "眼睛早早坏了", text: "你小学就戴上了眼镜，度数一年涨一截。体检表上那一行，你妈每次看都要叹口气。体育课的眼镜托，你换了七八个。", effects: { health: -3, growth: 1 } },
    ],
  };
  const byId = {};
  for (const c of [...FAMILY, ...TEMPER, ...Object.values(ERAS).flat()]) byId[c.id] = c;
  // ---- fix3（WP8 三修线·共享家底牌 schooling 门控，opt-in、自包含于本文件）----
  // 背景：FAMILY 原文是给「进过校门」的人写的来历质地，16 张里 11 张带在校预设
  // （学校/作业/同学/放学/考试/校服/晚自习等，逐张见 fix3 报告）。处境 never（没进过校门）
  // 的人在第一屏（来历幕）读到这些句子、两屏后就被「开学那天，你没去」自打。处置＝分文优先：
  // 11 张带预设的牌各带 textBySchooling.never 分文（家底事实、effects、set 钩子一字不动，
  // 只换呈现文本；分文同样不带任何在校词面）；无预设的 5 张（cf_04/06/07/10/11）不带分文、
  // 任何处境都读原文。left（退学）逐张核过：全部预设句都落在他真实在读的年月（小学/初中
  // 在读期），没有任何一张预设退学后仍在读、升学或毕业，故 left 不设分文、读原文。
  // 呈现解析（本文件内闭环，不改任何呈现层文件）：带 never 分文的牌，其 text 改为按当前
  // 处境解析的呈现面——处境 never 时读分文，其余一切情形（school/half/left，以及无上下文
  // 的工具/校验直读）逐字读原文，school 线呈现文本因此逐字不变。处境来源：优先在局上下文
  // （window.IFY.S.prologue.situation，浏览器正局）；其次最近一次 deal() 的处境预判——序章
  // start() 先调 deal() 再掷处境，掷处境只消费序章流第一格、权重表在 GAME_PROLOGUE.situationW
  // 公开登记，故 deal 时可同公式预判并记下，来历幕呈现即以此为准（校验/工具进程以此为
  // 呈现口径，与序章引擎实发处境的逐局一致性由 fix3 专属校验脚本对六代种子批交叉断言）。
  // 权重表在册时读登记表，不在册时用下方镜像兜底（镜像与登记表逐字一致同受该断言看护）。
  // 另备显式解析口 GAME_CARDS.familyText(id, schooling)：不读任何上下文，never 回分文、
  // 其余口径逐字回原文，供校验与后续呈现层显式接线时使用。
  const SITUATION_W_MIRROR = {
    c1955: [["school", 46], ["half", 34], ["never", 20]],
    c1965: [["school", 66], ["half", 26], ["never", 8]],
    c1978: [["school", 83], ["half", 14], ["never", 3]],
    c1985: [["school", 88], ["half", 10], ["never", 2]],
    c1995: [["school", 94], ["half", 5], ["never", 1]],
    c2000: [["school", 88], ["half", 9], ["never", 3]],
  };
  let dealSituation = null; // 最近一次 deal() 的处境预判；从未 deal 过的进程恒 null＝读原文
  function predictSituation(seedStr, eraId) {
    let table = null;
    try { const P = window.GAME_PROLOGUE; if (P && P.situationW && P.situationW[eraId]) table = P.situationW[eraId]; } catch (e) { /* 沙盒语境走镜像表 */ }
    if (!table) table = SITUATION_W_MIRROR[eraId] || SITUATION_W_MIRROR.c2000;
    const total = table.reduce((s, [, w]) => s + w, 0);
    let roll = cardStream(cardSeedFromString(String(seedStr) + "#prologue"))() * total;
    for (const [name, w] of table) { if (roll < w) return name; roll -= w; }
    return table[0][0];
  }
  function activeSituation() {
    try {
      const S = window.IFY && window.IFY.S;
      if (S && S.prologue && S.prologue.situation) return S.prologue.situation;
      if (S && S.state && S.state.schooling === "never") return "never";
    } catch (e) { /* 无在局上下文（工具/校验直读）：落到 deal 预判 */ }
    return dealSituation;
  }
  // ---- fix4（WP8 四修线·cf_09 随迁分文＋性子牌名/文分文，opt-in、自包含于本文件，沿 fix3 风格）----
  // cf_09「爸妈在外地那些年」写的是留守质地（爷爷照看、电话问话）：随迁局（孩子已被带走、与父母
  // 同住）同屏读到它，与 origin 的随迁行是互斥事实（三审甲实测 25/2500 同屏）。处置＝分文：
  // cf_09 带 textByMigrant 分文，把爷爷照看的那几年明确收在「还没被接走」的那一段，与随迁行
  // 构成先后而非同屏互斥；分文走在学口径上取 never 安全措辞（爷爷带着你/问长高），school 与
  // never 随迁者同读此文。effects/set 一字不动。呈现解析与 fix3 同路：getter 优先读在局的
  // S.prologue.migrantChild（序章 start 落定后 present 才读牌文，时序成立）；无在局上下文
  // （工具/校验直读）时随迁不可知，恒回落 fix3 口径（never 分文或原文），school 线逐字不变。
  // 性子牌 ct_13「病历本比课本厚」/ct_16「念书不开窍」：序章性子拍只呈现牌名、开局牌阵呈现
  // 名＋文，never 者读到的仍是在校口径——两张各带 nameBySchooling.never 与 textBySchooling.never
  // 分文（只换名与文，effects/set 不动），getter 与家底牌同机制（处境 never 才换，其余逐字原文）。
  function activeMigrant() {
    try {
      const S = window.IFY && window.IFY.S;
      if (S && S.prologue && typeof S.prologue.migrantChild === "boolean") return S.prologue.migrantChild;
    } catch (e) { /* 无在局上下文：随迁不可知，回落 fix3 口径 */ }
    return false;
  }
  const canonicalText = {}; // 家底牌原文定版（getter 安装前留存，school/half/left 与显式解析的回落面）
  for (const c of FAMILY) {
    canonicalText[c.id] = c.text;
    const hasNeverText = !!(c.textBySchooling && c.textBySchooling.never);
    const hasMigrantText = typeof c.textByMigrant === "string";
    if (!hasNeverText && !hasMigrantText) continue;
    Object.defineProperty(c, "text", {
      enumerable: true, configurable: true,
      get() {
        if (hasMigrantText && activeMigrant()) return c.textByMigrant;
        return hasNeverText && activeSituation() === "never" ? c.textBySchooling.never : canonicalText[c.id];
      },
    });
  }
  function familyText(idOrCard, schooling, migrant) {
    const c = typeof idOrCard === "string" ? byId[idOrCard] : idOrCard;
    if (!c) return "";
    if (migrant && typeof c.textByMigrant === "string") return c.textByMigrant;
    if (schooling === "never" && c.textBySchooling && c.textBySchooling.never) return c.textBySchooling.never;
    return Object.prototype.hasOwnProperty.call(canonicalText, c.id) ? canonicalText[c.id] : c.text;
  }
  const canonicalTemper = {}; // 性子牌原名/原文定版（getter 安装前留存）
  for (const c of TEMPER) {
    const hasNameVar = !!(c.nameBySchooling && c.nameBySchooling.never);
    const hasTextVar = !!(c.textBySchooling && c.textBySchooling.never);
    if (!hasNameVar && !hasTextVar) continue;
    canonicalTemper[c.id] = { name: c.name, text: c.text };
    if (hasNameVar) Object.defineProperty(c, "name", {
      enumerable: true, configurable: true,
      get() { return activeSituation() === "never" ? c.nameBySchooling.never : canonicalTemper[c.id].name; },
    });
    if (hasTextVar) Object.defineProperty(c, "text", {
      enumerable: true, configurable: true,
      get() { return activeSituation() === "never" ? c.textBySchooling.never : canonicalTemper[c.id].text; },
    });
  }
  function temperName(idOrCard, schooling) {
    const c = typeof idOrCard === "string" ? byId[idOrCard] : idOrCard;
    if (!c) return "";
    if (schooling === "never" && c.nameBySchooling && c.nameBySchooling.never) return c.nameBySchooling.never;
    return Object.prototype.hasOwnProperty.call(canonicalTemper, c.id) ? canonicalTemper[c.id].name : c.name;
  }
  // 发牌：三类各用独立派生流（§A3.1）。换年代只重发时代行（家底/性子的种子不含 eraId）。
  function deal(seedStr, eraId) {
    dealSituation = predictSituation(seedStr, eraId); // fix3：处境预判（纯函数、自开流，不消费任何既有随机流，发牌结果一字不变）
    const eraPool = ERAS[eraId] || ERAS.c2000;
    return {
      family: draw3(FAMILY, cardStream(cardSeedFromString(seedStr + "::cards::family"))),
      temper: draw3(TEMPER, cardStream(cardSeedFromString(seedStr + "::cards::temper"))),
      era: draw3(eraPool, cardStream(cardSeedFromString(seedStr + "::cards::era::" + (eraId || "c2000")))),
    };
  }
  window.GAME_CARDS = { family: FAMILY, temper: TEMPER, eras: ERAS, byId, deal, familyText, temperName, predictSituation };
})();
