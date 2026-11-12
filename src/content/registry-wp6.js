// 《如果那年》v0.23 WP6（通用层）登记数据文件——形状随 WP1 骨架（registry-v023.js 同形），
// 加载期合入点同 WP1 口径（registry.js 的 mergeRegistryExtra / anchors.js）。
// 本包登记结论：不立新旗、不立新枚举事实、不立家庭事实旗——
//   · fork25/fork28 年代皮只用既有 textEra/labelEra/echoEra 字段（WP1 E1 已登记）；
//   · fork33 两代框只用 eraFrame 字段（WP1 E2 已登记），框选项的 set 旗 bought_house/renting/
//     near_family 与本体同名同义，里程碑登记沿用本体，不新增 setter 条目（框与本体是同一分岔的
//     两副面孔，框选项 id 记作 fork33@eraFrame.<era>，对应关系登记在 anchors.js 的 eraFrames）；
//   · exam 链年代门只用既有 eraIn 字段（WP1 E10 已登记）；abroad 选项级 eraIn 同为既有字段。
// 本文件唯一的新字段契约：routes 的 descEra——{ 年代id: 文本 }，与事件 textEra 同形，挂在路线
// 对象上、与 desc 并列（events.js 五路线已落 c1955/c1965 两代）。呈现层消费点在 engine.js 的
// 两处路线渲染（esc(r.desc)），属热点文件，本包不直改——消费接线见补丁稿
// work/wp6-engine-patch.md；未合并前 descEra 不生效（回落 desc 原文，行为与现行一致）。
// 加载登记（index.html 脚本序、sim/校验工具载入清单）同为补丁稿事项，见 logs/wp6.md 补丁稿清单。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {},
  enumFacts: {},
  familyFacts: {},
  examBandTables: {},
  prologueForks: [],
}]);
