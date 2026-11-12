// pack135 — 晚年结果旗回响拍（CL-145，路线总账 P4 的 B 档）：给五面「结果要隔几年
// 才落定」的晚年旗各补一场回响戏——skill_passed（手艺传没传下去，看徒弟能不能
// 自己接活）、grandkid_kept（接送的结果在孙辈长大那天）、moved_near_kid（搬得值
// 不值，住惯了才算）、shop_grew（帮手能不能独当一面）、kin_far_visit（那一趟的
// 结果在回来后的视频里）。其余 32 面晚年结果旗走判词轨迹行（settlement.js
// lifeTags，CL-145 A 档），不在此包。
// 纪律：全拍 require 本旗＋flagAgeMin 隔年（把门交给落旗拍本身，退休口径随落旗
// 拍的退休后门，不另设年龄门）；零落新旗（无 set）；正文不出现价格数字；五拍
// 均不涉及伴侣称呼。样本岔开：手艺传徒（行当）／接送孙辈（近住儿女）／搬近儿女
// （迁居）／小店帮手（自营）／海外探亲（儿女在远方），无单一家庭形状复刻。
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
 { "id":"p135_001", "min":59, "max":88, "require":"skill_passed", "flagAgeMin":{"flag":"skill_passed","years":2},
   "text":"你教的那个年轻人，如今自己接活了。这天他拎着工具上门，说头一回单独干完一整件，人家验收时一句话没挑。他把工钱分出一半，推到你面前，说按老规矩，头一单要孝敬师父。你没收，让他去买了点菜，中午就在你这儿吃。席间他问，当年你师父是怎么教你的。你想了半天，说：也是这么教的，就是骂得比我凶。", "effects":{"relation":2,"growth":1} },
 { "id":"p135_002", "min":66, "max":90, "require":"grandkid_kept", "flagAgeMin":{"flag":"grandkid_kept","years":3}, "state":{"kids":"has"},
   "text":"小的上中学了，不用人接了。头一天放学，他自己背着书包拐到你家，进门先喊饿。你给他下了一碗面，他呼噜呼噜吃完，说：以后放学我都先来你这儿。你说好。这条接送的路，换了个走法，还没走完。", "effects":{"relation":3} },
 { "id":"p135_003", "min":61, "max":90, "require":"moved_near_kid", "flagAgeMin":{"flag":"moved_near_kid","years":1},
   "text":"搬过来住了一年多，楼下小卖部的老板认识你了，买东西不用当场结账也行。孩子下班顺路带把青菜上来，放下就走，有时也坐十分钟。过年那顿饭在哪家吃，不用再提前商量——都在你这儿。孩子说，你这屋，味儿对。", "effects":{"relation":2,"freedom":1} },
 { "id":"p135_004", "min":60, "max":88, "require":"shop_grew", "flagAgeMin":{"flag":"shop_grew","years":1},
   "text":"帮手如今能独当一面了。这天你去晚了，店里已经开了门，客人坐着等修活，茶都喝上了。你在门口站了一会儿，没进去，转身去公园遛了个弯。", "effects":{"relation":1,"freedom":2} },
 { "id":"p135_005", "min":58, "max":88, "require":"kin_far_visit", "flagAgeMin":{"flag":"kin_far_visit","years":1}, "state":{"kids":"has"},
   "text":"从孩子那边回来半年了，又到了视频的日子。屏幕一亮，小的先把脸凑过来，冲你伸手，喊得清清楚楚。孩子在旁边笑，说自打你过去住过那一阵，他就认人了。你盯着屏幕看了半天，挂了之后，把日历翻开，开始数下回能过去的日子。", "effects":{"relation":2} },
]);
