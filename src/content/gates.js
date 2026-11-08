// 《如果那年》入行关口本体（第 1 期 P1-4 休眠批，设计稿 §3.1/§七）——
// fork_gate_first（毕业/首次入行）与 fork_gate_switch（大转行）两扇门的骨架：
// 本体只写框文案骨架与兜底选项，正式选项呈现时由 world/career.js 的 gateForkView
// 按本局账组装（本体永不被改动，与 kidForkView 的纪律同款）；开门判定 gateDue
// 同在 career.js。gateFrames 是本体自带的框变体位：gate_first 同一 id 三副框
// （grad 毕业 / job 头回找工作 / fact 处境推入，裁定 D3 同门两副框的落法），
// gate_switch 两副框（want 想走 / fact 单位没了硬推）。
//
// 休眠口径（本批关键）：本体只登记在本文件的 GAME_GATES，不合入 GAME_DATA.forks、
// 不进锚点表——理由有二：①总开关 GAME_GATE_SWITCH（src/content/trades.js）默认
// 关、gateDue 无任何现行调用点，合入与否玩家都不可见、不可达；②现行两份 sim
// 镜像主循环的年龄分岔查找不排除 procOnly（与真引擎 step 的口径分歧，存量工具
// 账在 WP10），22/26 岁又无现成岔口可在数组顺序上遮住这两扇门——提前合入会让
// 镜像对账把关口当普通岔口呈现，污染一切跨树 parity 口径。P1-6 激活批与 step()
// 接线同批把本体毕业进 events.js 并补锚点登记（age 建模登记随真口径定）。
// 框文案与兜底文案均为工作文案，P1-6 过文案审后换定稿。
window.GAME_GATES = {
  forks: [
    { id: "fork_gate_first", age: 22, procOnly: true, title: "入行的事 · 往后靠什么吃饭",
      text: "学是上完了。文凭也好、手艺也好，这些年攒下的东西，得换成一份正经活计。往后靠什么吃饭，这阵子得有个说法。",
      gateFrames: {
        grad: "学是上完了。文凭也好、手艺也好，这些年攒下的东西，得换成一份正经活计。往后靠什么吃饭，这阵子得有个说法。",
        job: "没个正经活计，日子总这么飘着也不是事。招人的地方不少，托人打听的也有几处。这回，得正经找一份了。",
        fact: "考试那条路，走到这儿算是断了。榜上没有名字，家里也没再提。路断了，日子还得过——往后靠什么吃饭，得另找一条。"
      },
      choices: [
        { label: "先不急，手头的事先干着", effects: { freedom: 1 }, gateDefer: true, echo: "你把这事放了放，先干着手头能干的活。找活计的事，没忘，就是往后推了推。" },
      ] },
    { id: "fork_gate_switch", age: 26, procOnly: true, title: "换行的事 · 换一行，还是不换",
      text: "现在这行，干了这些年。说不上多喜欢，也谈不上熬不下去。可这阵子总有个念头往上冒：要不要换一行试试。",
      gateFrames: {
        want: "现在这行，干了这些年。说不上多喜欢，也谈不上熬不下去。可这阵子总有个念头往上冒：要不要换一行试试。",
        fact: "单位没了。干了这些年的地方，说散就散。补偿也好、安置也好，旁人管不了下半程——往后的活计，得自己重新找一条。"
      },
      choices: [
        { label: "先不换，眼下这行再干干", effects: { freedom: 1 }, gateDefer: true, echo: "你想了几天，还是留下了。换行的事没提上日程，手头的活照旧干着。" },
      ] },
  ],
};
