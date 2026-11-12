// pack120 — 富贵尾巴 W1：自媒体爆款链（CL-115，照 CL-109 编年稿 §三.7／INDEX G 组落）
// 本片只填内容：write 线自媒体面（pack106）的本业爆款链，三环六条——
// 起势两条（短视频爆款 r_media_viral／直播冲榜 r_media_live，同环二选一形）
// ／做大两条（商单变现 r_media_cash／账号矩阵 r_media_matrix）／坐实两条
// （团队化 r_media_team／自有牌子 r_media_brand）。新条目进 rare 体系：本包
// 装载序在 synergy.js 之后（index.html 同步），把条目追加到存量 rare 表尾，
// 不抢存量 32 条的表序；另存一份 GAME_PACK_RARE 供独立沙盒校验器点读。
// 分工（照稿，不许串）：本链是「本业账号」的成事链，门＝当前主线 write＋
// 主线工龄≥3＋growth>55＋公历 2016 起；副业账号的偶发爆红归存量 r_viral
// （side 双旗、chance 0.012），两边同落 traj_viral 但链内标记分开——做大环
// 只认本链的 traj_scale_media，r_viral 进不来。end_influencer 的证据口径
// 照稿不动（本链的归宿是 traj_fortune_media→结算富贵档／end_selfmade）。
// 概率账（照 §二.3 标尺：资格齐的局整链走完 3–8%）：每环两条同环变体
// 共享一环的概率预算。初版照标称窗倒推（起势合计 0.033／做大坐实各
// 0.051）实测整链仅 0.61%（3000 局定向普查）——诊断钉死漏点不在骰子：
// 坐实环的钱门（money>55）在变现后的年份里只零星过线，能真正掷骰的
// 「有效年」只剩三四年；做大环再被起势后约两成换行局关门。故按 §二.5
// 的倒推法（每环累计约 40% 是定值、chance 按有效窗倒推）校准：起势
// 0.018＋0.021（窗延至 52，§二.4 自媒体起势 26–55 内）、做大各 0.036
// （窗延至 58／56）、坐实各 0.07（窗延至 60／58，§二.4 坐实不晚于 60；
// write 是 informal 行当、退休 63–68，主线活得到 60）。校准后复测数
// 字见工地 REPORT。
// 底色纪律（CL-92＋用户裁定）：pack106 的日常面「多数人不赚钱」不动，
// 本链是长尾，绝大多数局一辈子摸不到；红的只是一条内容，钱在后两环才
// 慢慢来；变现的账照实算（平台抽成、退货扣款、报价≠到手），团队化写
// 房租社保的压力，掉粉与限流的回落面留在拍里，不写爽文模板。
// 样本面岔开（反作者影子）：县城辅食号／返乡三农直播／科普小号／返乡
// 夫妻自有农产品牌子——与作者本行（制造业＋证书＋副业）不同构。
// 门控形状注：rare 条目不许用职业族 ctx 键（validate-storylet 静态门），
// 「在自媒体面干满」照稿的近似口径落为 mainLine=write_work＋tenureIn≥3。
(function () {
  const ITEMS = [
    // —— 起势环（爆款）：落 traj_viral（呈现即立，与 r_viral 同旗）；两选项同落链内旗 traj_scale_media ——
    { id: "r_media_viral", label: "有一条爆了", clue: "手机烫手，评论翻不到头，先回哪一条都拿不准的人。", min: 26, max: 52, minYear: 2016, ctx: { mainLine: "write_work", tenureIn: [3, 999] }, stats: [{ k: "growth", gt: 55 }], stateAll: { kids: "has" }, chance: 0.018, set: "traj_viral", text: "那条视频是周二晚上发的，拍的是给孩子做辅食，头一锅糊了，你没删，重拍的也没这条顺手。第二天中午打开手机，后台的数字往上滚，评论一页一页翻不到头。私信里有人问锅在哪儿买的，有人问孩子多大了。你坐在县城小屋的厨房里，手机烫手，一时不知道先回哪一条。",
      choices: [
        { label: "把这条置顶，趁热连拍三条跟的", effects: { money: 2, growth: 2, health: -2 }, set: "traj_scale_media", echo: "三条跟拍一条比一条稳。你把更新表贴在冰箱上：这回不全是运气，是号起来了。" },
        { label: "先回评论，私信一条不落", effects: { relation: 3, money: 1, health: -1 }, set: "traj_scale_media", echo: "回了两百多条，手都酸了。老粉说，这个号不一样，是真把人当人。你把这句话记在了本子上。" },
      ] },
    { id: "r_media_live", label: "直播间冲上榜", clue: "在线人数过万，同乡在旁边递水，让他慢慢说的人。", min: 28, max: 52, minYear: 2019, ctx: { mainLine: "write_work", tenureIn: [3, 999] }, stats: [{ k: "growth", gt: 55 }], chance: 0.021, set: "traj_viral", text: "那场直播本来是卖自家地里的红薯干。你举着手机在院子里转，讲怎么晒、怎么存。在线人数过了一万，同城榜把你顶到了第一。弹幕快得看不清，购物车里的库存一格一格往下掉。搭班的同乡在旁边递水，压低声音说：别慌，慢慢说。",
      choices: [
        { label: "接着播，把没讲完的讲完", effects: { money: 3, health: -2, relation: 1 }, set: "traj_scale_media", echo: "下了播，嗓子哑得说不出整话。后台的数你看了三遍：这一场，顶过去小半年。" },
        { label: "货卖完就收，提前下播", effects: { money: 2, wisdom: 2 }, set: "traj_scale_media", echo: "有人说你傻，有钱不赚。你笑笑：号是慢慢养的，人先得睡个囫囵觉。" },
      ] },
    // —— 做大环（变现）：require 本链标记 traj_scale_media；落链内旗 traj_media_income ——
    { id: "r_media_cash", label: "商单找上门", clue: "报价单算了三遍，到手的数和纸上不一样的人。", min: 27, max: 58, require: "traj_scale_media", ctx: { mainLine: "write_work" }, chance: 0.036, text: "红了之后，私信先被品牌占满了。你心里清楚，榜上的位置一周一换，热度正一点点往下走。报价单一张张发过来，数都比你想的高，可细则也一条条写着：脚本要审，话术照着念，链接挂满三十天。你把账算了一遍：平台抽走一截，退货再扣一截，到手的没有报价上那么好看——可比起从前一条几十块的分成，是另一回事了。",
      choices: [
        { label: "挑着接，只接自己用过的", effects: { money: 8, growth: 2, health: -2 }, set: "traj_media_income", echo: "接得慢，口碑稳。有品牌方说，你是他们名单里少数不催量的号。钱一笔笔到账，你头一回给这个号单独开了个户。" },
        { label: "先不接，热度再养一养", effects: { wisdom: 3, freedom: 2 }, echo: "几家转头找了别人。夜里你翻评论，老粉还在。你想，慢就慢点，号别做脏了。" },
      ] },
    { id: "r_media_matrix", label: "第二个号也起来了", clue: "大号被限流那回，靠小号把老粉接住的人。", min: 28, max: 56, require: "traj_scale_media", ctx: { mainLine: "write_work" }, chance: 0.036, text: "你把大号里装不下的东西，分到了第二个号：一个讲日常，一个专门答问题。新号头一个月没什么人，你照着大号当年的笨办法，一条一条更。入秋的时候，新号有一条被推出去了，评论区有人问：这不是那个谁的小号吗。两个号互相带人，你这才发现，自己手里攒下的不止一个号，是一小片地。",
      choices: [
        { label: "两边都当正事干，排班排到周末", effects: { money: 6, growth: 3, health: -2 }, set: "traj_media_income", echo: "一个人当两个人用，累是真累。可年底一算，两个号的账加起来，腰杆硬了不少。" },
        { label: "小号随缘更，不给它压任务", effects: { money: 3, freedom: 2 }, set: "traj_media_income", echo: "小号不温不火，可它不咬人。后来大号有回被限流，全靠小号把老粉接住——你才明白，留后手不吃亏。" },
      ] },
    // —— 坐实环：require traj_media_income＋money>55；落 traj_fortune_media（呈现即立） ——
    { id: "r_media_team", label: "不是一个人在拍了", clue: "发工资那天把账算了两遍，想起手机架在窗台上那年的人。", min: 30, max: 60, require: "traj_media_income", ctx: { mainLine: "write_work" }, stats: [{ k: "money", gt: 55 }], chance: 0.07, set: "traj_fortune_media", text: "先是请了个剪辑，按条结钱；后来她全职过来了，又添了一个管评论和发货的。仨人挤在一间租来的小办公室里，桌上是排班表和一摞快递单。发工资那天，你把账算了两遍：房租、社保、设备，一样都不能少。你忽然想起最早那年，手机架在厨房窗台上，一条视频拍一上午——现在这摊子，已经不是一个人收得住的了。",
      choices: [
        { label: "把公司注册了，账走正规", effects: { money: 10, relation: 2, freedom: -2 }, echo: "执照挂上墙那天，剪辑姑娘说，咱们这算创业了吧。你说，算，就是别声张，活先干好。" },
        { label: "先不扩，仨人把活做精", effects: { money: 7, wisdom: 2 }, echo: "没再招人。单子挑着接，价反而涨上去了。你说，小有小的好，船小好掉头。" },
      ] },
    { id: "r_media_brand", label: "自己的牌子", clue: "把牌子的名字写在纸箱上，字有点歪的人。", min: 30, max: 58, minYear: 2019, require: "traj_media_income", ctx: { mainLine: "write_work" }, stats: [{ k: "money", gt: 55 }], stateAll: { spouse: ["partnered", "dating"] }, chance: 0.07, set: "traj_fortune_media", text: "带别人的货带了几年，退货和品控都不在自己手里，心里总不踏实。那年你和对方商量：自家地里和邻村能凑出的东西，打自己的牌子，包装自己盯，坏果自己赔。第一批货不多，上架那晚你俩守着手机，看订单一个一个往外蹦。第二天，对方把牌子的名字写在纸箱上，字有点歪，说：这回，东西是我们自己的了。",
      choices: [
        { label: "牌子慢慢做，量跟得上再说", effects: { money: 9, relation: 3, health: -1 }, echo: "第二年，复购的人多起来。有人留言说，是冲着你这个人买的——你回：冲着东西买，东西不行，人再好也不行。" },
        { label: "趁热扩品类，多上几样", effects: { money: 11, growth: 2, health: -2 }, echo: "品类一多，有两样翻了车，你连夜下架、挨个赔钱。疼是真疼，可牌子没倒：买家说，肯认账的人，不多。" },
      ] },
  ];
  window.GAME_PACK_RARE = (window.GAME_PACK_RARE || []).concat(ITEMS);
  if (window.GAME_SYNERGY && Array.isArray(window.GAME_SYNERGY.rare)) {
    window.GAME_SYNERGY.rare = window.GAME_SYNERGY.rare.concat(ITEMS);
  }
})();
