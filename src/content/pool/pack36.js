// pack36 — 职业后段拍组（第 2 期 P2-3 想走片）
// 第 1 期 §3.5 设计的冷门后段两拍在本包落地：入行关口开门之后，干了几年的人靠
// career 读数（ctx.careerVia / careerTenureIn，record.js P2-3 接入）撞上——
//   cr_want_cold：冷门来处干了几年觉得不对，想走（选项落 switch_wanted，喂
//     career.js gateSwitchDue 的 want 支路；registry 已登记本旗）；
//   cr_want_seed：种子/承继来处入行后想换（同落 switch_wanted）；
//   cr_fond_cold：冷门行当干久了处出感情（选项带 careerFond 声明——careerNote 的
//     fond 写动作尚在 career.js 侧待接，见本批报告卡点；声明形状与 gateDefer 同例，
//     是选项上的数据声明，本包只声明、不冒充已落账）。
// 两组想走拍以 forbid switch_wanted 自关门（旗已立不再复读想走的念头）；三拍共用
// 同一套读账门（在段年数 [3,12]，来处分面），年龄窗只作 storylet 形状兜底，真门
// 在 ctx：无当前段（未入行/待业/已退休）恒不出。文案纪律：想走不是惩罚、干出
// 感情不是煽情，平平地写日子；冷门行当不写成惩罚项。
// 呈现标定（施工实测，详见本批报告）：初版 min25/max49 无 w 时，构造态蒙特卡洛
// （pickEvent ×3000）抽中率仅 0.2–0.6%/抽（池头部条目 1.5–3%），自然跑 48 局入行
// 仅 1 局撞见——宽窗把 saliency 的窗口进度与关窗加成摊没了。标定为 max 44＋w 3
// （w 3 仓内有先例），ctx 门与在段窗一字未动；标定后抽中率复测见报告，本包数值
// 仍待 P2-4 标定片按五局尺子复核。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
{"id":"cr_want_cold","ctx":{"careerVia":"cold","careerTenureIn":[3,12]},"forbid":["switch_wanted"],"min":25,"max":44,"w":3,"text":"这行当初不是你自己挑的，是赶上了，先干着再说。几年下来，手艺比头两年熟，工钱也涨过两回。可这阵子下班往家走，你老想一件事：往后几十年，就一直是这个干法了？","choices":[{"label":"想换一行试试","effects":{"growth":1,"freedom":1},"set":"switch_wanted","echo":"你没跟谁说，心里把这事定下来了：有合适的门开着，你想换。手头的活照干，眼睛开始往别处看。"},{"label":"先干着，这行也没啥不好","effects":{"relation":1},"echo":"你想了想，没动。活是熟活，人是熟人，先干着。那个念头压下去了，没散，也没再冒头。"},{"label":"也就是累着了，歇歇再说","effects":{"health":1},"echo":"你腾出两天睡了个整觉。再回去上工，那个念头淡了些——是累的，不是不想干了。"}]},
{"id":"cr_want_seed","ctx":{"careerVia":["seed","inherit"],"careerTenureIn":[3,12]},"forbid":["switch_wanted"],"min":25,"max":44,"w":3,"text":"这一行，你进来的时候心里是有数的：早年动过心思，或者家里本就干这个，你顺着这条路进来了。几年干下来，手上有了活，日子也稳当。只是最近你发现，当初想干的，和天天真干的，好像不是一回事。","choices":[{"label":"想换一行","effects":{"growth":1,"freedom":1},"set":"switch_wanted","echo":"你把这事在心里定下来了：有门开着，你想出去看看。不是这行不好，是你想知道，自己还能干点别的什么。"},{"label":"来处归来处，活还得干","effects":{"relation":1},"echo":"你没动。当初为什么进来，你还记得；记得归记得，活还是照干。那个念头先放着。"},{"label":"跟家里人念叨念叨","effects":{"relation":1},"echo":"晚饭桌上你提了一嘴，家里人说，先干着，换行当不是小事。你嗯了一声，这事就先搁下了。"}]},
{"id":"cr_fond_cold","ctx":{"careerVia":"cold","careerTenureIn":[3,12]},"min":25,"max":44,"w":3,"text":"这行干久了，有些东西是慢慢攒下的。工具顺手，活儿的先后你闭着眼都知道；一块儿干活的人，谁手劲大、谁家里有事，你都清楚。逢年过节，还有人惦记着给你留口热的。说不上这行有多好，就是干着干着，处出感情了。","choices":[{"label":"这行，我想长干下去","effects":{"relation":1,"growth":1},"careerFond":true,"echo":"你把工具又擦了一遍，摆回老地方。这行你打算长干——不为什么，就是这些人、这些活，你舍不得。"},{"label":"说不上来，先干着","effects":{"health":1},"echo":"你没说什么，照常上工。就是别人问起你干哪行，你答得比从前顺口了。"},{"label":"把手艺再往深里练练","effects":{"growth":2},"echo":"你开始挑难的活接。带你的人说，你这是入行了——不是手熟，是心定了。"}]}
]);
