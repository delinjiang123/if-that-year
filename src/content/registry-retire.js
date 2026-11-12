// 《如果那年》退休可能性池登记数据文件（游戏性波次第一波）——形状随 WP1 骨架
// （registry-v023.js）：加载期由 registry.js 尾部的合入器并入，同名键先登记者胜。
// 本文件只登记退休池新旗（本体已登记者不在此重登）。加载点与 registry-wp8.js 同位
// （其后、src/world/state.js 之前）：index.html / tools 三件（validate-state、
// validate-storylet、stateline-assert）。
// 命名口径：链锚旗 <主题>_begun（开启拍整拍落，链内后继以 require＋flagAgeMin 读）；
// 分支/经手旗按稿 C 接口表。note 里标注将来判词可读的面（晚年/职业/居住/关系），
// 面片拼装批按此消费，本批不改判词层。
// CL-145（路线总账 P4）：上表 37 面晚年结果旗已逐旗接消费者——32 面走 settlement.js
// lifeTags 轨迹行、5 面走 pack135 回响拍，注记已逐旗补指向；本文件头所述「本批不改
// 判词层」为退休池首批的旧口径，CL-145 起判词层已按注记消费。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    // —— ① 游山玩水链 ——
    "travel_begun": { "setters": ["rt_travel_duo", "rt_travel_solo"], "note": "退休后出游链已开启（整拍落点，两张脸共用）：链内露面/经手读它；判词晚年面可读" },
    "travel_group": { "setters": ["rt_travel_duo", "rt_travel_solo"], "note": "出游形态：跟团（玩家亲选，不分高下）；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "travel_pair": { "setters": ["rt_travel_duo", "rt_travel_solo"], "note": "出游形态：双人慢慢走（有伴侣局指另一半，独行局指老朋友，文本已分脸）；判词晚年面/关系面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "travel_near": { "setters": ["rt_travel_duo", "rt_travel_solo"], "note": "出游形态：近处转转（明写近处的好，不作退而求其次读）；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "travel_kept": { "setters": ["rt_travel_decide"], "note": "出游经手：还走，换个走法；回响 rt_travel_echo_kept 与平年下标 6 读它" },
    "travel_paused": { "setters": ["rt_travel_decide"], "note": "出游经手：歇一年再说；平年下标 5（没出远门的那年）读它" },
    "travel_packed": { "setters": ["rt_travel_decide"], "note": "出游经手：收箱子不出远门；回响 rt_travel_echo_packed 读它" },
    // —— ② 开直播链（minYear=2016 硬门在条目侧） ——
    "stream_begun": { "setters": ["rt_stream_open"], "note": "直播链已开启（整拍落点）：露面/经手与剪辑班互链（rt_class_edit）读它；判词晚年面可读" },
    "stream_craft": { "setters": ["rt_stream_open"], "note": "直播内容：播老本行（玩家按自己主业自选）；判词晚年面/职业面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "stream_cook": { "setters": ["rt_stream_open"], "note": "直播内容：播做饭；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "stream_chat": { "setters": ["rt_stream_open"], "note": "直播内容：聊天讲老事；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "stream_fun": { "setters": ["rt_stream_decide"], "note": "直播经手：拒带货，接着聊自己的；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "stream_sold": { "setters": ["rt_stream_decide"], "note": "直播经手：接带货，只卖自己试过觉得好的；回响 rt_stream_echo_sold 与平年下标 13 读它" },
    "stream_closed": { "setters": ["rt_stream_decide"], "note": "直播经手：关播；回响 rt_stream_echo_closed 读它" },
    // —— ③ 邮轮 ——
    "cruise_world": { "setters": ["rt_cruise_world"], "note": "坐大船走远线（一档门：钱≥70 且健康≥50，门在条目 stats 侧）；回响 rt_cruise_echo 与平年下标 7 读它；判词晚年面可读" },
    "cruise_near": { "setters": ["rt_cruise_near"], "note": "坐船走近线（二档门：钱≥58 且健康≥40）；回响 rt_cruise_echo 读它；判词消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "cruise_train": { "setters": ["rt_cruise_world", "rt_cruise_near"], "note": "邮轮两拍的第三条路：改坐慢火车（明写不判低，与坐船同落晚年面）；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ④ 移居过冬 ——
    "winter_begun": { "setters": ["rt_winter_home", "rt_winter_away"], "note": "过冬议题已呈（整拍落点，有房/租房两张脸共用；租房脸以 forbid 它防同局双呈）：判词居住面可读" },
    "winter_moved": { "setters": ["rt_winter_home", "rt_winter_away"], "note": "今年去暖和地方过冬了；经手 rt_winter_decide 以它计时；判词居住面可读" },
    "winter_home": { "setters": ["rt_winter_home", "rt_winter_away", "rt_winter_decide"], "note": "过冬决定：守着这边（与 moved 同权，不作低读）；判词居住面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "winter_again": { "setters": ["rt_winter_decide"], "note": "过冬经手：第二年还去；判词居住面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ⑤ 开小店链 ——
    "shop_begun": { "setters": ["rt_shop_open"], "note": "小店链已开启（整拍落点）：判词晚年面/职业面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "shop_opened": { "setters": ["rt_shop_open"], "note": "小店已开（门脸/家门口小铺两式同旗）；椅子拍与经手拍以 require＋flagAgeMin 读它" },
    "shop_regulars": { "setters": ["rt_shop_chair"], "note": "椅子拍落点：修椅子攒下熟客（较真/简单补两式同旗）；判词职业面可读（手艺口碑）；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "shop_grew": { "setters": ["rt_shop_decide"], "note": "小店经手：慢慢做大，招了帮手；判词晚年面可读；消费者：回响拍 p135_004（CL-145）" },
    "shop_kept": { "setters": ["rt_shop_decide"], "note": "小店经手：就这么守着；平年下标 8（小店还开着）读它" },
    "shop_wound_down": { "setters": ["rt_shop_decide"], "note": "小店经手：退休后开的小店关了（选项回响预先写死「店关了，手艺还在」）；回响 rt_shop_echo 读它。注意与本体 shop_closed（中年合伙/主业店关张，p2_040/p30_008）分立，勿混读" },
    // —— ⑥ 带孙辈＋帮儿女搭把手链 ——
    "grandkid_begun": { "setters": ["rt_grand_open"], "note": "帮带娃链已开启（整拍落点）：露面（顶班）/经手（上学年）以 require＋flagAgeMin 读它；判词关系面可读" },
    "grandkid_full": { "setters": ["rt_grand_open"], "note": "带娃形态：过去全天带；平年下标 9（带娃那几年）读它；与 help/paid 三式不分高下" },
    "grandkid_help": { "setters": ["rt_grand_open"], "note": "带娃形态：搭把手，管接送和晚饭；三式不分高下；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "grandkid_paid": { "setters": ["rt_grand_open"], "note": "带娃形态：出钱请人带，自己常去看看；三式不分高下；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "kin_topup": { "setters": ["rt_grand_show"], "note": "帮儿女搭把手：儿女忙时住过去顶几天班（做饭、管孙辈吃住）；判词关系面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "grandkid_schooled": { "setters": ["rt_grand_decide"], "note": "带娃经手：孙辈上学，上午空出来，去找自己的事（与老年大学链同向）；回响 rt_grand_echo 读它" },
    "grandkid_kept": { "setters": ["rt_grand_decide"], "note": "带娃经手：孙辈上学后还接着帮接送；判词关系面可读；消费者：回响拍 p135_002（CL-145）" },
    "grandkid_rest": { "setters": ["rt_grand_decide"], "note": "带娃经手：歇下来享清静（与 schooled/kept 同权）；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "kin_far_visit": { "setters": ["rt_kin_far"], "note": "孩子在国外脸：攒钱过去住一阵看孙辈；判词关系面可读；消费者：回响拍 p135_005（CL-145）" },
    "kin_far_video": { "setters": ["rt_kin_far"], "note": "孩子在国外脸：固定视频看孙辈长大；判词关系面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ⑦ 摆小摊 ——
    "stall_begun": { "setters": ["rt_stall_open"], "note": "小摊链已开启（整拍落点）：判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "stall_started": { "setters": ["rt_stall_open"], "note": "小摊已支起（天天出摊/先试几天同旗）；露面 rt_stall_show 与平年下标 11 读它" },
    "stall_paused": { "setters": ["rt_stall_show"], "note": "小摊经手：天冷先收一阵（平年下标 11 以 notFlag 挡它）" },
    // —— ⑧ 老年大学链 ——
    "class_joined": { "setters": ["p24_051", "rt_class_open", "rt_class_edit"], "note": "进了老年大学/班（p24_051 本批起同落此旗，旧拍即链的一张脸；剪辑班经 rt_class_edit 选项同落）：露面/经手以 require＋flagAgeMin 读它；判词晚年面「越老越学」证据点（与 e55_045 选项、p24_013 合唱等既有证据并读）" },
    "class_photo": { "setters": ["rt_class_open"], "note": "老年大学选科：摄影（p24_051 的摄影班是它的一张年代脸）；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "class_write": { "setters": ["rt_class_open"], "note": "老年大学选科：书法；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "class_sing": { "setters": ["rt_class_open"], "note": "老年大学选科：合唱；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "class_kept": { "setters": ["rt_class_decide"], "note": "老年大学经手：接着学；判词晚年面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "class_helper": { "setters": ["rt_class_decide"], "note": "老年大学经手：帮老师带新人；平年下标 12 读它" },
    "class_paused": { "setters": ["rt_class_decide"], "note": "老年大学经手：先歇一学期（位置留着，与 kept/helper 同权）；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ⑨ 回老单位搭把手 ——
    "unit_helper": { "setters": ["rt_unit_open"], "note": "回老单位临时搭把手（非返聘：不改 workPhase，与返聘账分开）；收尾 rt_unit_echo 读它；判词职业面可读" },
    "unit_visit": { "setters": ["rt_unit_open"], "note": "不接活、老同事聚会场场到（与 unit_helper 同权）；判词关系面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ⑩ 种菜成规模 ——
    "garden_begun": { "setters": ["rt_garden_yard", "rt_garden_balcony"], "note": "种菜链已开启（整拍落点，院子/阳台两张脸共用；阳台脸以 forbid 它防同局双呈）：露面以 require 读它" },
    "garden_grown": { "setters": ["rt_garden_yard", "rt_garden_balcony"], "note": "种菜形态：扩大规模；规模脸 rt_garden_big 读它" },
    "garden_small": { "setters": ["rt_garden_yard", "rt_garden_balcony"], "note": "种菜形态：就种自己吃的（与 grown 同权）；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "garden_shared": { "setters": ["rt_garden_show"], "note": "种菜露面落点：收成送邻里（接 p24_035/p24_011 邻里线）；判词关系面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— ⑪ 守老屋修缮 ——
    "house_begun": { "setters": ["rt_house_open"], "note": "守老屋链已开启（整拍落点）：分年修露面以 require 读它；判词居住面可读" },
    "house_fixed": { "setters": ["rt_house_open", "rt_house_show"], "note": "老屋修了（分年修决定/当年修利索两处落点）；平年下标 10（修完那年冬天）读它" },
    "house_kept": { "setters": ["rt_house_open", "rt_house_show"], "note": "老屋处置：先不修/小毛病自己鼓捣，守着住（与 fixed 同权）；判词居住面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— 76+ 延伸 ——
    "old_friends_met": { "setters": ["rt_old_friends", "rt_old_neighbors"], "note": "八十岁上下的局赴了约（老朋友在世脸/老邻居脸同旗）：判词关系面晚年证据；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    // —— 自加拍 ——
    "skill_passed": { "setters": ["rt_skill_pass"], "note": "把手艺正式教给一个年轻人（读主业入行旗的手艺/技术类局）；判词职业面可读；消费者：回响拍 p135_001（CL-145）" },
    "moved_near_kid": { "setters": ["rt_move_kid"], "note": "晚年搬到孩子附近住；判词居住面可读；消费者：回响拍 p135_003（CL-145）" },
    "stayed_put": { "setters": ["rt_move_kid"], "note": "晚年搬家议题落点：不搬，守老地方（与 moved_near_kid 同权）；判词居住面可读；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "exercise_begun": { "setters": ["rt_health_club"], "note": "晨练队已加入（整拍落点）：体检回响 rt_health_echo 读它；判词晚年面健康证据" },
    "exercise_kept": { "setters": ["rt_health_echo"], "note": "晨练经手：体检数字稳住后接着练；消费者：settlement.js lifeTags 轨迹行（CL-145）" },
    "pet_old_friend": { "setters": ["rt_pet_old_cat", "rt_pet_old_dog"], "note": "陪老了的猫/狗（读宠物状态与真实年龄 petMin≥8）：判词关系面可读；消费者：settlement.js lifeTags 轨迹行（猫/狗两脸，CL-145）" },
  },
}]);
