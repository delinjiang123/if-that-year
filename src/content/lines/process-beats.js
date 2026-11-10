// [M1-B 内容重组] 本文件现位于 src/content/lines/process-beats.js（按领域重组搬入），除本行外内容一字未动。
// 扩展包 36（v0.18.0）：① 父母进程节拍与 dating 到期结算（procOnly 条目——只由引擎进程呈现，不进普通抽取池）；
// ② 职业语境的入行拍（从医/长途）与链后继——村医、长途类稀有与结局自本轮起以真实入行经历为门（审计急修 B5）；
// ③ 处境回响（识字线/half 线/never 线/work 轨道的成年回响，地基第一步 C8）。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
  // —— 父母进程节拍（proc_dad/proc_mom × care/hosp/dead）：呈现时机由父母进程决定，文本与选项在此 ——
  { id: "proc_dad_care", min: 22, max: 80, procOnly: true, set: "care_stage", text: "你爸的身体这一年明显不行了。电话里他还说没事，可捎话的人说，他上楼要歇两回，买的菜也提不动。你妈在电话那头压低声音：你有空，回来看看吧。", textState: { mom: { dead: "你爸的身体这一年明显不行了。电话里他还说没事，可捎话的人说，他上楼要歇两回，买的菜也提不动。捎话的人临走压低声音：你有空，回来看看吧。" } },
    choices: [
      { label: "请一段长假，回去陪一阵", set: "care_self", effects: { relation: 4, money: -3, freedom: -2 }, echo: "你在家住了一个月。陪他去医院，陪他在院里晒太阳。他嘴上说你瞎耽误工夫，可你走那天，他站在门口看了半天。" },
      { label: "请个护工帮着，自己管钱管事", set: "care_hired", effects: { money: -5, relation: 1 }, echo: "护工是邻居介绍的，干活利索。你每月按时打钱，隔几天打个电话问一遍，心里才算踏实。" },
      { label: "先观察一段，周末多回去", effects: { relation: 1, freedom: -1 }, echo: "你把周末的安排改了，能回就回。路上的时间变多了，可有些事，错过就是错过了。", echoNear: "你把手边的事都排开了，三天两头过去坐坐。陪着的日子是多了，可有些事，错过就是错过了。" },
    ] },
  { id: "proc_mom_care", min: 22, max: 80, procOnly: true, set: "care_stage", text: "你妈的身体这一年明显不行了。她自己下厨都要扶着灶台站，夜里起来好几回。电话里她说不用你管，可你听得出来，她是怕拖累你。",
    choices: [
      { label: "请一段长假，回去陪一阵", set: "care_self", effects: { relation: 4, money: -3, freedom: -2 }, echo: "你在家住了一个月。给她做饭，扶她在屋里慢慢走。她总说自己能行，可你端过去的饭，她都吃完了。" },
      { label: "请个护工帮着，自己管钱管事", set: "care_hired", effects: { money: -5, relation: 1 }, echo: "护工是邻居介绍的，干活利索。你每月按时打钱，隔几天打个电话问一遍，心里才算踏实。" },
      { label: "先观察一段，周末多回去", effects: { relation: 1, freedom: -1 }, echo: "你把周末的安排改了，能回就回。路上的时间变多了，可有些事，错过就是错过了。", echoNear: "你把手边的事都排开了，三天两头过去坐坐。陪着的日子是多了，可有些事，错过就是错过了。" },
    ] },
  // —— 照护预警信号拍（v0.20.0 M2 收尾）：care 之前 2–4 年、每位父母至多一次的轻量提示；触发与时点在父母进程（signalAgeOf），本条目只管文本，不立旗、不动状态 ——
  { id: "proc_dad_signal", min: 22, max: 80, procOnly: true, text: "这一年，你爸的身体露出点苗头。陪他去体检，报告上有几项被圈出来，他摆摆手说没事。回家上楼，他在二楼平台上歇了一回，从前没有过。你把复查的日子记在本子上：他这边，怕是得有人搭把手。", textDist: { far: "这一年，你爸的身体露出点苗头。体检报告上有几项被圈出来，拍照发到了你手机上，你对着那几行字看了好几遍。没过几天电话又来，说他回家上楼，在二楼平台上歇了一回，从前没有过。你在电话里把复查的日子问清楚，记在自己的日历上：他这边，怕是得有人搭把手。" }, textState: { mom: { dead: "这一年，你爸的身体露出点苗头。陪他去体检，报告上有几项被圈出来，他摆摆手说没事。回家上楼，他在二楼平台上歇了一回，从前没有过。你把复查的日子记在本子上：他这边，怕是得有人搭把手。" } },
    effects: { relation: 1 } },
  { id: "proc_mom_signal", min: 22, max: 80, procOnly: true, text: "这一年，你妈的身体露出点苗头。去买菜，那兜菜她半路歇了两回才提回家，嘴上说天热，腿上是真没劲了。夜里起来，她也要扶着墙站一会儿。你把这事记在心里：往后她这边，怕是得有人搭把手。", textDist: { far: "这一年，你妈的身体露出点苗头。体检报告上有几项被圈出来，拍照发到了你手机上，你对着那几行字看了好几遍。没过几天电话又来，说她拎着菜上楼，在楼道里歇了一回才到家。你在电话里把复查的日子问清楚，记在自己的日历上：她这边，怕是得有人搭把手。" }, textState: { dad: { dead: "这一年，你妈的身体露出点苗头。去买菜，那兜菜她半路歇了两回才提回家，嘴上说天热，腿上是真没劲了。夜里起来，她也要扶着墙站一会儿。你把这事记在心里：往后她这边，怕是得有人搭把手。" } },
    effects: { relation: 1 } },
  { id: "proc_dad_hosp", min: 22, max: 80, procOnly: true, text: "你爸住院了。病房里六张床，他靠窗。医生说先住下来观察，该做的检查一样一样做。你在走廊的长椅上坐了一夜，天亮的时候去楼下买了粥。", textDist: { far: "你爸住院了。电话打过来的时候，你手边的事还没放下。往回赶的路上，电话一个接一个，检查结果一样一样报给你听。赶到病房时他已经睡了，床头柜上放着白天做完的检查单。你在走廊的长椅上坐了一夜，天亮的时候去楼下买了粥。" },
    choices: [
      { label: "在医院陪床，晚上就睡陪护椅", set: "care_self", effects: { relation: 3, health: -2, money: -2 }, echo: "陪护椅睡得腰酸。可他半夜醒来，看见你在，心里是定的。" },
      { label: "请护工帮着，自己每天去看一趟", set: "care_hired", effects: { money: -4, relation: 1 }, echo: "护工白班夜班地换。你每天先去病房坐一会儿，把当天的检查结果听完再走。", echoDist: { far: "护工白班夜班地换。你每天往医院打几个电话，把当天的检查结果问清楚，钱按时打过去。" } },
    ] },
  { id: "proc_mom_hosp", min: 22, max: 80, procOnly: true, text: "你妈住院了。病房里六张床，她靠窗。医生说先住下来观察，该做的检查一样一样做。你在走廊的长椅上坐了一夜，天亮的时候去楼下买了粥。", textDist: { far: "你妈住院了。电话打过来的时候，你手边的事还没放下。往回赶的路上，电话一个接一个，检查结果一样一样报给你听。赶到病房时她已经睡了，床头柜上放着白天做完的检查单。你在走廊的长椅上坐了一夜，天亮的时候去楼下买了粥。" },
    choices: [
      { label: "在医院陪床，晚上就睡陪护椅", set: "care_self", effects: { relation: 3, health: -2, money: -2 }, echo: "陪护椅睡得腰酸。可她半夜醒来，看见你在，心里是定的。" },
      { label: "请护工帮着，自己每天去看一趟", set: "care_hired", effects: { money: -4, relation: 1 }, echo: "护工白班夜班地换。你每天先去病房坐一会儿，把当天的检查结果听完再走。", echoDist: { far: "护工白班夜班地换。你每天往医院打几个电话，把当天的检查结果问清楚，钱按时打过去。" } },
    ] },
  { id: "proc_dad_dead", min: 22, max: 80, procOnly: true, stateAll: { dad: "alive" }, setState: { dad: "dead" }, text: "你爸走了。走得还算安稳。葬礼办完，亲戚们陆续散了，你一个人把他的屋子收拾了一遍：衣服叠好，工具摆齐，抽屉里有一本记了一辈子的账。",
    effects: { relation: -2, health: -1 } },
  { id: "proc_mom_dead", min: 22, max: 80, procOnly: true, stateAll: { mom: "alive" }, setState: { mom: "dead" }, text: "你妈走了。走得还算安稳。葬礼办完，亲戚们陆续散了，你一个人把她的屋子收拾了一遍：针线盒还在老地方，里头的顶针磨得发亮。",
    effects: { relation: -2, health: -1 } },
  // —— 百岁彩蛋拍（v0.60.59，用户亲定）：父母年满一百且在世时由 parentsDue 发作，一生至多一次；文面不预设另一位父母存亡、不预设子孙 ——
  { id: "proc_dad_century", min: 22, max: 110, procOnly: true, text: "你爸一百岁了。家里摆了几桌，街道和社区的人也来了。他穿了件新褂子，坐在上首，耳朵有点背，可谁来敬酒他都应，还自己端起杯子抿了一小口。有人问他长寿的秘诀，他摆摆手：没啥秘诀，就是把日子一天一天过。一百年，他就这么过下来了。",
    effects: { relation: 2 } },
  { id: "proc_mom_century", min: 22, max: 110, procOnly: true, text: "你妈一百岁了。家里摆了几桌，老姐妹里还有走得动的，也拄着拐来了。她穿了件红褂子，坐在上首，眼睛有点花，可认人还认得清。她拉着你的手说，这辈子，值了。一百年，她把日子过成了这个样子。",
    effects: { relation: 2 } },
  // —— 整十寿辰拍（CL-42，用户亲定成系统）：60/70/80/90 恰满当年由 parentsDue 发作，一寿一次；「正经操办」挂 care 延寿 +1，「简单过」不延寿。文面不预设另一位父母存亡、不预设子孙 ——
  { id: "proc_dad_bday60", min: 22, max: 110, procOnly: true, text: "你爸这年整六十。老话说六十花甲，他自己不当回事，说该干啥干啥。可你发现，他把日历翻到生日那页，拿笔在边上划了个小道道。",
    choices: [
      { label: "给他办个六十大寿，请老同事老伙计坐一坐", care: { who: "dad", yrs: 1 }, effects: { money: -2, relation: 2 }, echo: "摆了三桌。他穿了件新衬衫挨个敬酒，话头比平时足。散了席他说，这六十年，没白过。" },
      { label: "不张扬，一家人吃碗长寿面", effects: { relation: 1 }, echo: "面是他自己擀的，卧了两个鸡蛋。他说，六十就这么过，挺好。" } ] },
  { id: "proc_mom_bday60", min: 22, max: 110, procOnly: true, text: "你妈六十了。她说女同志不兴过整寿，让你别听外头的规矩——可她把年轻时那件红毛衣都找出来了，搭在椅背上，穿不穿还没定。",
    choices: [
      { label: "办一场，喊上她的老姐妹热热闹闹", care: { who: "mom", yrs: 1 }, effects: { money: -2, relation: 2 }, echo: "红毛衣她到底穿了。老姐妹们围着她说话，她笑得眼角全是褶子。回家的路上她说，今天，是真高兴。" },
      { label: "依她，一家人吃顿饭就行", effects: { relation: 1 }, echo: "饭桌上她把红毛衣的事说漏了嘴，自己先笑了。说穿不穿的吧，心里有，就够了。" } ] },
  { id: "proc_dad_bday70", min: 22, max: 110, procOnly: true, text: "你爸七十了。他嘴上说这个岁数有什么好过的，早上起来还是先去把那几盆花浇了。说起生日，他说随你们，眼睛却往日历上瞟了两回。",
    choices: [
      { label: "正经操办，在家里摆几桌", care: { who: "dad", yrs: 1 }, effects: { money: -2, relation: 2 }, echo: "老伙计来了大半，酒没多喝，话说了不少。他坐在上首挨个看过去，说，能坐到一块儿，就是福气。" },
      { label: "这年家里事多，简单过过", effects: { relation: 1 }, echo: "一碗面，两个菜，他说这样清净。可你看见，他把送他的那个寿字摆在了柜子上，摆得端端正正。" } ] },
  { id: "proc_mom_bday70", min: 22, max: 110, procOnly: true, text: "你妈七十了。她念叨自己这辈子没出过远门，也没拍过一张像样的照片。生日快到了，她把压箱底的布料拿出来，说想做件新衣裳。",
    choices: [
      { label: "给她办个七十大寿，热闹热闹", care: { who: "mom", yrs: 1 }, effects: { money: -2, relation: 2 }, echo: "她穿了新衣裳，拉着老姐妹拍了张合影，洗出来摆在镜子旁边。她说这辈子第一张正经照片，是七十岁照的。" },
      { label: "买件现成的衣裳，一家人吃顿饭", effects: { relation: 1 }, echo: "衣裳她穿上了，说等过年再穿出去。照片的事她没再提，你却记在了心里。" } ] },
  { id: "proc_dad_bday80", min: 22, max: 110, procOnly: true, text: "你爸八十了。这个岁数，在他那一辈人里，是闯过了一道大关。他耳朵背了，可谁提起他生日，他听得比什么都清。家里商量着，这寿怎么办。",
    choices: [
      { label: "大办一场，四邻八舍都请来", care: { who: "dad", yrs: 1 }, effects: { money: -3, relation: 2 }, echo: "院子里摆了六桌，他坐在上首，逢人就点头。有人喊他老寿星，他摆摆手，眼睛却笑成了一条缝。" },
      { label: "年纪大了怕吵，就家里人聚聚", effects: { relation: 1 }, echo: "就一桌，都是自家人。他吃得不多，看得不少，看完一圈点点头，像在清点什么宝贝。" } ] },
  { id: "proc_mom_bday80", min: 22, max: 110, procOnly: true, text: "你妈八十了。八十在老辈人那里是大寿。她这几天把家里收拾得格外利索，连窗台上的花都挪了位置，说怕来人看着乱。",
    choices: [
      { label: "给她大办，亲戚街坊都请来", care: { who: "mom", yrs: 1 }, effects: { money: -3, relation: 2 }, echo: "那天她坐在上首，红褂子穿得整整齐齐，谁敬酒她都应。散席了她还坐着，说，再坐一会儿，这热闹，舍不得散。" },
      { label: "她身子怕闹，在家里小办一下", effects: { relation: 1 }, echo: "小小一桌，她还是把新褂子穿上了。吃完她靠着椅背说，够了，一家人齐齐整整，就是寿了。" } ] },
  { id: "proc_dad_bday90", min: 22, max: 110, procOnly: true, text: "你爸九十了。这个岁数，整条街都找不出第二个。他自己也稀罕，没事就跟人说，我今年九十了，说的时候腰板挺得笔直。这一年的寿，怎么办都不为过。",
    choices: [
      { label: "大办九十大寿，让他高兴个够", care: { who: "dad", yrs: 1 }, effects: { money: -3, relation: 2 }, echo: "摆了八桌，他坐在上首，来的人他大半还认得，认不得的，就笑着点头。散席时他说，今天这觉，能睡得香。" },
      { label: "他经不起闹，在家里摆一桌", effects: { relation: 1 }, echo: "就一桌至亲。他吃了一小碗寿面，剩下的时间就看着你们笑。九十岁的人，热闹在心里。" } ] },
  { id: "proc_mom_bday90", min: 22, max: 110, procOnly: true, text: "你妈九十了。九十岁的老太太，耳朵有点背，眼睛有点花，可谁进门，她先问人家吃了没。街坊都说，这样的老人，是家里的宝。她的九十大寿，惦记的人比你还多。",
    choices: [
      { label: "大办，让她风风光光过这个寿", care: { who: "mom", yrs: 1 }, effects: { money: -3, relation: 2 }, echo: "她穿了红褂子坐在上首，拉着这个的手，拍拍那个的背。一天下来她累了，靠在椅子上眯着眼笑，像晒着了太阳。" },
      { label: "就在家里过，一家人守着她", effects: { relation: 1 }, echo: "一桌人，她挨个看过去，慢慢吃了一碗面。吃完她说，人老了，不图热闹，图个全乎。" } ] },
  // —— dating 到期结算：处满 7 年未定，由进程拍给出三条路（推迟至多两次） ——
  { id: "proc_dating", min: 22, max: 80, procOnly: true, stateAll: { spouse: "dating" }, text: "处了这些年，周围人都默认你们是一对。可这事一直没个正式的说法。这一回，得有个决定了。",
    choices: [
      { label: "把关系定下来，好好过日子", set: "married", setState: { spouse: "partnered" }, effects: { relation: 4, freedom: -1 }, echo: "没办多大的排场，两家人吃了顿饭，日子就接着往下过了。回头看，这个决定下得晚，可不算错。" },
      { label: "好聚好散，各过各的", setState: { spouse: "single" }, effects: { freedom: 3, relation: -3 }, echo: "最后那顿饭吃得很平静。东西分好，钥匙还回去。走出那个门的时候，你知道这回是真的分开了。" },
      { label: "再处处看，不急着定", deferDating: true, effects: { relation: 1 }, echo: "话说开了，反倒松快些。定不定，以后再说——你们先这么处着。" },
    ] },
  // —— 孩子首次露面保底拍（孩子线批次 S2）：出生满 3 年孩子还没在任何一拍里露过面、且低龄
  // 孩子池当年无合格条目时，由进程判定 kidDebutDue 必达呈现（触发与选拍在 spouse.js）。
  // 纯场面拍、无选项；六代共用一条——物件只用各代都成立的日常（门框、鞋带、举过头顶），
  // 不写孩子的性别，伴侣只以「对方」出场且只在默认版（有伴侣在场时）；其余伴侣状态走
  // textState 的单人版。kidAgeMax=3 是刻意的：本拍呈现即被 syncKidDebut 认作首次露面、立旗闭环。
  { id: "proc_kid_debut", min: 22, max: 80, procOnly: true, stateAll: { kids: "has" }, kidAgeMax: 3,
    text: "孩子刚走稳当，成了你的小尾巴。你进厨房，孩子扶着门框跟进来。你蹲下系鞋带，孩子也蹲下，小手在自己鞋上按了半天。晚上对方把孩子举过头顶，孩子笑得直蹬腿。白天那点累，散了一大半。",
    textState: { spouse: {
      single: "孩子刚走稳当，成了你的小尾巴。你进厨房，孩子扶着门框跟进来。你蹲下系鞋带，孩子也蹲下，小手在自己鞋上按了半天。晚上你把孩子举过头顶，孩子笑得直蹬腿。白天那点累，散了一大半。",
      none: "孩子刚走稳当，成了你的小尾巴。你进厨房，孩子扶着门框跟进来。你蹲下系鞋带，孩子也蹲下，小手在自己鞋上按了半天。晚上你把孩子举过头顶，孩子笑得直蹬腿。白天那点累，散了一大半。",
      divorced: "孩子刚走稳当，成了你的小尾巴。你进厨房，孩子扶着门框跟进来。你蹲下系鞋带，孩子也蹲下，小手在自己鞋上按了半天。晚上你把孩子举过头顶，孩子笑得直蹬腿。白天那点累，散了一大半。",
      widowed: "孩子刚走稳当，成了你的小尾巴。你进厨房，孩子扶着门框跟进来。你蹲下系鞋带，孩子也蹲下，小手在自己鞋上按了半天。晚上你把孩子举过头顶，孩子笑得直蹬腿。白天那点累，散了一大半。",
    } },
    effects: { relation: 1 } },
  // —— 职业入行拍与链后继（B5 语境门的事实来源） ——
  { id: "e_med_start", ctx: { entry: true }, forbidRoute: "abroad", min: 24, max: 36, text: "县里卫生院贴出招人启事：招医护辅助，先培训再上岗。去问的人不多，门口没排队。管事的说，这行当熬人，可饭碗稳。",
    choices: [
      { label: "去，先学起来（往后就是医护这一行的人）", set: "med_work", effects: { growth: 4, money: -1 }, echo: "培训了三个月，你学会了量血压、换药、认常用药名。头一回独立值班，你手心全是汗。" },
      { label: "不去，手头的活先干着", effects: {}, echo: "你把启事看了一眼，又贴了回去。日子照旧过。" },
    ] },
  { id: "e_med_years", min: 34, max: 52, chain: "e_med_start", ctx: { flag: "med_work" }, text: "在卫生院干了这些年，附近几个村谁家老人什么病、吃什么药，你都门儿清。有人半夜来敲门，你披上衣服就走。",
    effects: { relation: 3, growth: 1 } },
  { id: "e_truck_start", ctx: { entry: true }, min: 22, max: 32, routeIn: ["corp", "gap", "home"], text: "跑长途的师傅缺个搭把手的，问你跟不跟车。跟车先学路，学会了再上手，钱按趟结。这一行熬夜，也熬人。",
    choices: [
      { label: "跟车，先学起来（常年不在家）", set: "truck_work", effects: { money: 3, health: -2, freedom: 2 }, echo: "头一趟跑下来，你在服务区睡了个整觉。醒来的时候，师傅说：能吃这碗饭。" },
      { label: "不跟，太熬人", effects: { health: 1 }, echo: "你帮师傅把货码好，目送车出了院子。这条路，你没上去。" },
    ] },
  { id: "e_truck_years", min: 36, max: 55, chain: "e_truck_start", ctx: { flag: "truck_work" }, set: "truck_veteran", text: "长途跑了这些年。哪段路雨天打滑、哪个服务区的饭实在，你闭着眼都说得出来。里程表上的数，一天天攒，攒得老长了。",
    effects: { money: 2, health: -2 } },
  // —— 处境回响（C8：识字线 / half 线 / work 轨道） ——
  { id: "e_lit_echo1", min: 30, max: 52, require: "literacy_gain", text: "签一份要紧的合同，人家把笔递给你。你一页一页看完，看得慢，可都看懂了，才在该签字的地方签下自己的名字。这事搁在小时候，你想都不敢想。",
    effects: { growth: 2, freedom: 2 } },
  { id: "e_lit_echo2", min: 42, max: 62, state: { schooling: "never" }, text: "村里填表、写申请，年轻人不在家时，老人都来敲你的门：你认字，你帮着看看。字是后来才认的，可认得扎实。",
    effects: { relation: 3 } },
  { id: "e_half_echo", min: 28, max: 46, require: "half_grown", text: "小时候半读半帮工落下的那些课，这些年你一点一点补。账本、说明书、招工告示，从前要人念的，如今你自己看。",
    effects: { growth: 3 } },
  { id: "e_work_echo", min: 26, max: 40, ctx: { mainLine: ["factory_work", "fab_work", "gig_work", "courier_work", "heavy_work", "miner_work", "craft_work"] }, text: "出来打工快十年了。流水线、后厨、工地，能干的你都干过。手上的茧厚了，卡里也攒下了一点。",
    effects: { money: 2, growth: 1 } },
  { id: "e_never_work", min: 24, max: 40, state: { schooling: "never" }, text: "招工的人看你干活利索，一听不认字，把头摇了摇。你转身去了不问文凭的那家：活更重，钱更少。",
    effects: { money: 1, health: -1 } },
  // —— 退休相位进程拍与落点（v0.19.0，workPhase）：触发规则在引擎 workPhaseDue，口径见 docs/WORK-PHASE.md ——
  { id: "proc_retire_node", min: 55, max: 74, procOnly: true, stateAll: { workPhase: "working" }, text: "这一年，退下来的事正式摆到了桌上。活干了大半辈子，交接的清单列出来，比你想的长。往下怎么走，这一回得有个说法。",
    textNoUnit: "这一年，退下来的事正式摆到了桌上。活干了大半辈子，年头也差不多够了。往下怎么走，这一回得有个说法。",
    choices: [
      { label: "退下来，把日子还给自己", setState: { workPhase: "retired" }, set: "retired_begun", effects: { freedom: 5, health: 2, money: -2 }, echo: "手续办完那天，你把私人物品装了一个纸箱。走出大门时回头看了一眼，没再进去。", echoNoUnit: "手续办完那天，你在街口站了一会儿。往后的日子，不用再赶着哪个点走了。" },
      { label: "先半退，活减一半，慢慢交", setState: { workPhase: "part" }, set: "slow_life", effects: { freedom: 3, money: -1, relation: 1 }, echo: "排班表改了，你一周只去一半的日子。空出来的上午，你先补了个长觉。" },
      { label: "再干几年，身体还行", deferRetire: true, effects: { money: 2, health: -1 }, echo: "话放出去了，就接着干。只是心里清楚，这一拖，也就是几年的事了。" },
    ] },
  { id: "proc_retire_full", min: 56, max: 79, procOnly: true, stateAll: { workPhase: "part" }, setState: { workPhase: "retired" }, set: "retired_begun", text: "这回是真退了。最后一班交完，你把钥匙还回去，剩下的东西装了半箱。回家的路上你去银行查了查，退休的钱已经打进来了。数不多，可往后的日子，算是有了着落。",
    textAgain: "返聘的这一截，到今天也交完了。这一回退下来，就不回去了。回家的路上你绕到公园坐了一会儿，往后的日子，慢慢过。",
    textNoUnit: "这回是真退了。手头的活交清，往后不用再赶时间。回家的路上你去银行查了查，退休的钱已经打进来了。数不多，可往后的日子，算是有了着落。",
    effects: { freedom: 3, health: 1 } },
  { id: "proc_retire_auto", min: 66, max: 79, procOnly: true, stateAll: { workPhase: "working" }, setState: { workPhase: "retired" }, set: "retired_begun", text: "年纪到了，这边不再续了。最后一个班上完，年轻人帮你把箱子搬到门口。你站在楼下站了会儿，才慢慢往家走。这事拖了几年，最后是这么定下来的。",
    textNoUnit: "年纪到了，该办的手续都办了。最后把手头的事了清，你在街口站了会儿，才慢慢往家走。这事拖了几年，最后是这么定下来的。",
    effects: { freedom: 3, health: 1, money: -1 } },
  { id: "e_retire_firstmonth", min: 56, max: 76, state: { workPhase: "retired" }, flagAgeWithin: { flag: "retired_begun", years: 2 }, set: "retire_final_said", text: "退下来这一阵，你还是六点多就醒。醒了没事干，在屋里转两圈，又躺回去。慢慢地，上午买菜、下午走路的点固定下来，日子有了新排法，就是头几天心里空落落的。",
    effects: { freedom: 2, wisdom: 2 } },
  { id: "e_retire_farewell", min: 55, max: 70, state: { workPhase: "part" }, ctx: { notForm: ["farm", "self", "flex"] }, text: "半退以后，你去的日子少了，新人顶上来大半。有回你去拿落下的东西，工位上已经坐了别人，桌上摆着人家的水杯。你站了一会儿，把自己的旧本子抽出来，走了。",
    effects: { relation: 1, wisdom: 2 } },
  // —— 返聘回流（retired → part）：退了又被请回去做半截活 ——
  { id: "e_rehire_1",ctx: { form: ["employee","public"] }, min: 58, max: 74, state: { workPhase: "retired" }, textRetireYears: { mid: "几年", long: "好些年" }, text: "退了没多久，老单位来电话：有个岗位缺人，想请你回去做半截，一周去三天，钱按月结。你在家把这事说了，嘴上说想清静，心里有点动。",
    textForm: { farm: "退下来没多久，合作社的人来家里捎话：收购站上缺个懂行的人，想请你回去帮一阵，一周去三天，钱按月结。你在家把这事说了，嘴上说想清静，心里有点动。", self: "歇下来没多久，从前一起做买卖的老伙计来电话：有个摊子缺个压得住场的人，想请你回去帮半截，一周去三天，钱按月结。你在家把这事说了，嘴上说想清静，心里有点动。", flex: "歇下来没多久，从前跑单时认识的站长来电话：站点上缺个熟手，想请你回去帮半截，一周去三天，钱按月结。你在家把这事说了，嘴上说想清静，心里有点动。" },
    choices: [
      { label: "回去做半截，有个出门的由头", setState: { workPhase: "part" }, set: "rehire", effects: { money: 3, freedom: -2 }, echo: "回去头一天，门卫还认得你，笑着说您这是退了个假休。你把杯子放回原来的位置。", echoForm: { farm: "回去头一天，站上的人还认得你，笑着说您这是退了个假休。你把茶缸放回了窗台上原来的位置。", self: "回去头一天，隔壁摊的人还认得你，笑着说您这是退了个假休。你把算盘放回了柜台上原来的位置。", flex: "回去头一天，站点的人还认得你，笑着说您这是退了个假休。你把头盔挂回了墙上原来的钉子。" } },
      { label: "不去了，日子好不容易空出来", effects: { freedom: 2 }, echo: "你把电话谢了。往后上午的日子还是自己的，就是偶尔路过那边，脚步会慢一点。" },
    ] },
  { id: "e_rehire_2",ctx: { mainLine: ["factory_work","fab_work"] }, min: 60, max: 76, state: { workPhase: "retired" }, text: "从前带过的年轻人如今管事了，来家里坐了一会儿，说新来的人手生，想请你回去带一阵，不坐班，有事就来。你把茶续上，问了问现在那边的情况，听着听着，手有点痒。",
    choices: [
      { label: "去带一阵，把手艺交出去", setState: { workPhase: "part" }, set: "rehire", effects: { money: 2, relation: 2 }, echo: "你讲的都是手册上没有的：哪台机器脾气怪，哪个数漂了先查哪儿。年轻人记了满本子。" },
      { label: "不去了，把笔记给他们带回去", effects: { health: 1, freedom: 1 }, echo: "你把当年的笔记整理好，让对方带回去。人不去，东西留下，也算交代了。" },
    ] },
]);
