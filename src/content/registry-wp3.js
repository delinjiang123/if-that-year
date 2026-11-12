// 《如果那年》v0.23 登记数据文件（WP3 / c1965，原子片 S-3）——形状同 WP1 骨架 registry-v023.js，
// 加载期由 registry.js 尾部 mergeRegistryExtra 与 anchors.js 合入（同名先登记者胜，本文件只补新键）。
// 加载点（集成步，见 work/wp3-index-patch.md）：index.html / sim / 各校验工具里排在 registry-v023.js 之后、
// src/world/state.js 之前。本文件含：里程碑旗、家庭事实旗、examBand 分表（c1965）、prologueForks 预留行、
// SOURCES 段（本代新写入数字/制度年份的出处登记，证据档位同调查报告三档）。
//
// ---- SOURCES（WP3 份）----
// [硬] 顶替成文 1978-06 两《暂行办法》、一家只进一个、1978–83 顶替约 900 万人
//      ——调查报告 §6 c1965 第 1/2 条（国务院参事室顶替制度史口径，转引见 REPORT 出处节）。
// [硬] 已在乡成家的下乡知青不在可顶替之列——调查报告 §6 c1965 第 2 条（多源一致细则）。
// [硬] 小升初选拔 1977–78 恢复、重点/普通分层成型——调查报告 §6 c1965 第 3 条。
// [硬/轴] 分田到户＝事件轴 [1978,1984] 背景；下岗潮＝事件轴 [1995,2002] 本体、峰值 1998；
//      房改·福利分房取消＝事件轴 [1998,2000] 本体（蓝图 §八 8.1 种子表，集成时逐条补出处）。
// [设计参数] examBandTables.c1965 三档权重——设计参数，无统计出处（蓝图 §3.2 总则②、附录 B），
//      不许标「锚自升学率」；只受阈值单调性与可玩性约束。
// [红线自查] 1977 年高考录取率约 4.8% 属 c1955 届，本代文案零使用（wp3-scan 断言）。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    sibAway65: { setters: ["pr_fam_sentdown65"], note: "归属输入事实（WP3）：兄姐下乡未归、未在乡成家（L65-衔 away 款立）" },
    sibBack65: { setters: ["pr_fam_sentdown65"], note: "归属输入事实（WP3）：兄姐已返城待业（L65-衔 back 款立）" },
    sibMarried65: { setters: ["pr_fam_sentdown65"], note: "归属输入事实（WP3）：兄姐已在乡成家，不在可顶替之列（L65-衔 married 款立）" },
    sibNone65: { setters: ["pr_fam_sentdown65"], note: "归属输入事实（WP3）：兄姐无下乡待业情形或独生（L65-衔 none 款立）" },
    famRetire65: { setters: ["pr_teen2"], note: "归属输入事实（WP3）：父母一方办退休/退职、顶替表已发下（L65-家 retire 款立）" },
    famWorking65: { setters: ["pr_teen2"], note: "归属输入事实（WP3）：父母离退休还早（L65-家 working 款立；归属规则第 (4) 条不触发）" },
    quota_decided65: { setters: ["pr_teen2"], note: "顶替名额已由发放规则定归属（WP3；由集成补丁在 quotaRule 命中时与 quotaHolder 同步立）" },
    famSpeak65: { setters: ["pr_teen2"], note: "L65-家小应对记号（WP3）：当面争了一回；成年回响 e65_065 消费" },
    famYield65: { setters: ["pr_teen2"], note: "L65-家小应对记号（WP3）：把话咽回去顾全家里；成年回响 e65_063/e65_065 消费" },
    took_quota65: { setters: ["pr_fork16"], note: "顶替进厂形落点（WP3）：fork16 顶替选项立；下岗分口 e65_062 require 消费" },
    assign_swap65: { setters: ["e65_001"], note: "毕业分配边缘动作（WP3）：托关系对调；e65_057 chain 消费" },
    assign_obey65: { setters: ["e65_001"], note: "毕业分配边缘动作（WP3）：服从分配去报到。消费者：CL-135 接——era1965 回响拍 e65_097（chain e65_001＋require 本旗，报到头一年），与 assign_swap65→e65_057 对称；此前无消费者（CL-134 P3），本片 (a) 类接上" },
    job_hunt65: { setters: ["e65_058"], note: "招工登记跑动记号（WP3）：天天去街道问信儿。跑动的结果由后续入行事实本身承载，本旗为过程留痕，无下游消费者属定性如此（CL-134 P3／CL-135 (b) 类处置：留痕定性，不接不退役）" },
    night_class65: { setters: ["e65_059"], note: "夜校补习记号（WP3）：只记报了名这一步——读没读完、文凭用没用上由后续学历事实承载，本旗为履历留痕，无下游消费者属定性如此（CL-134 P3／CL-135 (b) 类处置：留痕定性，不接不退役）" },
    buyout65: { setters: ["e65_060", "e65_062"], note: "本人买断已签（WP3 下岗链：链头 e65_060 立、顶替分口 e65_062 签字选项立；两条互 forbid 防双买断叙事）" },
    mark_pencil65: { setters: ["pr_child1"], note: "童年记号（WP3 序章包）" },
    mark_eraser65: { setters: ["pr_child1"], note: "童年记号（WP3 序章包）" },
    mark_river65: { setters: ["pr_child1"], note: "童年记号（WP3 序章包）" },
    mark_hoop65: { setters: ["pr_child2"], note: "童年记号（WP3 序章包）" },
    mark_movie65: { setters: ["pr_child2"], note: "童年记号（WP3 序章包）" },
    mark_wheat65: { setters: ["pr_child2"], note: "童年记号（WP3 序章包）" },
    mark_books65: { setters: ["pr_child4"], note: "童年记号（WP3 序章包）" },
    mark_tv65: { setters: ["pr_child4"], note: "童年记号（WP3 序章包）" },
    mark_tree65: { setters: ["pr_child4"], note: "童年记号（WP3 序章包）" },
    mark_table65: { setters: ["pr_fam_sentdown65"], note: "记号（WP3）：L65-衔摆碗筷，影子句在序章包 marks" },
    moved_school65: { setters: ["pool_move65"], note: "学籍线事实（WP3，§3.6 长尾）：搬家低龄/中段转过学；由池调度按 poolSetByStage 在呈现时立，结算/影子消费归 WP9" },
    moved_exam65: { setters: ["pool_move65"], note: "学籍线事实（WP3，§3.6 长尾）：临考段搬家、学籍随转；§3.6 口径下 migrantExam 的事实来源之一，读法归 WP9/集成" },
    mark_movebox65: { setters: ["pool_move65"], note: "记号（WP3）：搬家低龄段帮着捆箱子，影子句在序章包 marks" },
    mark_move65: { setters: ["pool_move65"], note: "记号（WP3）：搬家中段/临考段，影子句在序章包 marks" },
    mark_desk65: { setters: ["pr_child4"], note: "记号（WP3）：F65-b 复习条件——家里腾桌，影子句在序章包 marks" },
    mark_dawn65: { setters: ["pr_child4"], note: "记号（WP3）：F65-b 复习条件——起早背书，影子句在序章包 marks" },
    boughtReform: { setters: ["e65_064", "e55_062"], note: "房改买下（E7 住房事实旗）：本代 e65_026 买下后经 e65_064 补全手续立；e55_062 是 WP2 本代同旗 setter（E7 跨代共用旗，两线登记内容应一致，集成时以先登记者为准）；结算读法归 WP9" },
  },
  enumFacts: {},
  familyFacts: {
    famMove65: { beat: "搬家（池）", note: "父母工作调动搬家已经历（c1965，WP3 §3.6 旗舰池条目）" },
    famQuota65: { beat: "L65-家", note: "顶替名额这件家庭大事已在饭桌上定下（c1965，WP3）；归属本体是枚举事实 quotaHolder，不在本表" },
    sibAway65: { beat: "L65-衔", note: "兄姐下乡未归（归属输入事实，WP3）" },
    sibBack65: { beat: "L65-衔", note: "兄姐返城待业（归属输入事实，WP3）" },
    sibMarried65: { beat: "L65-衔", note: "兄姐在乡成家（归属输入事实，WP3）" },
    sibNone65: { beat: "L65-衔", note: "兄姐无下乡待业情形（归属输入事实，WP3）" },
    famRetire65: { beat: "L65-家", note: "父母退休退职、顶替表发下（归属输入事实，WP3）" },
    famWorking65: { beat: "L65-家", note: "父母离退休还早（归属输入事实，WP3）" },
  },
  examBandTables: {
    c1965: {
      school: { high: 35, mid: 40, low: 25 },
      half: { high: 20, mid: 40, low: 40 },
      note: "c1965 F65-b 小升初分层（WP3 定版）：设计参数，无统计出处；band 只分层、不切 16 岁选项面。fix3 B1（子类 3a）：never 行删除——没进过校门的人不掷 band（与 c1985/c1995 口径对齐，另由 pr_child4 的 bandSkipSchooling 在引擎侧兜底）",
    },
  },
  // 分根集成预留（蓝图 §七，评审后薄集成）：c1965 分根拍＝pr_fork16（顶替形，选择分根），
  // splitPoint 标记随本行预留；anchors 本体已有同 era+id 骨架行，合入器按先登记者胜跳过本行，
  // 集成步须把 splitPoint 字段补进骨架行（见 logs/wp3.md 预留节）。锚点段文案本轮不写。
  prologueForks: [
    { era: "c1965", age: 16, id: "pr_fork16", status: "live", splitPoint: true, form: "F65-a 顶替名额归属后的本人路（WP3）" },
  ],
}]);
