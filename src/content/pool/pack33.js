// [M1-B 内容重组] 本文件现位于 src/content/pool/pack33.js（按领域重组搬入），除本行外内容一字未动。
// pack33 — v0.13.0 出身牌钩子事件：require 对应 hook_* 旗（开局选牌立旗），分布 23–45 岁——出身的回响来得早
// v0.13.2：削「说破因果」解释尾（哪练的/小时候…练的），动作与物件留下，出身与当下的扣合交给读者
// v0.23 WP8 fix4（四修）：p33_010 补 textState.schooling.never 分文（小学同学/老班长/座位表改小时候伙伴口径；require 的家底钩子不变）。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
{"id":"p33_001","min":24,"max":38,"require":"hook_counter","text":"同事盘了个小店，月底把账本抱来找你：流水和库存对不上，差了七百多。你拿计算器一笔笔捋，半小时找出来是两笔进货记重了。他把账本合上，塞给你一个红包，你没收。饭倒是去吃了，席间他说：这人情，我记下了。","effects":{"relation":2,"wisdom":1}},
{"id":"p33_002","min":30,"max":45,"require":"hook_counter","text":"你帮家里亲戚算一笔合伙的账，前后三年的流水摊了一桌子。算完你把话说明白：这账再合伙下去要伤人。后来他们散了伙，没红脸，逢年过节还在一张桌子上吃饭。","effects":{"wisdom":2,"relation":1}},
{"id":"p33_003","ctx":{"form":["employee","public"]},"min":23,"max":35,"require":"hook_books","text":"单位要写一份汇报材料，领导点名让你执笔。你熬了两晚，可引的那两句出处，别人都没想到。材料交上去，批回来四个字：底子不错。","effects":{"growth":2,"health":-1}},
{"id":"p33_004","min":28,"max":45,"require":"hook_books","text":"放假在家，你侄子抱着一本旧书来问结局。你没直接说，陪他一页页读完。临走他说，明年还要来你这儿过暑假。","choices":[{"label":"答应下来，把书柜下层腾给他","effects":{"relation":2,"money":-1},"echo":"你把书柜最下面一层腾出来，他个子够得着。那些书的折痕，都是你小时候留下的。","set":"promised_next_summer"},{"label":"讲完这本就算了","effects":{"relation":1},"echo":"他抱着书走了。有些东西传下去了多少，你自己也不知道。"}]},
{"id":"p33_005","min":25,"max":40,"require":"hook_siblings","text":"姐姐家孩子报志愿，一家人意见不一，喊你回去拍板。你把几个学校的好坏摊开讲了一晚上，最后让孩子自己选。你排老二，这种场面从小见惯了。","effects":{"relation":2,"freedom":-1}},
{"id":"p33_006","min":30,"max":45,"require":"hook_siblings","text":"过年一大家子在你这儿聚，二十多口人。你排菜、排座、排谁洗碗，一晚上没歇着。散场时姐姐把洗碗池里的手套递给你，没多说话。","effects":{"relation":2,"health":-1}},
{"id":"p33_007","min":24,"max":38,"require":"hook_grandma","text":"同事来家里吃饭，尝了你腌的菜，问在哪买的。你说自己腌的，方子是奶奶的。后来她隔三差五来讨一小坛，你家的坛子就没空过。","effects":{"relation":2,"money":-1}},
{"id":"p33_008","min":30,"max":45,"require":"hook_grandma","text":"家里老人住院，你去陪床。几点量体温、药怎么分、夜里怎么翻身，你上手就熟。护工看你换床单的手法，点了点头，把热水瓶往你这边推了推。","choices":[{"label":"多陪几晚，白天再补觉","effects":{"relation":3,"health":-2},"echo":"夜里走廊的灯一闪一闪，你想起奶奶摇椅边的那盏小灯。"},{"label":"请人陪，自己跑手续","effects":{"money":-2,"relation":1},"echo":"你把缴费、取药的路跑顺了。陪床的事，你终究没抢过人家专业的。"}]},
{"id":"p33_009","ctx":{"form":["employee","public"]},"min":23,"max":33,"require":"hook_moved_kid","text":"刚换的新单位，别人要一个月才认全人，你一周就摸清了谁跟谁不对付、食堂哪个窗口快。你从小换地方换惯了，进新门先看人。","effects":{"growth":2,"relation":1}},
{"id":"p33_010","min":30,"max":45,"require":"hook_moved_kid","text":"失联多年的小学同学通过老班长联系上你。你们在电话里对了半天座位表，才想起彼此坐过前后桌。约好见面，临了又各自忙，拖了半年还没见上。","textState":{"schooling":{"never":"失联多年的小伙伴辗转联系上你。你们在电话里对了半天小时候的事，才把彼此的样子想起来。约好见面，临了又各自忙，拖了半年还没见上。"}},"effects":{}},
{"id":"p33_011","ctx":{"form":["employee","public"]},"min":23,"max":35,"require":"hook_sporty","text":"单位运动会缺人，主管挨个问，你报了个一千五。跑完第三名，奖品是一提抽纸。年轻同事递水过来，问你平常藏哪练的，你把水瓶拧开先喝了一口。","effects":{"health":2,"freedom":1}},
{"id":"p33_012","forbidRoute":"abroad","min":30,"max":45,"require":"hook_sporty","text":"公司团建去爬山，年轻人走一半就坐在台阶上。你把多余的水分出去，又折回去接最后那个。到山顶时你的膝盖先提醒你：岁数到了。","effects":{"relation":2,"health":-1}},
{"id":"p33_013","ctx":{"form":["employee","public"]},"min":24,"max":40,"require":"hook_stage","text":"部门汇报前，主讲的同事嗓子哑了，领导让你顶上。你对着镜子顺了两遍词，上台没卡壳。散会有人拍拍你肩，问你是不是干过这行，你摇摇头，去倒了杯水。","effects":{"growth":2,"relation":1}},
{"id":"p33_014","minYear":2012,"min":30,"max":45,"require":"hook_stage","text":"朋友婚礼上司仪临时闹肚子，新郎找到你：你上台不怵，帮着圆一下。你接过话筒把流程顺下来了，就是把新娘的名字念错了一个字，台下笑了整场。","choices":[{"label":"结束后挨桌赔不是","effects":{"relation":2,"health":-1},"echo":"新娘说没事，那个字她妈也常念错。你端着杯子，还是把一圈走完了。"},{"label":"装没这回事，赶紧撤","effects":{"freedom":1,"relation":-1},"echo":"你提前走了。后来照片发到群里，你那张正好闭着眼。"}]},
{"id":"p33_015","forbidRoute":"abroad","min":25,"max":40,"require":"hook_frail","text":"同事的父亲住院，你陪着去办手续。挂号、医保窗口、检查单怎么排，你门儿清。同事在缴费窗口忙成一团，你把取号条按顺序夹好递过去。","effects":{"relation":2,"health":-1}},
{"id":"p33_016","min":32,"max":45,"require":"hook_frail","text":"体检报告你看得比别人仔细，有个指标压着线，你没拖着，挂了个专家号复查。结论是虚惊一场，可这半年你把熬夜的习惯改了，早饭也正经吃了。","choices":[{"label":"顺势把作息立起来","effects":{"health":2,"money":-2},"echo":"专家号和检查费花了小两千。换来的是你头一回把体检报告从头看到尾。"},{"label":"没事就好，日子照旧","effects":{"wisdom":1,"money":-2},"echo":"报告塞进抽屉。你还是知道了那条线在哪，心里有了数。"}]},
{"id":"p33_017","stateAll":{"dad":"alive"},"min":32,"max":50,"require":"hook_era_radio","text":"你爸那台老收音机又不出声了。你拆开后盖，是根焊线虚了。电烙铁烧热，点上去，评书声又出来。你爸把音量拧大，说，还是这个声儿听着对。","choices":[{"label":"给后盖加了颗螺丝，叮嘱他别再拍它","effects":{"relation":2},"echo":"他嘴上说知道了，手还是抬了起来，想了想，又放下了。"},{"label":"给他买了台新的，旧的摆回柜顶","effects":{"money":-1,"relation":1},"echo":"新收音机台多、声亮。旧的那台他舍不得扔，擦干净了，摆在柜顶正中间。"}]},
{"id":"p33_018","anyFamilyAlive":true,"min":28,"max":45,"require":"hook_era_tape","text":"搬家翻出一个纸箱，里头是年轻时的磁带和那条喇叭裤。磁带缠成一团，你找了支铅笔，一圈一圈把带子转回去。喇叭裤往身上一比，裤脚还是那么宽，人已经不是那个腰了。","choices":[{"label":"把磁带放进录音机，还真响了","effects":{"freedom":1},"echo":"歌一出来，家里人挤到门口听。你站在箱子边上，跟着哼了两句。"},{"label":"原样封好，压到柜子最底下","effects":{"wisdom":1},"echo":"封箱的时候，你把喇叭裤叠得整整齐齐，跟当年叠校服一个样。"}]},
{"id":"p33_019","min":30,"max":48,"require":"hook_era_south","text":"出差路过南方，你绕道去看了当年那个亲戚。他在楼下小店里摆了一桌，菜都是老家的口味。临走他送你到车站，说，下回把家里人都带来。","effects":{"relation":2}},
{"id":"p33_020","stateAll":{"dad":"alive"},"min":28,"max":48,"require":"hook_era_pager","text":"你给你爸换了部智能手机，教他发语音、看天气。他学得慢，你就把步骤写在纸上，贴在冰箱门上。当年你给他抄呼机号码的那个小本子，他还留着，跟新手机的说明书压在一起。","choices":[{"label":"把纸条上的字写得又大又端正，像当年一样","effects":{"relation":2},"echo":"他照着纸条，自己发出第一条语音。发完举着手机给你看，问，这算学会了吧。"},{"label":"把常用的都设成大图标，桌面排得清清楚楚","effects":{"relation":1,"growth":1},"echo":"他点错了几次，慢慢顺了。视频电话接通那天，他先对着屏幕理了理头发。"}]},
{"id":"p33_021","anyFamilyAlive":true,"min":25,"max":42,"minYear":2012,"require":"hook_era_olympic","text":"奥运会又开了。开幕式那晚，家里人搬了椅子守在电视前。你给他们讲二〇〇八年看比赛的事，讲到福娃那首歌，你还能哼下来。电视里烟花升起来，屋里的人都没说话。","effects":{"relation":2}},
{"id":"p33_022","min":30,"max":45,"require":"hook_era_lottery","text":"同事家的孩子赶上小升初摇号。同事盯着屏幕，手心全是汗，跟你念叨了一上午。你说，这场面我熟。当年你妈坐在屏幕前，也是这么盯着的。","choices":[{"label":"帮他把几个学校的情况打听了一圈","effects":{"relation":2},"echo":"结果出来，不算最理想，也不差。他请你吃饭，说，摇到哪儿算哪儿，孩子差不了。"},{"label":"劝他放宽心，腿力都是骑出来的","effects":{"wisdom":1,"relation":1},"echo":"他笑了，说你这安慰人的法子真够老的。你也笑，当年你就是这么被安慰过来的。"}]}
]);

window.GAME_PACKS=(window.GAME_PACKS||[]).concat([
{"id":"p33_023","min":30,"max":48,"require":"promised_next_summer","text":"第二年暑假，侄子真来了。这回他抱的是一本更厚的书，先翻到结局那页，又合上了：说今年要自己一页页读完。","effects":{"relation":2}}
]);
