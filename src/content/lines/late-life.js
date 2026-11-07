// [M1-B 内容重组] 本文件现位于 src/content/lines/late-life.js（按领域重组搬入），除本行外内容一字未动。
// pack24 — v0.10.0 扩容（草稿 w10-pack24，整合时剥除 topic/cell 审计字段；智慧点位已经协调者生态再平衡，见 DEVLOG）
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
{"id":"p24_001","min":65,"max":68,"require":"kid_abroad","text":"孩子在国外，隔着十几个小时时差。你把复查单拍了照发过去，那边天还没亮。等回复的时候，你先自己把药盒按早晚分好，贴上写了大字的纸条。水杯就放在纸条旁边。","choices":[{"label":"把复查结果一条条打字发过去","effects":{"relation":2},"echo":"那边醒来回了一长串，你一条条看完，把手机扣在桌上，去热牛奶。"},{"label":"只说一句没事，别让那边惦记","effects":{"freedom":1,"relation":-1},"echo":"挂了视频你坐了一会儿。有些话不说，不代表不想说。"}]},
{"id":"p24_002","min":66,"max":69,"route":"abroad","text":"你在国外住了这些年，父母还在这边。每次回国探亲，行李箱一半是给父母带的东西，一半空着，留着装他们塞给你的咸菜、腊肉和一包包分好的药。箱子拉链上挂着个布兜。","choices":[{"label":"多留一周，陪父亲把体检做完","effects":{"relation":3,"money":-2},"echo":"改签费不便宜。候机时父亲发来消息，就三个字：路上慢。"},{"label":"按原计划走，视频里再慢慢说","effects":{"money":1,"relation":-1},"echo":"飞机起飞前你把合照设成了屏保，一路上看了好几次。"}],"stateAll":{"dad":"alive","mom":"alive"}},
{"id":"p24_003","min":70,"max":73,"route":"abroad","text":"母亲在电话里说腰不舒服，你在视频里让她把镜头对着药箱，一盒一盒念给你听。有两盒已经过了期，她舍不得扔，说药片看着还好好的。你把药名记在台历背面。","choices":[{"label":"让邻居帮忙上门扔掉过期的","effects":{"relation":2,"money":-1},"echo":"邻居拍了张新药箱的照片发来，摆得整整齐齐。"},{"label":"下次回国再处理，先记在备忘录里","effects":{"health":-1},"echo":"备忘录里那一行字，你每次打开手机都能看见。"}],"stateAll":{"mom":"alive"}},
{"id":"p24_004","min":71,"max":74,"require":"kid_abroad","text":"你的生日在这边是白天，在孩子那边是半夜。视频接通时那边刚下班，举着一块小蛋糕，蜡烛是拿打火机凑合点的，唱歌跑了调，你笑得直摆手。你把那一幕截了图存好。","effects":{"relation":3,"freedom":1}},
{"id":"p24_005","route":"abroad","forbid":["late_parent"],"min":75,"max":78,"text":"两头跑了这些年，你开始算一笔账：那边的医保和这边的老房子，冬天的暖气和夏天的台风。算盘打了半宿，最后写在纸上的只有一句，哪边离孩子近，哪边就是家。","choices":[{"label":"先在这边住着，那边冬天太冷","effects":{"freedom":2},"echo":"纸收进抽屉，账算是算完了，心里反倒轻了。"},{"label":"去孩子那边住一个冬天试试","effects":{"money":-2,"relation":2},"echo":"试住的行李收拾了两个箱子，护照放在最上面。"}],"state":{"kids":"has"}},
{"id":"p24_006","min":76,"max":79,"text":"另一半住院，你在陪护椅上睡了六晚。白天跑检查单，晚上听着监护仪的滴答声数拍子。出院那天，护士把注意事项念了一遍，你记了满满两页纸。","choices":[{"label":"回家后把注意事项贴在冰箱上","effects":{"health":1,"relation":2},"echo":"冰箱门上贴满了纸，拿牛奶的时候总要先看一眼复查日期。","set":"care_self"},{"label":"请个钟点工搭把手，自己缓一缓","effects":{"money":-2,"health":2},"echo":"钟点工第一次来，你在旁边站了半天，才慢慢坐下。","set":"care_hired_spouse"}],"state":{"spouse":"partnered"},"set":"spouse_hosp_done"},
{"id":"p24_007","min":65,"max":67,"text":"体检报告上多了两个要复查的箭头。医生说先别自己吓自己，三个月后再来。你把报告折好放进抽屉，出来在医院门口的长椅上坐了十分钟，才给家里打电话。","choices":[{"label":"回去就把酒柜锁了，钥匙收起来","effects":{"health":3,"freedom":-1},"echo":"朋友来家里，看见锁着的酒柜，什么也没问，陪你喝了茶。"},{"label":"照常过日子，复查的日子圈在日历上","effects":{"freedom":2},"echo":"日历上那个红圈，你每天撕一页，就离它近一天。"}],"set":"retired_checkup_done"},
{"id":"p24_008","route":"abroad","min":68,"max":71,"text":"整理旧物，翻出一只用了很多年的行李箱，轮子磨偏了，拉杆上还缠着褪色的行李牌。你没舍得扔，擦干净放回储藏室，说下次回国还用它。箱底还压着张旧登机牌。","effects":{"wisdom":3,"relation":1}},
{"id":"p24_009","min":77,"max":79,"chain":"p24_006","text":"另一半康复期的家里，节奏全变了。早饭改成软的，散步改成绕小区一圈，电视声音调小两格。你们谁也没提那场病，只是一个添水，一个把药递过去。水杯一直放在床头柜上。","effects":{"relation":3,"health":1},"state":{"spouse":"partnered"}},
{"id":"p24_010","min":73,"max":76,"require":"kid_abroad","text":"孩子在视频里教你用新软件订机票，讲了三遍，你在本子上记了步骤。第四遍你自己点完了，出票那一刻，你先截了图，才敢相信没订错日子。截图你又发给孩子确认。","effects":{"growth":2,"relation":2}},
{"id":"p24_011","min":77,"max":80,"text":"老邻居搬去和孩子同住，临走把阳台上的花托付给你。你接过来摆在自家阳台上，每天浇水的时候多浇一盆。花开的那天，你拍了照片发过去，那边回得很快。","choices":[{"label":"接过来，好好养着","effects":{"relation":2,"wisdom":2},"echo":"花摆在窗边，你每天路过都要看一眼开没开。"},{"label":"先拍照问清楚浇水的讲究","effects":{"growth":1,"relation":1},"echo":"对方回了长长一段养护说明，你打印出来贴在花盆边。"}]},
{"id":"p24_012","min":65,"max":69,"text":"社区里新开了个窗口，帮着办两地来回要用的各种证明。你排了半天队，材料还是缺一张。工作人员在本子上给你列了清单，说下次照着这个带，一次就能办完。","effects":{"growth":1}},
{"id":"p24_013","min":66,"max":70,"text":"你报了个跨城的合唱团，成员一半在这边，一半在视频那头。排练时网络总有半秒延迟，指挥笑着说就当是回声。第一次合上节拍，大家在屏幕两边一起鼓掌。","effects":{"relation":2,"freedom":2},"set":"choir_member"},
{"id":"p24_014","min":70,"max":74,"route":"abroad","ctx":{"settle":"abroad"},"text":"养老的钱你分在两边：一边存着日常开销，一边留着回国探亲的路费。汇率涨涨跌跌，你不跟着折腾，只在本子上记一笔，这个月换多少，心里有个准数就行。","effects":{"money":1}},
{"id":"p24_015","min":71,"max":75,"text":"膝盖开始怕楼梯。你把家里的东西重新归置了一遍，常用的都挪到伸手够得着的地方，凳子换成带扶手的。收拾完试坐了一下，稳稳当当，心里也跟着稳了点。","choices":[{"label":"自己慢慢归置，一个周末弄完","effects":{"health":2},"echo":"弄完那天你在新凳子上坐了很久，腿也不酸了。"},{"label":"请邻居过来帮忙搭把手","effects":{"relation":2,"money":-1,"wisdom":2},"echo":"邻居顺手把高处的东西也都挪了下来，还贴了标签。"}]},
{"id":"p24_016","min":75,"max":79,"text":"另一半睡得早，你睡得晚。你们商量好，卧室的灯留一盏小的，谁先睡谁先关大灯。夜里你起来倒水，借着那点光走，不吵醒谁，这办法用了好几年了。水杯放在你那侧的床头。","effects":{"relation":2,"health":1},"state":{"spouse":"partnered"}},
{"id":"p24_017","min":76,"max":80,"all":["kid_abroad"],"require":"kid_abroad","text":"过年的时候，孩子那边是工作日，没法回来。你包了饺子，冻好一盒，说等哪次谁顺路，给带过去。饺子在冰箱里放了很久，最后你们老两口自己慢慢吃完了。","choices":[{"label":"吃完就吃完，下次再包新鲜的","effects":{"freedom":2},"echo":"最后那一盘，你蘸了很多醋，说还是刚包的好吃。"},{"label":"拍张照片发过去，说留着呢","effects":{"relation":2},"echo":"那边回了个流泪的表情，又补了一句，明年一定回。"}],"stateAll":{"spouse":"partnered"}},
{"id":"p24_018","min":65,"max":68,"text":"老朋友的老伴走了，你陪着去办各种手续，跑了三个窗口。回来路上谁也没说话，到楼下你说，明天我给你送饭，别自己凑合。对方点点头，站在单元门口看了你一会儿。","choices":[{"label":"接下来一周，你把饭给他送过去","effects":{"relation":1},"echo":"一周的饭送下来，他开始自己下楼买菜了，见着你还道谢，说那几天多亏有你。","set":"delivered_meals_week"},{"label":"帮到手续办完，剩下的日子让他自己缓","effects":{"relation":2},"echo":"你隔几天打个电话问一声。他在电话里说，夜里还是睡不着，但饭能好好吃下去了。"}]},
{"id":"p24_019","forbid":["late_parent"],"min":68,"max":72,"text":"你把两边的地址、电话、常去医院的路线，都写在一张纸上，压在客厅的玻璃板下面。孩子回来看见了，拍照存进手机，说这张纸比导航还让人心里有底。","effects":{"relation":1},"state":{"kids":"has"}},
{"id":"p24_020","min":72,"max":76,"text":"年轻时一起出过远门的几个老朋友，建了个群，约着再走一趟当年去过的地方。商量了半个月，路线改了三次，最后定下来的只有一件事：走慢点，谁累了就坐下歇。","effects":{"freedom":2,"relation":2,"wisdom":2}},
{"id":"p24_021","min":65,"max":68,"era":"c1965","text":"账户里那几股纪念股还留着，分红一年几十块钱，你从来没卖。另一半问留着干什么，你说密码还是对方的生日，改起来麻烦，就这么放着吧，也算个念想。","effects":{"wisdom":3,"money":1},"state":{"spouse":"partnered"},"require":"held_stock_2015"},
{"id":"p24_022","min":66,"max":69,"era":"c1965","ctx":{"house":"owned"},"text":"房改房住到老，楼还是那栋楼，人换了一茬。加装电梯的方案贴在楼道里，分摊账算到每户头上，六楼出得多，一楼不出钱还嫌挡光，开了三次会才定下来。","choices":[{"label":"按方案签字，早装早省力","effects":{"money":-2,"health":2},"echo":"电梯开用那天，六楼的老邻居请大家吃了饺子。"},{"label":"再等等，看看别栋装完的效果","effects":{"money":1},"echo":"你还是每天爬楼，就当锻炼，只是买菜不敢买多了。"}]},
{"id":"p24_023","min":69,"max":72,"era":"c1965","text":"电梯装好那年，你七十出头。第一次不用扶着栏杆歇气就到家，你在门口站了一会儿。楼下空地上，老邻居们把棋摊支在电梯口旁边，谁上来都得先看一盘。","choices":[{"label":"下楼和老邻居下一盘棋再上去","effects":{"relation":2,"health":1},"echo":"棋下到一半，电梯里进进出出都是熟人，个个打招呼。"},{"label":"直接回家，先把菜放进冰箱","effects":{"health":1,"wisdom":2},"echo":"门一关，你靠在鞋柜上喘了口气，笑着摇摇头。"}]},
{"id":"p24_024","min":71,"max":74,"era":"c1965","text":"另一半第一次住院，病房在老楼里，电梯小，推床进去要侧着身。你在走廊的长椅上坐了半宿，天亮去食堂打了两份粥，一份放凉了，对方还没醒。长椅边放着个保温桶。","choices":[{"label":"白天请护工，自己晚上守着","effects":{"money":-2,"relation":2},"echo":"护工手法熟练，你在旁边学着给对方翻身、垫枕头。","set":"care_hired_spouse"},{"label":"把班排开，实在累了请人替一天","effects":{"relation":3,"health":-1},"echo":"排班表贴在病房门后，谁的名字后面都画了个勾。"}],"state":{"spouse":"partnered"},"set":"spouse_hosp_done","forbid":["spouse_hosp_done"]},
{"id":"p24_025","min":75,"max":78,"era":"c1965","chain":"p24_024","text":"另一半出院回家，康复期的家里多了根拐杖和一摞复查单。你把家具挪了挪，腾出一条能扶着走的道。对方第一次自己走到阳台，你在后面跟着，没伸手。","effects":{"relation":3,"health":1},"state":{"spouse":"partnered"}},
{"id":"p24_026","min":65,"max":67,"era":"c1965","require":"bought_renzheng","text":"早年认购证赚的那笔钱，家里换了冰箱和彩电，如今冰箱还在用，嗡嗡响。维修师傅说这型号的配件不好找了，你说先修着，修不好再说，它比新冰箱有年头多了。","effects":{"money":-1}},
{"id":"p24_027","kidAgeMin":21,"forbid":["late_parent"],"min":68,"max":71,"era":"c1965","text":"孩子成家后住得不远，周末回来吃饭。你还是按老习惯做一大桌，吃不完的装盒让带走。孩子说冰箱塞不下了，你说塞不下就分给同事，嘴上这么说，下次还做那么多。","effects":{"relation":3,"money":-1},"state":{"kids":"has"}},
{"id":"p24_028","min":72,"max":75,"era":"c1965","text":"单位组织退休的人回厂体检，排队的人里大半都认识。量血压的护士是当年厂医的徒弟，报数之前先喊一声老师傅。你的数值贴在合格线上，医生说继续保持，少盐。","effects":{"health":1,"relation":2},"require":"factory_work","set":"retired_checkup_done"},
{"id":"p24_029","min":76,"max":79,"era":"c1965","text":"你把年轻时在厂里练的那点手艺捡起来了，在社区活动室教孩子们做简单的木工活。刨子推下去，木花卷起来，有个孩子说这味道像爷爷家的老柜子，你听了很高兴。","effects":{"growth":2,"relation":2,"freedom":1},"require":"factory_work"},
{"id":"p24_030","ctx":{"anyFlag":["factory_work","fab_work"]},"min":77,"max":80,"era":"c1965","text":"老厂区改成了公园，高炉还留着，刷了防锈漆。你散步常绕着它走一圈，看年轻人拍照。解说牌上写着投产年份，正是你进厂的那一年，你站着看了一会儿才走。","choices":[{"label":"在解说牌前站一会儿再走","effects":{"wisdom":4},"echo":"风把牌子吹得轻轻响，你把外套拉链往上拉了拉。"},{"label":"拍张照发到老同事的群里","effects":{"relation":2,"wisdom":2},"echo":"群里很快热闹起来，有人认出了自己当年站的机位。"}]},
{"id":"p24_031","forbid":["late_parent"],"min":65,"max":69,"era":"c1965","text":"金婚那年，孩子张罗着去拍一张合影。摄影师让你们靠近点，你和另一半都有点不好意思，手不知道往哪放。照片洗出来，你挑了最不像摆拍的那张，摆在电视柜上。","effects":{"relation":3},"state":{"spouse":"partnered","kids":"has"}},
{"id":"p24_032","min":66,"max":70,"era":"c1965","text":"老同事里有人回了老家县城，有人跟着孩子去了外地。你们的聚会从一年一次变成谁回来谁召集。饭桌上先问的不是挣多少钱，是血压稳不稳，睡得好不好。","effects":{"relation":2}},
{"id":"p24_033","forbid":["late_parent"],"min":70,"max":74,"era":"c1965","text":"孩子想接你们过去同住，房子都看好了。你和另一半商量了几个晚上，还是决定住自己的老房子，离医院近，老邻居都在。孩子没再劝，只说那就常回来看看。","choices":[{"label":"把 钥匙给孩子一把，安心","effects":{"relation":2},"echo":"钥匙交出去那天，你又叮嘱了一遍燃气阀门的方向。"},{"label":"先这么住着，过两年再说","effects":{"freedom":2},"echo":"挂了电话，另一半把刚看好的楼盘单页收进了抽屉。"}],"state":{"spouse":"partnered","kids":"has"}},
{"id":"p24_034","min":71,"max":75,"era":"c1965","text":"老花眼又深了，配镜的时候顺便查了眼底。医生说没什么大问题，就是别再摸黑看手机。你回来把手机字体调到最大，另一半笑你，说这下隔着一米都能看见你聊什么。","effects":{"health":1,"growth":1},"state":{"spouse":"partnered"}},
{"id":"p24_035","min":75,"max":79,"era":"c1965","text":"楼上的老邻居一个人住，儿女都在外地。你顺手帮着取快递、换灯泡，对方过意不去，总往你家送饺子。你们说好了，谁家灯晚上没亮，就上楼敲敲门看看。这约定没写在纸上，可两家都记着。","effects":{"relation":2}},
{"id":"p24_036","min":76,"max":80,"era":"c1965","text":"整理抽屉，翻出当年买房改房时的那张收据，纸已经发黄，字还清楚。你把收据和房产证放在一起，压在最下面。另一半说留着吧，这可是咱们这一辈子最大的一笔账。","effects":{"wisdom":3,"relation":1},"state":{"spouse":"partnered"},"require":"bought_fangai"},
{"id":"p24_037","min":68,"max":72,"era":"c1965","text":"退休后你们重新分了工：买菜归你，交水电费归另一半，谁也不许越界指挥。头一个月磨合得直拌嘴，后来慢慢顺了。菜市场的人都认识你，知道你只买对方爱吃的那几样。","effects":{"relation":2,"freedom":1},"state":{"workPhase":"retired","spouse":"partnered"}},
{"id":"p24_038","forbid":["late_parent"],"min":73,"max":77,"era":"c1965","text":"老房子卫生间要改一改，加扶手，换防滑砖。施工那几天你们住到孩子家，晚上认床，睡不踏实。改完回去那天，你先扶着新扶手慢慢走了一遍，说这钱花得值。","effects":{"money":-2,"health":2},"state":{"kids":"has"},"stateAll":{"spouse":"partnered"}},
{"id":"p24_039","min":65,"max":68,"era":"c1978","text":"旧手机一直躺在抽屉里，充上电还能开。相册里存着六千点那年的账户截图，红得晃眼。你翻出来看了看，又关了机。另一半问看什么呢，你说看看年轻时候的胆子。","effects":{"wisdom":4},"state":{"spouse":"partnered"}},
{"id":"p24_040","min":66,"max":69,"era":"c1978","all":["bought_house"],"text":"当年咬牙买下的那套房，如今要处置了。是卖掉换个小的，还是留着出租，你和另一半把账算了一遍又一遍。中介的电话接了七八个，你们说不急，先过完这个冬天再说。","choices":[{"label":"挂出去慢慢卖，不降价硬扛","effects":{"money":1,"freedom":-1,"wisdom":2},"echo":"看房的人来了一拨又一拨，你们把阳台的花都挪了位置。"},{"label":"留着出租，租金补贴日常开销","effects":{"money":2},"echo":"第一个租客搬进来那天，你把水电表都拍了照存好。"}],"state":{"spouse":"partnered"}},
{"id":"p24_041","min":70,"max":73,"era":"c1978","require":["bought_house"],"text":"当年买房时掏空了两边存折，如今房贷早还清了。你把最后一期还款的短信翻出来，那条短信在旧手机里存了很多年。另一半说删了吧，你说再留留，也不占地方。","effects":{"wisdom":3,"relation":1},"state":{"spouse":"partnered"}},
{"id":"p24_042","min":71,"max":74,"era":"c1978","ctx":{"car":"now"},"text":"另一半第一次住院，是你开车送去的急诊。等结果的那几个小时，你在走廊里把手机电量耗到见底。医生说先观察，你才想起来打个电话，声音有点发抖。","choices":[{"label":"住院的东西连夜回去收拾齐","effects":{"relation":2,"health":-1},"echo":"清单是你坐在车里写的，写到一半，发现手还在抖。"},{"label":"先请几天假，陪护的事再排","effects":{"money":-1,"relation":3},"echo":"假条批下来，你把工位上的绿植托给了同事浇水。","echoForm":{"farm":"家里人把地里的活先分了分，你紧着这几天守在医院，别的往后再说。","self":"你把店里的活托给人照看几天，先紧着守在医院，别的往后再说。","flex":"你把这几天的单先停了，跟家里人排好班，轮着守在医院。"},"set":"care_self"}],"state":{"spouse":"partnered"},"set":"spouse_hosp_done","forbid":["spouse_hosp_done"]},
{"id":"p24_043","min":75,"max":78,"era":"c1978","chain":"p24_042","text":"出院回家后，康复期的家里按医嘱改了不少：盐罐收到柜子深处，散步路线固定下来，药盒换成一周七格的。你负责记复查日子，另一半负责假装不记得，逗你提醒。","effects":{"relation":3,"health":1},"state":{"spouse":"partnered"}},
{"id":"p24_044","min":65,"max":67,"era":"c1978","require":"kid_abroad","text":"孩子在海外定居，视频里带你们看新租的房子，一间一间走过去。走到厨房，孩子说这口锅是按你教的法子挑的。你对着屏幕点头，心里把那间厨房的样子记了又记。","effects":{"relation":3}},
{"id":"p24_045","min":68,"max":71,"era":"c1978","all":["kid_abroad"],"text":"你们商量要不要卖掉现在这套，去离孩子近一点的城市，或者干脆出国住一阵。名单列了三个地方，又划掉两个。最后决定先去住一个月试试，房子不急着动。","choices":[{"label":"先短住试试，合不合适再说","effects":{"freedom":2,"money":-2},"echo":"试住的那个月，你们把附近的菜市场和医院都摸清了。"},{"label":"还是守着老房子，心里踏实","effects":{"freedom":1},"echo":"决定说出口那晚，另一半把列名单的纸折好，夹进了相册。"}],"stateAll":{"spouse":"partnered"}},
{"id":"p24_046","forbid":["late_parent"],"min":69,"max":72,"era":"c1978","text":"体检中心换了新系统，报告直接发到手机上。你戴着老花镜一条条看，把看不懂的词截图发给孩子。那边查完了一条条解释回来，你说现在的报告，比当年的股票软件还复杂。","effects":{"health":1,"growth":1},"state":{"kids":"has"}},
{"id":"p24_047","min":76,"max":79,"era":"c1978","text":"当年一起排队看房的老同事，如今在群里聊的都是孙辈和体检。有人把当年楼盘的广告页拍照发出来，价格低得像印错了。大家笑了一阵，谁也没说要是当年多买一套的话。","effects":{"relation":2,"wisdom":3}},
{"id":"p24_048","min":77,"max":80,"era":"c1978","require":"kid_abroad","text":"孩子回国探亲只待十天，行程排得满满当当。走的那天，你把冰箱里准备的东西一样样往行李箱里塞，塞到拉链都费劲。孩子说那边都买得到，你说买得到和家里带的不一样。","effects":{"relation":3,"money":-1}},
{"id":"p24_049","min":65,"max":69,"era":"c1978","text":"你把当年没顾上玩的相机重新买了一台二手的，周末去江边拍日出。一起拍的几位都和你年纪相仿，谁起晚了就在群里发一句，今天的光让给你们了。","effects":{"freedom":2,"health":1,"growth":1}},
{"id":"p24_050","min":66,"max":70,"era":"c1978","text":"另一半迷上了跳广场舞，你负责在家把饭做好，掐着点去接。音乐停了，人群散开，你站在老地方等。对方走过来先问今天什么菜，你说回去看看不就知道了。","effects":{"relation":2,"health":1},"state":{"spouse":"partnered"}},
{"id":"p24_051","min":70,"max":74,"era":"c1978","set":"class_joined","text":"老年大学的摄影班要交作业，你拍了一组老小区的楼道。老师说构图不讲究，但是有生活。照片贴在教室后墙上，你路过的时候总要多站一会儿，看看自己那一张。","effects":{"growth":2,"freedom":1}},
{"id":"p24_052","min":75,"max":78,"era":"c1978","text":"小区的老电梯换新，停用一个月，你们每天爬楼就当锻炼。六楼的邻居暂时搬去了孩子家，临走把绿植都搬到你家阳台。新电梯启用那天，大家像过节一样轮流上去坐了一趟。","effects":{"relation":2,"health":1}},
{"id":"p24_053","min":75,"max":79,"era":"c1978","text":"另一半不在身边的那阵子，你一个人去做复查。候诊时旁边的人都有人陪，你把单子按顺序理好，一项项自己核对。做完给家里打电话，说都正常，晚上想吃碗热汤面。","effects":{"health":1,"freedom":1},"state":{"spouse":"partnered"}},
{"id":"p24_054","min":76,"max":80,"era":"c1978","ctx":{"car":"now"},"text":"你们把当年结婚时住的那间小屋的地址输进导航，开车慢慢找过去。街还是那条街，门面全换了。你站在对面看了一会儿，另一半说，走吧，前面新开了家面馆，尝尝去。","effects":{"wisdom":3,"relation":2},"state":{"spouse":"partnered"}},
{"id":"p24_055","min":68,"max":72,"era":"c1978","text":"父母那边年纪大了，你和兄弟姐妹在群里排了个陪诊表，谁有空谁去，费用记在一个共享的表格里。表格更新得比谁的朋友圈都勤，月底一对账，一分钱都不差。","effects":{"relation":2,"money":-1},"stateAll":{"dad":"alive","mom":"alive"},"forbid":"only_child"},
{"id":"p24_056","forbid":["late_parent"],"min":73,"max":77,"era":"c1978","all":["photos_scanned"],"text":"孩子把你们的老照片都扫描了，存成电子相册发回来。你和另一半对着平板一张张翻，认人，认地方，有一张谁也想不起来是在哪拍的，笑了半天，就那么过去了。","effects":{"relation":2},"state":{"spouse":"partnered","kids":"has"}}
]);

window.GAME_PACKS=(window.GAME_PACKS||[]).concat([
{"id":"p24_057","min":66,"max":72,"require":"delivered_meals_week","text":"送饭送到第七天，老朋友自己拎着菜上你家来了。对方说：缓过来了，这顿我请。你们在楼下小馆子坐了很久，说的都是年轻时候的事。","effects":{"relation":2}}
]);

// ============================================================
// 退休可能性池（游戏性波次第一波）：退休后按本局真账开门的第二局内容。
// 每条链同构：开启拍落 <x>_begun 锚旗＋分支旗 → 露面拍（require 锚旗＋flagAgeMin
// 隔年）→ 经手拍（再隔年，玩家亲手定去留，落 kept/paused/closed 类旗）→ 回响拍或
// 平年带出。判词层不读本文件，只读 registry-retire.js 登记的旗。
// 代价一律写进日子（回响/平年），正文不出现价格数字。伴侣只称对方/另一半。
// ============================================================
window.GAME_PACKS = (window.GAME_PACKS || []).concat([
 // —— ① 游山玩水（链）：退休后 0–3 年首呈；有伴侣/没伴侣两张脸，选项同集 ——
 { "id":"rt_travel_duo", "w":2, "min":55, "max":80, "state":{"workPhase":"retired"}, "stateAll":{"spouse":"partnered"}, "flagAgeWithin":{"flag":"retired_begun","years":3}, "set":"travel_begun",
   "text":"退下来头一年，家里商量着出去走一趟。年轻时出门是出差，老了出门，就想自己去看看。地图摊在茶几上，两个人拿笔圈了几个地方，圈着圈着就吵起来，吵完又接着圈。",
   "choices":[
     {"label":"跟团走，省心", "set":"travel_group", "effects":{"money":-3,"freedom":3}, "echo":"团里的节奏快，可该看的都看到了。回来之后，手头紧了一阵，买菜开始挑时令的买。"},
     {"label":"就两个人，慢慢走", "set":"travel_pair", "effects":{"money":-2,"freedom":4,"relation":2}, "echo":"不赶时间，走到哪儿算哪儿。在一个小城住了三天，天天去同一家店吃早饭，老板都认识你们了。"},
     {"label":"先在近处转转", "set":"travel_near", "effects":{"freedom":2,"health":1}, "echo":"没走远，就在周边住了两晚，爬了座小山。回来的时候说，近处也有近处的好，腿还受得住。"} ] },
 { "id":"rt_travel_solo", "w":2, "min":55, "max":80, "state":{"workPhase":"retired"}, "stateNot":{"spouse":["partnered"]}, "flagAgeWithin":{"flag":"retired_begun","years":3}, "set":"travel_begun",
   "text":"退下来头一年，老伙计撺掇你出去走一趟。年轻时出门是出差，这回出门，就想自己去看看。行李收拾了两天，箱子摊在地上，塞了又减，减了又塞。",
   "choices":[
     {"label":"跟团走，省心", "set":"travel_group", "effects":{"money":-3,"freedom":3}, "echo":"团里有几个同龄人，一路聊得来。回来之后手头紧了一阵，买菜开始挑时令的买。"},
     {"label":"约上老朋友，慢慢走", "set":"travel_pair", "effects":{"money":-2,"freedom":4,"relation":2}, "echo":"不赶时间，走到哪儿算哪儿。在一个小城住了三天，天天去同一家店吃早饭，老板都记住了。"},
     {"label":"先在近处转转", "set":"travel_near", "effects":{"freedom":2,"health":1}, "echo":"没走远，就在周边住了两晚，爬了座小山。回来的时候想，近处也有近处的好。"} ] },
 { "id":"rt_travel_show", "w":2, "min":56, "max":82, "state":{"workPhase":"retired"}, "require":"travel_begun", "flagAgeMin":{"flag":"travel_begun","years":1}, "flagAgeWithin":{"flag":"travel_begun","years":6},
   "text":"出去那趟的照片，洗出来一小本，放在茶几上。谁来家里都翻，翻到一半就问：这地方在哪儿？你讲了一遍又一遍，也不嫌烦。", "effects":{"relation":1,"freedom":1} },
 { "id":"rt_travel_decide", "min":57, "max":84, "state":{"workPhase":"retired"}, "require":"travel_begun", "flagAgeMin":{"flag":"travel_begun","years":2}, "flagAgeWithin":{"flag":"travel_begun","years":7},
   "text":"又到出门的季节，同行的老伙计打电话来问：今年还走不走？你的腿、你的腰、你手里的钱，都得在电话这头掂量一遍。",
   "choices":[
     {"label":"还走，换个走法", "set":"travel_kept", "effects":{"freedom":3,"money":-2}, "echo":"这回不赶景点，挑了个地方住下来，慢慢逛。回来的时候说，这样走不累。"},
     {"label":"歇一年再说", "set":"travel_paused", "effects":{"health":1}, "echo":"电话那头也没勉强，说那就明年。这一年你在家把花养好了，也算没闲着。"},
     {"label":"收箱子了，以后不出远门", "set":"travel_packed", "effects":{"wisdom":1}, "echo":"行李箱推到柜子顶上。想看的时候，翻翻照片。"} ] },
 { "id":"rt_travel_echo_kept", "min":58, "max":86, "require":"travel_kept", "flagAgeMin":{"flag":"travel_kept","years":1},
   "text":"相册又添了新的一本。晚辈来家里，翻着相册问东问西，你讲得起劲。讲到一半自己先笑了：那时候腿脚还真行。", "effects":{"relation":2,"freedom":1} },
 { "id":"rt_travel_echo_packed", "min":58, "max":86, "require":"travel_packed", "flagAgeMin":{"flag":"travel_packed","years":1},
   "text":"不出远门之后，日子过得慢了。老伙计出去玩，回来给你带点当地的吃食，坐在家里听他们讲，也像跟着走了一趟。", "effects":{"relation":2} },
 // —— ② 开直播（链）：minYear=2016 硬门（§7 绑公历不绑年龄）；无钱门无健康门 ——
 { "id":"rt_stream_open", "min":55, "max":80, "minYear":2016, "state":{"workPhase":"retired"}, "flagAgeWithin":{"flag":"retired_begun","years":10}, "set":"stream_begun",
   "text":"小区里有人开了直播，播自己养花做饭，看的人还不少。老伙计撺掇你：你这一肚子本事，播出去肯定有人看。你嘴上说瞎胡闹，晚上回家，把手机支在桌上，对着自己看了半天。",
   "choices":[
     {"label":"播自己的老本行", "set":"stream_craft", "effects":{"freedom":2,"growth":2}, "echo":"头一场没几个人。你也不急，把手里的活慢慢干，边干边讲。讲的都是干了几十年的事，不用打草稿。"},
     {"label":"播做饭", "set":"stream_cook", "effects":{"freedom":2,"relation":1}, "echo":"你把灶台收拾干净，手机架在油烟机旁边。一道菜从洗到出锅，一步不落。有人问盐放多少，你说：尝。"},
     {"label":"就聊天，讲讲老事", "set":"stream_chat", "effects":{"freedom":2,"relation":1}, "echo":"没什么才艺，就坐着聊。讲讲年轻时候的事，讲讲这一行的老规矩。听的人不多，可留下来的，都听得认真。"} ] },
 { "id":"rt_stream_show", "min":56, "max":82, "minYear":2016, "state":{"workPhase":"retired"}, "require":"stream_begun", "flagAgeMin":{"flag":"stream_begun","years":1}, "flagAgeWithin":{"flag":"stream_begun","years":5},
   "text":"播了一阵，有了些熟脸。有人天天来报到，进来先打一行字：来了。你把人家的名字都记住了。有一回你感冒停了两天，再开播的时候，好多人在问：好了没？", "effects":{"relation":2,"freedom":1} },
 { "id":"rt_stream_decide", "min":57, "max":84, "minYear":2016, "state":{"workPhase":"retired"}, "require":"stream_begun", "flagAgeMin":{"flag":"stream_begun","years":2}, "flagAgeWithin":{"flag":"stream_begun","years":8},
   "text":"有个做买卖的找上门，说你这直播间人气稳，想让你帮着卖点东西，给提成。你听完没马上答应，说回去想想。这事，得想清楚。",
   "choices":[
     {"label":"接，卖自己用过觉得好的", "set":"stream_sold", "effects":{"money":3,"freedom":1}, "echo":"你先把东西买回来试，试好了才在直播间里讲。卖得不算多，可没人说你坑人。"},
     {"label":"不接，接着聊自己的", "set":"stream_fun", "effects":{"freedom":2}, "echo":"你把话说得很客气：我这儿就是聊天的地方。对方也没勉强。往后你播你的，清清静静。"},
     {"label":"播够了，关了吧", "set":"stream_closed", "effects":{"health":1,"freedom":1}, "echo":"最后一场，你把老观众的名字念了一遍，说往后不播了。关掉手机那天，你睡了个午觉，睡得挺长。"} ] },
 { "id":"rt_stream_echo_sold", "min":58, "max":86, "minYear":2016, "require":"stream_sold", "flagAgeMin":{"flag":"stream_sold","years":1},
   "text":"带货的钱不多，每月到账一笔。你把这笔钱单放着，说这是直播挣的，跟退休金不是一回事。花的时候，也比别的钱仔细些。", "effects":{"money":1} },
 { "id":"rt_stream_echo_closed", "min":58, "max":86, "minYear":2016, "require":"stream_closed", "flagAgeMin":{"flag":"stream_closed","years":1},
   "text":"关了直播之后，偶尔还有老观众在别处认出你，问你怎么不播了。你笑笑说，年纪大了，歇了。对方点点头，说：你讲的那些，我还记着呢。", "effects":{"relation":2} },
 // —— ③ 邮轮（高门单拍＋经手）：一档长线/二档短线；第三条路坐慢火车，明写不判低 ——
 { "id":"rt_cruise_world", "min":56, "max":80, "state":{"workPhase":"retired"}, "stats":[{"k":"money","gt":69},{"k":"health","gt":49}], "flagAgeWithin":{"flag":"retired_begun","years":8},
   "text":"攒了这些年，手头头一回宽裕出一个整数。有人提了一句：这辈子还没坐过大船出过远海呢。这话说完，屋里静了一下。这个念头，以前想都不敢想。",
   "choices":[
     {"label":"去，坐大船走一趟远的", "set":"cruise_world", "effects":{"money":-6,"freedom":5}, "echo":"船离港那天，你站在甲板上看了很久。海大得很，人站在上头，显得很小。这片海，总算亲眼见着了。"},
     {"label":"不坐船了，改坐慢火车", "set":"cruise_train", "effects":{"money":-2,"freedom":3}, "echo":"火车慢慢开，窗外的东西一样一样往后退。你说这样也好，看得清楚，还不用晕船。"} ] },
 { "id":"rt_cruise_near", "min":56, "max":80, "state":{"workPhase":"retired"}, "stats":[{"k":"money","gt":57},{"k":"health","gt":39}], "forbid":"cruise_world", "flagAgeWithin":{"flag":"retired_begun","years":8},
   "text":"手头的钱，紧巴一点，也够出去走一趟像样的了。有人说近海就有大船，几天就回来，不折腾。这话听着，心里动了一下。",
   "choices":[
     {"label":"去，坐船走一趟近的", "set":"cruise_near", "effects":{"money":-4,"freedom":4}, "echo":"船上的日子慢。白天看海，晚上听广播。回来上岸的时候，腿还有点飘，扶着栏杆站了一会儿。"},
     {"label":"不坐船了，改坐慢火车", "set":"cruise_train", "effects":{"money":-2,"freedom":3}, "echo":"火车慢慢开，窗外的东西一样一样往后退。你说这样也好，看得清楚，还不用晕船。"} ] },
 { "id":"rt_cruise_echo", "min":57, "max":84, "ctx":{"anyFlag":["cruise_world","cruise_near"]},
   "text":"出去那一趟回来，日子紧了一阵。买菜挑时令的，衣服也不添新的了。可谁要问值不值，你都说值。", "effects":{"wisdom":1} },
 // —— ④ 移居过冬：有老家房/租房过冬两张脸；第二年去不去由玩家再经手 ——
 { "id":"rt_winter_home", "min":56, "max":82, "state":{"workPhase":"retired"}, "ctx":{"house":"owned"}, "flagAgeWithin":{"flag":"retired_begun","years":10}, "set":"winter_begun",
   "text":"入冬之前，家里商量：今年冬天，回老家那边的房子住几个月。那边暖和，菜也便宜。老房子空着也是空着，回去住住，顺带收拾收拾。",
   "textState":{"spouse":{"single":"入冬之前，你盘算着：今年冬天，回老家那边的房子住几个月。那边暖和，菜也便宜。老房子空着也是空着，回去住住，顺带收拾收拾。","none":"入冬之前，你盘算着：今年冬天，回老家那边的房子住几个月。那边暖和，菜也便宜。老房子空着也是空着，回去住住，顺带收拾收拾。","divorced":"入冬之前，你盘算着：今年冬天，回老家那边的房子住几个月。那边暖和，菜也便宜。老房子空着也是空着，回去住住，顺带收拾收拾。","widowed":"入冬之前，你盘算着：今年冬天，回老家那边的房子住几个月。那边暖和，菜也便宜。老房子空着也是空着，回去住住，顺带收拾收拾。"}},
   "choices":[
     {"label":"去，过个暖冬", "set":"winter_moved", "effects":{"health":2,"money":-1}, "echo":"到了那边，早上不用穿那么厚。邻居还是老邻居，见了面先问：今年住多久？"},
     {"label":"不去了，守着这边", "set":"winter_home", "effects":{"relation":1}, "echo":"想想还是没动。这边的冬天冷是冷，可住惯了，心里踏实。"} ] },
 { "id":"rt_winter_away", "min":56, "max":82, "state":{"workPhase":"retired"}, "forbid":"winter_begun", "flagAgeWithin":{"flag":"retired_begun","years":10}, "set":"winter_begun",
   "text":"入冬之前，老伙计说起他们去南方过冬的事：租个小房子，住几个月，天暖和，菜也新鲜。说的人多了，你也跟着盘算起来。",
   "choices":[
     {"label":"去，租个小房子住一冬", "set":"winter_moved", "effects":{"health":2,"money":-3}, "echo":"到了那边才发现，过冬的人真不少。早上一起去买菜，下午在楼下晒太阳，慢慢都混熟了。"},
     {"label":"不去了，守着这边", "set":"winter_home", "effects":{"relation":1}, "echo":"想想还是没动。这边的冬天冷是冷，可住惯了，心里踏实。"} ] },
 { "id":"rt_winter_decide", "min":57, "max":84, "state":{"workPhase":"retired"}, "ctx":{"anyFlag":["winter_moved"]}, "flagAgeMin":{"flag":"winter_moved","years":1}, "flagAgeWithin":{"flag":"winter_moved","years":4},
   "text":"又快入冬了。去过冬的那地方，有人捎话来问：今年还来不来？房东还给你留着那间朝南的屋子。",
   "choices":[
     {"label":"还去，都熟了", "set":"winter_again", "effects":{"health":2,"money":-2}, "echo":"行李比头一年收拾得利索。到了那边，房东在楼下等着，说屋子都打扫好了。"},
     {"label":"不去了，在家过冬", "set":"winter_home", "effects":{"relation":1}, "echo":"你把话回了：今年不去了。那边的人在电话里说，那你们多保重，明年再说。"} ] },
 // —— ⑤ 开小店（链）：钱/健康二档门；椅子拍是露面，经手三落点，关张文案预先写死 ——
 { "id":"rt_shop_open", "min":55, "max":78, "state":{"workPhase":"retired"}, "stats":[{"k":"money","gt":44},{"k":"health","gt":34}], "flagAgeWithin":{"flag":"retired_begun","years":6}, "set":"shop_begun",
   "text":"街口有个小门脸空出来，租金不高。家里人说：你闲着也是闲着，支个小店吧，干点你拿手的。你去看了两回门脸，没吭声，心里已经在盘算柜台摆哪儿了。",
   "textForm":{"self":"街口有个小门脸空出来，租金不高。家里人说：你这一摊事做了大半辈子，闲着也是闲着，接着支起来吧。你去看了两回门脸，没吭声，心里已经在盘算柜台摆哪儿了。","farm":"镇上有个小门脸空出来，租金不高。家里人说：你伺候了一辈子地和牲口，闲着也是闲着，支个小店卖点自家的东西吧。你去看了两回门脸，没吭声，心里已经在盘算柜台摆哪儿了。"},
   "choices":[
     {"label":"租下来，开起来", "set":"shop_opened", "effects":{"money":-4,"freedom":2}, "echo":"开业那天没放炮，门口摆了两盆花。头一个客人是熟人，买完东西说：你这店，开得像样。"},
     {"label":"先在家门口支个小铺，试试水", "set":"shop_opened", "effects":{"money":-2,"freedom":2}, "echo":"铺子小，可五脏俱全。街坊路过都要站一站，买不买东西，先聊两句。"} ] },
 { "id":"rt_shop_chair", "w":2, "min":56, "max":80, "state":{"workPhase":"retired"}, "require":"shop_opened", "flagAgeMin":{"flag":"shop_opened","years":1}, "flagAgeWithin":{"flag":"shop_opened","years":7},
   "text":"店里接了个修椅子的活，是熟客从家里搬来的，坐了十几年，椅腿裂了一道，裂在看不见的地方。你数了数，这是这个月第十七张椅子了。这样的活不赚钱，可你接了。你把椅子翻过来，拿手摸那道裂，摸了半天。",
   "choices":[
     {"label":"较真，拆开重做", "set":"shop_regulars", "effects":{"health":-1,"relation":2}, "echo":"你把椅腿整个拆下来，重新做过。修好送回去，熟客坐上去晃了晃，说：跟新的一样。你说，新的没这个结实。"},
     {"label":"简单补补，能坐就行", "set":"shop_regulars", "effects":{"relation":1}, "echo":"你加了块料，打磨光了。熟客搬走的时候说，先坐着，塌了再来找你。你说，塌不了。"} ] },
 { "id":"rt_shop_decide", "min":57, "max":82, "state":{"workPhase":"retired"}, "require":"shop_opened", "flagAgeMin":{"flag":"shop_opened","years":2}, "flagAgeWithin":{"flag":"shop_opened","years":10},
   "text":"小店开了几年，你得有个打算了。腰不如前两年，店里离不了人，可这摊子，又是你一天天支起来的。",
   "choices":[
     {"label":"慢慢做大一点，再招个帮手", "set":"shop_grew", "effects":{"money":3,"freedom":-1}, "echo":"帮手是个年轻人，手脚勤快。你把要紧的活留着自己干，零碎的都交出去。"},
     {"label":"就这么守着，不大不小", "set":"shop_kept", "effects":{"relation":1,"health":1}, "echo":"店还是那个店。你把营业时间改短了，下午关门去遛弯，熟客都知道你这个点不在。"},
     {"label":"关了，手艺还在", "set":"shop_wound_down", "effects":{"freedom":3,"health":1}, "echo":"关店那天，你把工具一样一样收好。店是关了，可手艺还在身上，谁家东西坏了，还来敲你的门。"} ] },
 { "id":"rt_shop_echo", "min":60, "max":86, "require":"shop_wound_down", "flagAgeMin":{"flag":"shop_wound_down","years":1},
   "text":"店关了之后，你的日子慢下来。偶尔路过那个门脸，里头换了新招牌，你站着看一会儿，就走了。手里没活的时候，你就擦擦那些工具，擦得亮亮的。", "effects":{"wisdom":1,"freedom":1} },
 // —— ⑥ 带孙辈＋帮儿女搭把手（链，用户追加扩充）：全天带/搭把手/出钱三式不分高下；
 // 露面拍装顶班做饭与应急，经手拍在孙辈上学年；孩子在远方另有视频/探亲脸 ——
 { "id":"rt_grand_open", "w":2, "min":55, "max":84, "state":{"kids":"has"}, "stateAll":{"workPhase":"retired"}, "kidAgeMin":25, "kidAgeMax":40, "forbid":"kid_abroad", "set":"grandkid_begun",
   "text":"孩子那边有了小的，忙得脚不沾地。电话打过来，话还没说完，那头孩子就哭了。你和另一半商量：这忙，得帮。",
   "textState":{"spouse":{"single":"孩子那边有了小的，忙得脚不沾地。电话打过来，话还没说完，那头孩子就哭了。你盘算着：这忙，得帮，就是一个人得把时间排开。","none":"孩子那边有了小的，忙得脚不沾地。电话打过来，话还没说完，那头孩子就哭了。你盘算着：这忙，得帮，就是一个人得把时间排开。","divorced":"孩子那边有了小的，忙得脚不沾地。电话打过来，话还没说完，那头孩子就哭了。你盘算着：这忙，得帮，就是一个人得把时间排开。","widowed":"孩子那边有了小的，忙得脚不沾地。电话打过来，话还没说完，那头孩子就哭了。你盘算着：这忙，得帮，就是一个人得把时间排开。"}},
   "choices":[
     {"label":"过去全天带", "set":"grandkid_full", "effects":{"relation":4,"health":-2,"freedom":-3}, "echo":"从那以后，你的日子围着小的转。喂饭、哄睡、推着小车在小区里转。累是累，可小的冲你一笑，就都忘了。"},
     {"label":"搭把手，管接送和晚饭", "set":"grandkid_help", "effects":{"relation":3,"freedom":-1}, "echo":"你管接送和晚饭。孩子下班回来，饭在锅里，小的洗完手等着开饭。一家人坐下来，热热闹闹。"},
     {"label":"出钱请人带，自己常去看看", "set":"grandkid_paid", "effects":{"money":-3,"relation":2}, "echo":"请的人是熟人介绍的，手脚干净。你隔三差五过去，带点吃的，陪小的玩一会儿。"} ] },
 { "id":"rt_grand_show", "min":56, "max":82, "state":{"kids":"has"}, "kidAgeMax":48, "require":"grandkid_begun", "flagAgeMin":{"flag":"grandkid_begun","years":1}, "flagAgeWithin":{"flag":"grandkid_begun","years":6},
   "text":"这天孩子单位有急事，一个电话打过来：能不能过去顶几天，住家里，管小的吃住？你挂了电话就开始收拾东西，收拾得飞快。",
   "choices":[
     {"label":"去，住下顶一阵", "set":"kin_topup", "effects":{"relation":3,"freedom":-2}, "echo":"那几天你把小的作息摸得门儿清。孩子回来那天，看着收拾得整整齐齐的家，半天没说话。"},
     {"label":"白天去帮忙，晚上回自己家", "effects":{"relation":2,"freedom":-1}, "echo":"你白天过去做饭接送，晚上回自己家睡。两头跑是有点累，可心里踏实。"} ] },
 { "id":"rt_grand_decide", "min":58, "max":84, "state":{"kids":"has"}, "kidAgeMin":31, "require":"grandkid_begun", "flagAgeMin":{"flag":"grandkid_begun","years":2},
   "text":"小的背上书包上学了。头一天，你站在校门口看了半天。回来路上忽然发现，上午一下子空出来了，空得有点不习惯。",
   "choices":[
     {"label":"找个事干，去老年大学看看", "set":"grandkid_schooled", "effects":{"freedom":3,"growth":2}, "echo":"你去社区的大学报了个名。头一回去，坐在教室里，心里还有点不踏实，像回到了小时候。"},
     {"label":"还接着帮，放学还得有人接", "set":"grandkid_kept", "effects":{"relation":3,"freedom":-1}, "echo":"接送的活接着干。小的放学冲出来，先找你，书包往你手里一塞，蹦蹦跳跳往家走。"},
     {"label":"歇下来，清静清静", "set":"grandkid_rest", "effects":{"health":2,"freedom":2}, "echo":"你把上午的时间还给自己。睡到自然醒，慢慢吃早饭，站在窗边看楼下来来往往的人。"} ] },
 { "id":"rt_grand_echo", "min":59, "max":86, "require":"grandkid_schooled", "flagAgeMin":{"flag":"grandkid_schooled","years":1},
   "text":"小的上了学，你也有了自己的去处。有一回两边时间撞上，你在电话里跟孩子说：今天我有课。说完自己先笑了。", "effects":{"relation":1,"freedom":1} },
 { "id":"rt_kin_far", "min":55, "max":84, "state":{"kids":"has"}, "stateAll":{"workPhase":"retired"}, "kidAgeMin":25, "require":"kid_abroad",
   "text":"孩子在国外，一年到头见不上一面。小的出生以后，只能在视频里看：今天会翻身了，今天长牙了。你对着屏幕挥手，那头的小手也跟着晃。",
   "choices":[
     {"label":"攒钱，过去住一阵", "set":"kin_far_visit", "effects":{"money":-4,"relation":3}, "echo":"签证、机票，一样一样办。落地那天，小的在视频里见惯了你，见了真人，先是躲，后来就往你怀里钻。"},
     {"label":"就视频里看着，多打打电话", "set":"kin_far_video", "effects":{"relation":2}, "echo":"你把视频的时间固定下来，每周那天那个点。那头的作息你都清楚，比闹钟还准。"} ] },
 { "id":"rt_grand_watch", "min":74, "max":92, "state":{"kids":"has"}, "kidAgeMin":42,
   "text":"孙辈大了，有自己的事要忙，来得不像小时候那么勤了。可逢年过节，屋里一热闹，你坐在当中，看着这一大家子。",
   "choices":[
     {"label":"把老照片整理出来，一人一份", "effects":{"relation":2}, "echo":"你把照片按年份理好，一人一份。小的们翻着看，问这问那，你讲了一下午。"},
     {"label":"就这么看着，挺好", "effects":{"wisdom":1}, "echo":"你不催他们常来。来了就高高兴兴，不来，就在电话里说说话。"} ] },
 // —— ⑦ 摆小摊：无钱门（钱紧才更成立）；进项写进日子，不贴数字 ——
 { "id":"rt_stall_open", "min":55, "max":80, "state":{"workPhase":"retired"}, "flagAgeWithin":{"flag":"retired_begun","years":10}, "set":"stall_begun",
   "text":"退休金不算多，日子得精打细算。你琢磨着摆个小摊，卖点旧物杂货，多少贴补点。摊子支起来的那天，你把东西摆了又摆，摆得整整齐齐。",
   "textForm":{"farm":"地里的菜吃不完，烂在地里可惜。你琢磨着去集上摆个小摊，卖点自家种的。摊子支起来的那天，你把菜码了又码，码得整整齐齐。"},
   "choices":[
     {"label":"支起来，天天出摊", "set":"stall_started", "effects":{"money":2,"freedom":1}, "echo":"头一天没卖多少，可你心里有了个去处。第二天，你起得比谁都早。"},
     {"label":"先试几天再说", "set":"stall_started", "effects":{"money":1}, "echo":"你先支了三天。第三天收摊的时候，有个老主顾问：明天还来不？"} ] },
 { "id":"rt_stall_show", "min":56, "max":82, "state":{"workPhase":"retired"}, "require":"stall_started", "flagAgeMin":{"flag":"stall_started","years":1}, "flagAgeWithin":{"flag":"stall_started","years":6},
   "text":"小摊摆了一阵，有了熟客。东西不贵，胜在顺手。这一摊的进项，你心里有本账：不多，可够买一周的肉，逢年过节还能添个菜。",
   "choices":[
     {"label":"接着摆，挺好", "effects":{"money":2,"relation":1}, "echo":"你把摊子当成个班上。刮风下雨不出，晴天准到。熟客都摸准了你的点。"},
     {"label":"天冷了，先收一阵", "set":"stall_paused", "effects":{"health":1}, "echo":"你把摊子收了，跟熟客打了招呼：开春再来。熟客说，那我们等着。"} ] },
 // —— ⑧ 老年大学升链：p24_051 本批起同落 class_joined（旧拍即链的一张脸）；
 // 露面/经手齐全；剪辑班与直播链互链（minYear 门＋读 stream 锚） ——
 { "id":"rt_class_open", "min":57, "max":82, "state":{"workPhase":"retired"}, "forbid":"class_joined", "flagAgeWithin":{"flag":"retired_begun","years":12}, "set":"class_joined",
   "text":"社区的老年大学招生，课程表贴在公告栏上：摄影、书法、合唱、电脑，什么都有。你站在表前面看了半天，有人路过说：报一个吧，一学期没几个钱，图个热闹。",
   "choices":[
     {"label":"报摄影班", "set":"class_photo", "effects":{"growth":2,"freedom":2}, "echo":"头一回上课，老师讲光圈快门，你听得云里雾里。回来把说明书翻了三遍，第二回，拍出了一张像样的。"},
     {"label":"报书法班", "set":"class_write", "effects":{"growth":2,"wisdom":1}, "echo":"头一回上课，手抖，字写得歪。老师说不急，慢慢来。你把宣纸带回家，晚上在餐桌上练。"},
     {"label":"报合唱团", "set":"class_sing", "effects":{"growth":1,"relation":2}, "echo":"头一回上课，你的嗓子放不开。唱了几回，声音慢慢出来了。回家路上，你还哼着那两句。"} ] },
 { "id":"rt_class_show", "min":58, "max":84, "state":{"workPhase":"retired"}, "require":"class_joined", "flagAgeMin":{"flag":"class_joined","years":1}, "flagAgeWithin":{"flag":"class_joined","years":5},
   "text":"上了一个学期，班里的人都混熟了。谁家有事，群里招呼一声。你缺了一回课，第二天好几个人问你怎么没来。", "effects":{"relation":2,"growth":1} },
 { "id":"rt_class_decide", "min":59, "max":86, "state":{"workPhase":"retired"}, "require":"class_joined", "flagAgeMin":{"flag":"class_joined","years":2}, "flagAgeWithin":{"flag":"class_joined","years":8},
   "text":"新学期又要报名了。老师问你：还接着学吗？班里走了几个，也新来了几个。你的名字，老师还记在老名单上。",
   "choices":[
     {"label":"接着学", "set":"class_kept", "effects":{"growth":2}, "echo":"你把名字又报上了。这一回，你坐的位置靠前了，笔记也记得像样了。"},
     {"label":"帮老师带带新人", "set":"class_helper", "effects":{"relation":2,"growth":1}, "echo":"新人手生，你在旁边指点。老师说你这水平，能当半个助教了。你摆摆手，耳朵有点红。"},
     {"label":"先歇一学期", "set":"class_paused", "effects":{"health":1}, "echo":"你跟老师说了，这学期先不去了。老师说没事，位置给你留着，想来随时来。"} ] },
 { "id":"rt_class_edit", "min":57, "max":80, "minYear":2012, "state":{"workPhase":"retired"}, "require":"stream_begun",
   "text":"直播播了一阵，你总觉得画面剪得糙。社区大学正好开了个剪辑班，年轻人教，学费不高。你背着手去听了一节，回来就把名报了。",
   "choices":[
     {"label":"报，学起来", "set":"class_joined", "effects":{"money":-1,"growth":2}, "echo":"学了剪辑，直播的画面顺眼多了。有回你把一段老视频剪出来，老观众说：这回像样了。"},
     {"label":"算了，就这么播", "effects":{"freedom":1}, "echo":"你想了想，没报。糙就糙点，话说明白就行。"} ] },
 // —— ⑨ 回老单位搭把手：非返聘口径（不改 workPhase，与返聘同账不双开）；
 // 门读活计形态 employee/public；收尾拍明写渐止缘由，不悄悄断线 ——
 { "id":"rt_unit_open", "min":56, "max":80, "state":{"workPhase":"retired"}, "ctx":{"form":["employee","public"]}, "flagAgeWithin":{"flag":"retired_begun","years":8},
   "text":"老单位那边有个老同事打电话：最近忙，有个活没人接得住，你有空来搭把手不？不是返聘，就是临时帮几天，帮完就走。你听着，心里有点痒。",
   "choices":[
     {"label":"去，搭几天", "set":"unit_helper", "effects":{"money":2,"relation":2}, "echo":"你去的那几天，把积压的活理顺了。走的时候年轻人说：您这一手，学不来。"},
     {"label":"不去了，聚会还参加", "set":"unit_visit", "effects":{"relation":1}, "echo":"活你没接，可老同事的聚会你场场到。饭桌上听他们说单位的事，就像还在那儿一样。"} ] },
 { "id":"rt_unit_echo", "min":60, "max":86, "require":"unit_helper", "flagAgeMin":{"flag":"unit_helper","years":1},
   "text":"搭把手的活，后来慢慢就不叫你了——不是不用你，是那摊子事理顺了。可逢年过节，老单位的年轻人还给你打电话，问问当年那些事的门道。你在电话里讲得仔细。", "effects":{"relation":2,"wisdom":1} },
 // —— ⑩ 种菜成规模：院子/阳台两张脸（读住房派生量）；健康无下限；
 // 收成进邻里与饭桌，规模脸另拍 ——
 { "id":"rt_garden_yard", "min":55, "max":88, "state":{"workPhase":"retired"}, "ctx":{"house":"owned"}, "set":"garden_begun",
   "text":"院子里那块地，荒了几年了。你开春把它翻出来，种上应季的菜。头一年没经验，苗出得稀稀拉拉，你也不急，站在地头看，觉得这事能成。",
   "choices":[
     {"label":"扩大点规模，多种些", "set":"garden_grown", "effects":{"health":1,"freedom":1}, "echo":"你把边边角角都用上了。菜长起来的时候，院里绿油油的，看着就舒坦。"},
     {"label":"就种自己吃的", "set":"garden_small", "effects":{"health":1}, "echo":"不多，就那么几畦。自家吃不完，还能给邻居送点。"} ] },
 { "id":"rt_garden_balcony", "min":55, "max":88, "state":{"workPhase":"retired"}, "forbid":"garden_begun", "set":"garden_begun",
   "text":"阳台上排了一溜花盆，种的不是花，是菜：小葱、辣椒、几棵番茄。地方小，你把每一盆都伺候得精细。早上起来第一件事，先去阳台看看。",
   "choices":[
     {"label":"再添几盆，种出规模", "set":"garden_grown", "effects":{"health":1,"freedom":1}, "echo":"阳台快摆不下了，你又在窗台上加了层架子。摘菜的时候，得侧着身子走。"},
     {"label":"就这些，精精神神的", "set":"garden_small", "effects":{"health":1}, "echo":"不多，可顿顿新鲜。炒菜的时候掐一把葱，那个香，买不来。"} ] },
 { "id":"rt_garden_show", "min":56, "max":90, "require":"garden_begun", "flagAgeMin":{"flag":"garden_begun","years":1}, "flagAgeWithin":{"flag":"garden_begun","years":6},
   "text":"菜吃不完，你装了一兜，给邻居送去。邻居过意不去，回你一兜自家的果子。这么一来一去，两家走动得比从前勤了。",
   "choices":[
     {"label":"接着送，远亲不如近邻", "set":"garden_shared", "effects":{"relation":2}, "echo":"你家的菜，半个楼道都吃过。谁家包饺子，都想着给你端一盘。"},
     {"label":"留着自己吃，偶尔送点", "effects":{"relation":1}, "echo":"你把多的腌起来、晒起来。冬天拿出来吃，味道一点不差。"} ] },
 { "id":"rt_garden_big", "min":57, "max":90, "require":"garden_grown", "flagAgeMin":{"flag":"garden_grown","years":1},
   "text":"菜种出了规模，吃不完，送不完。有收菜的贩子找上门，说你这菜成色好，往后他包了。你看着这一片绿，半天没吭声：老了老了，又种出个小营生。", "effects":{"money":2,"relation":1} },
 // —— ⑪ 守老屋修缮：门读住房=自有；本拍是「守的决定＋分年修」（p24_038 是
 // 单项改造，主题相邻不重复）；代价写进修完那年的平年 ——
 { "id":"rt_house_open", "w":2, "min":57, "max":88, "state":{"workPhase":"retired"}, "ctx":{"house":"owned"}, "set":"house_begun",
   "text":"老房子住久了，毛病一样一样出来：水管响、墙皮掉、窗户关不严。你拿个小本子，把要修的地方记下来，一页记了七八条。",
   "choices":[
     {"label":"分年修，一年修一样", "set":"house_fixed", "effects":{"money":-3,"freedom":1}, "echo":"今年先修最要紧的。修好的那几天，你在屋里转来转去，看哪儿都顺眼。"},
     {"label":"先不修，守着就行", "set":"house_kept", "effects":{"wisdom":1}, "echo":"小毛病不碍住人。你把本子收起来，说：房子跟人一样，老了都这样，能住就行。"} ] },
 { "id":"rt_house_show", "w":2, "min":58, "max":90, "require":"house_begun", "flagAgeMin":{"flag":"house_begun","years":1}, "flagAgeWithin":{"flag":"house_begun","years":7},
   "text":"今年轮到修的那样，你找了个靠谱的师傅。师傅干活的时候你就在旁边看，递工具、倒水，顺带把房子别的地方也问了个遍。",
   "choices":[
     {"label":"修，修利索", "set":"house_fixed", "effects":{"money":-2}, "echo":"修完那处，屋里清静了。晚上躺下，水管不响了，你睡了个整觉。"},
     {"label":"小毛病自己鼓捣", "set":"house_kept", "effects":{"growth":1}, "echo":"你买了点材料，自己动手。弄得不算漂亮，可严丝合缝。你退后两步看了看，挺满意。"} ] },
 // —— 76+ 延伸（稿 A 部分）：81 岁以后仍有可调度拍；不预设死亡，结算不庆祝跨 80 ——
 { "id":"rt_old_friends", "min":77, "max":88,
   "text":"八十岁上下了，老朋友打电话来：出来坐坐吧，就咱们几个。你们约在老地方。你出门前，把衣服换了又换，镜子前站了半天。",
   "choices":[
     {"label":"去，赴这个约", "set":"old_friends_met", "effects":{"relation":3}, "echo":"一桌人，头发都白了。聊的还是年轻时候的事，谁说起个老熟人的名字，大家都笑。散的时候互相说：保重，明年还聚。"},
     {"label":"身体不凑手，电话里聊", "set":"old_friends_met", "effects":{"relation":2}, "echo":"你在电话里跟他们聊了半个多小时。挂了电话，心里热乎乎的。人没去，话都说到了。"} ] },
 { "id":"rt_old_neighbors", "min":84, "max":98,
   "text":"能聚的老朋友越来越少了。好在楼下还有几个老邻居，见面点点头，下棋、晒太阳，话不多，可天天见。这天邻居端了碗刚炖的汤过来，敲敲你的门。",
   "choices":[
     {"label":"收下，也回一碗自家的", "set":"old_friends_met", "effects":{"relation":2}, "echo":"你把自家做的吃食回了一碗过去。这种来往不用多话，心里都明白。"},
     {"label":"请人坐下，聊聊", "set":"old_friends_met", "effects":{"relation":2}, "echo":"你们在门口坐了一下午。聊的都是小事：谁家的菜便宜，哪天的天儿好。"} ] },
 { "id":"rt_late_owned", "min":82, "max":98, "ctx":{"house":"owned"},
   "text":"这把年纪了，还住在自己的老房子里。屋里的东西都在老地方，闭着眼睛都摸得着。有人说这房子旧了，你说：旧是旧，可住惯了，哪儿都顺手。", "effects":{"wisdom":1,"relation":1} },
 { "id":"rt_late_kids", "min":82, "max":98, "state":{"kids":"has"},
   "text":"这把年纪了，孩子隔三差五就过来，买菜、打扫、陪你去医院。有回孩子说要接你过去住，你摆摆手：你们忙你们的，我这儿好着呢。孩子拗不过你，只把电话号码贴在冰箱上，字写得老大。", "effects":{"relation":2} },
 { "id":"rt_late_solo", "min":82, "max":98, "stateNot":{"spouse":["partnered"]},
   "text":"这把年纪了，一个人过，日子也过出了章法：几点起、几点吃、几点下楼遛弯，雷打不动。邻居说你这日子过得比闹钟还准。你笑笑，没说话。", "effects":{"health":1,"wisdom":1} },
 // —— 自加拍（每拍同样读真账、落旗、留回响，理由见施工报告） ——
 // 自加 1：把手艺传下去——读主业入行旗（ctx.mainLine 手艺/技术类），落职业面旗
 { "id":"rt_skill_pass", "min":56, "max":82, "state":{"workPhase":"retired"}, "ctx":{"mainLine":["craft_work","factory_work","fab_work","med_work","teach_work","truck_work","med_hosp","nurse_work"]}, "flagAgeWithin":{"flag":"retired_begun","years":10},
   "text":"有个年轻人想跟你学手艺，是熟人托的。年轻人手生，可眼睛里有股认真劲，像你当年。你想了想，把工具箱打开了。",
   "choices":[
     {"label":"教，把这一手传下去", "set":"skill_passed", "effects":{"relation":2,"growth":1}, "echo":"你教得严，年轻人学得苦。可慢慢的，那双手稳了。你看着，点了点头。"},
     {"label":"就指点指点，不正式收", "effects":{"relation":1}, "echo":"你没正式收徒，可年轻人有问题就来问，你都答。这么一来二去，也教出去不少。"} ] },
 // 自加 2：搬到孩子附近——读孩子与住房账，落居住面旗（搬/守两向都不判低）
 { "id":"rt_move_kid", "w":2, "min":58, "max":84, "state":{"kids":"has"}, "stateAll":{"workPhase":"retired"}, "forbid":["kid_abroad"], "flagAgeWithin":{"flag":"retired_begun","years":16},
   "text":"孩子提了几回：搬到他们那边吧，住得近，互相有个照应。你这边，老地方住惯了，挪一回窝不是小事。这事，前前后后商量了好几回。",
   "choices":[
     {"label":"搬，离孩子近点", "set":"moved_near_kid", "effects":{"relation":3,"money":-2}, "echo":"搬过去之后，孩子下班顺路就来看看。头一个月你还认床，后来慢慢也睡踏实了。"},
     {"label":"不搬，守着老地方", "set":"stayed_put", "effects":{"freedom":2}, "echo":"你把话跟孩子说开了：各过各的，真有事打个电话。孩子想了想，也没再劝。"} ] },
 // 自加 3：晨练队（链）——晚年健康面此前只有改造/体检，这个补日常维持＋体检回响
 { "id":"rt_health_club", "min":56, "max":84, "state":{"workPhase":"retired"}, "flagAgeWithin":{"flag":"retired_begun","years":10}, "set":"exercise_begun",
   "text":"公园里有一帮人，天天早上练：打太极的、走圈的、甩胳膊的。你路过几回，被个老哥拉住：来吧，就当遛弯了。你第二天，还真去了。",
   "choices":[
     {"label":"跟着练", "effects":{"health":2,"relation":1}, "echo":"练了一阵，身上松快了。队里的人你都认识了，谁哪天没来，大家还要问一声。"},
     {"label":"先看看，不一定天天来", "effects":{"health":1}, "echo":"你没把话说满，可去的日子越来越多。慢慢地，不去反而不习惯了。"} ] },
 { "id":"rt_health_echo", "min":60, "max":90, "require":"exercise_begun", "flagAgeMin":{"flag":"exercise_begun","years":2},
   "text":"体检报告出来，有几项数字稳住了，没往上走。大夫说：这个岁数，能稳住就是好。你把报告收好，回去的路上，脚步比来的时候轻。",
   "choices":[
     {"label":"接着练", "set":"exercise_kept", "effects":{"health":1}, "echo":"你把报告给队里的老哥看，他说：练吧，咱这个岁数，图的就是个稳当。"},
     {"label":"歇一阵再说", "effects":{}, "echo":"你歇了一阵，又慢慢捡起来了。这事断断续续，可总没丢下。"} ] },
 // 自加 4：老宠物——读猫/狗状态与真实年龄（petMin），宠物线晚年回响
 { "id":"rt_pet_old_cat", "min":60, "max":92, "state":{"cat":"home"}, "petMin":8, "set":"pet_old_friend",
   "text":"猫上了年纪，不爱动了，整天趴在有太阳的那块地方。你坐着看书，它就趴在你脚边。你们两个，谁也不吵谁，一下午就这么过去了。", "effects":{"relation":1,"health":1} },
 { "id":"rt_pet_old_dog", "min":60, "max":92, "state":{"dog":"home"}, "petMin":8, "set":"pet_old_friend",
   "text":"狗上了年纪，走不动远路了。遛它的时候，你走得慢，它也走得慢，一人一狗，在楼下转一小圈就回来。邻居说：你俩这步子，倒是配。", "effects":{"relation":1,"health":1} },
]);
