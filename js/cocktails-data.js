const COCKTAILS = [
  // === GIN ===
  {id:"martini",img:"https://www.thecocktaildb.com/images/media/drink/6ck9yi1589574317.jpg/preview",name:"Dry Martini",zh:"干马天尼",base:"gin",ingredients:["60ml 金酒","10ml 干味美思","橄榄或柠檬皮"],method:"stir",glass:"马天尼杯",flavor:["干","烈","经典"],strength:"strong",desc:"鸡尾酒之王。丘吉尔说：只需看一眼味美思的瓶子就够了。",color:"#d4e4bc"},
  {id:"negroni",img:"https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg/preview",name:"Negroni",zh:"尼格罗尼",base:"gin",ingredients:["30ml 金酒","30ml 金巴利","30ml 甜味美思","橙片"],method:"stir",glass:"古典杯",flavor:["苦","草本","aperitif"],strength:"strong",desc:"等比三合一的完美平衡，意大利 aperitivo 文化的灵魂。",color:"#c0392b"},
  {id:"gin-tonic",img:"https://www.thecocktaildb.com/images/media/drink/k0508k1668422436.jpg/preview",name:"Gin & Tonic",zh:"金汤力",base:"gin",ingredients:["50ml 金酒","150ml 汤力水","青柠角"],method:"build",glass:"高球杯",flavor:["清爽","微苦","易饮"],strength:"medium",desc:"最简单也最考究的长饮，杜松子与奎宁水的经典碰撞。",color:"#dfe6e9"},
  {id:"gimlet",img:"https://www.thecocktaildb.com/images/media/drink/3xgldt1513707271.jpg/preview",name:"Gimlet",zh:"螺丝锥子",base:"gin",ingredients:["60ml 金酒","15ml 青柠汁","15ml 糖浆"],method:"shake",glass:"鸡尾酒杯",flavor:["酸","清爽","简洁"],strength:"strong",desc:"雷蒙德·钱德勒笔下的经典：「真正的螺丝锥子是一半金酒一半Rose's」。",color:"#a8e6cf"},
  {id:"tom-collins",img:"https://www.thecocktaildb.com/images/media/drink/7cll921606854636.jpg/preview",name:"Tom Collins",zh:"汤姆柯林斯",base:"gin",ingredients:["45ml 金酒","30ml 柠檬汁","15ml 糖浆","苏打水"],method:"build",glass:"柯林斯杯",flavor:["清爽","酸甜","长饮"],strength:"light",desc:"维多利亚时代的经典长饮，夏日午后的完美选择。",color:"#ffeaa7"},
  {id:"aviation",img:"https://www.thecocktaildb.com/images/media/drink/trbplb1606855233.jpg/preview",name:"Aviation",zh:"飞行",base:"gin",ingredients:["45ml 金酒","15ml 黑樱桃利口酒","7.5ml 紫罗兰利口酒","15ml 柠檬汁"],method:"shake",glass:"鸡尾酒杯",flavor:["花香","优雅","酸甜"],strength:"medium",desc:"淡紫色的天空，来自禁酒令前的黄金时代。",color:"#a29bfe"},
  {id:"last-word",img:"https://www.thecocktaildb.com/images/media/drink/91oule1513702624.jpg/preview",name:"Last Word",zh:"最后一言",base:"gin",ingredients:["22.5ml 金酒","22.5ml 绿色查特酒","22.5ml 黑樱桃利口酒","22.5ml 青柠汁"],method:"shake",glass:"鸡尾酒杯",flavor:["草本","复杂","平衡"],strength:"strong",desc:"失传半世纪后被西雅图酒保复活，四等份的完美对话。",color:"#55efc4"},
  {id:"french75",img:"https://www.thecocktaildb.com/images/media/drink/hrxfbl1606773109.jpg/preview",name:"French 75",zh:"法式75",base:"gin",ingredients:["30ml 金酒","15ml 柠檬汁","15ml 糖浆","60ml 香槟"],method:"shake",glass:"香槟杯",flavor:["气泡","优雅","庆祝"],strength:"medium",desc:"以法国75毫米野战炮命名，后劲如炮弹般猛烈。",color:"#ffeaa7"},

  // === VODKA ===
  {id:"moscow-mule",img:"https://www.thecocktaildb.com/images/media/drink/3pylqc1504370988.jpg/preview",name:"Moscow Mule",zh:"莫斯科骡子",base:"vodka",ingredients:["45ml 伏特加","15ml 青柠汁","120ml 姜汁啤酒","青柠角"],method:"build",glass:"铜杯",flavor:["辛辣","清爽","姜味"],strength:"light",desc:"铜杯里的清凉一击。1940年代三个商人偶然的杰作。",color:"#fdcb6e"},
  {id:"cosmopolitan",img:"https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg/preview",name:"Cosmopolitan",zh:"大都会",base:"vodka",ingredients:["40ml 柑橘伏特加","15ml 君度","15ml 青柠汁","30ml 蔓越莓汁"],method:"shake",glass:"马天尼杯",flavor:["果味","时尚","酸甜"],strength:"medium",desc:"粉红色的都市传说，因《欲望都市》风靡全球。",color:"#fd79a8"},
  {id:"espresso-martini",img:"https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg/preview",name:"Espresso Martini",zh:"浓缩咖啡马天尼",base:"vodka",ingredients:["45ml 伏特加","30ml 咖啡利口酒","30ml 浓缩咖啡"],method:"shake",glass:"马天尼杯",flavor:["咖啡","提神","甜苦"],strength:"strong",desc:"Dick Bradsell 的发明：「给我一杯能叫醒我然后搞醉我的东西」。",color:"#2d3436"},
  {id:"bloody-mary",img:"https://www.thecocktaildb.com/images/media/drink/t6caa21582485702.jpg/preview",name:"Bloody Mary",zh:"血腥玛丽",base:"vodka",ingredients:["45ml 伏特加","90ml 番茄汁","15ml 柠檬汁","辣酱","伍斯特酱","盐与胡椒","芹菜茎"],method:"build",glass:"高球杯",flavor:["咸鲜","辣","brunch"],strength:"medium",desc:"最佳宿醉解药，也是唯一被允许在早午餐喝的鸡尾酒。",color:"#e17055"},
  {id:"white-russian",img:"https://www.thecocktaildb.com/images/media/drink/vsrupw1472405732.jpg/preview",name:"White Russian",zh:"白俄罗斯",base:"vodka",ingredients:["50ml 伏特加","20ml 咖啡利口酒","30ml 鲜奶油"],method:"build",glass:"古典杯",flavor:["奶油","甜","顺滑"],strength:"medium",desc:"The Dude 在《谋杀绿脚趾》里的标配。",color:"#dfe6e9"},

  // === WHISKEY ===
  {id:"old-fashioned",img:"https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg/preview",name:"Old Fashioned",zh:"古典鸡尾酒",base:"whiskey",ingredients:["60ml 波本威士忌","1块方糖","2 dash 安格斯苦精","橙皮"],method:"stir",glass:"古典杯",flavor:["经典","醇厚","微甜"],strength:"strong",desc:"鸡尾酒的原型。如果你只学一杯，就学这杯。",color:"#e17055"},
  {id:"manhattan",img:"https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg/preview",name:"Manhattan",zh:"曼哈顿",base:"whiskey",ingredients:["60ml 黑麦威士忌","30ml 甜味美思","2 dash 安格斯苦精","樱桃"],method:"stir",glass:"鸡尾酒杯",flavor:["优雅","醇厚","经典"],strength:"strong",desc:"纽约的液体代名词，从1870年代优雅至今。",color:"#b33939"},
  {id:"whiskey-sour",img:"https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg/preview",name:"Whiskey Sour",zh:"威士忌酸",base:"whiskey",ingredients:["60ml 波本威士忌","30ml 柠檬汁","15ml 糖浆","蛋白（可选）"],method:"shake",glass:"古典杯",flavor:["酸甜","顺滑","经典"],strength:"medium",desc:"加蛋白摇出绵密泡沫，酸甜之间的黄金比例。",color:"#ffeaa7"},
  {id:"mint-julep",img:"https://www.thecocktaildb.com/images/media/drink/squyyq1439907312.jpg/preview",name:"Mint Julep",zh:"薄荷朱利普",base:"whiskey",ingredients:["60ml 波本威士忌","8片薄荷叶","15ml 糖浆","碎冰"],method:"build",glass:"朱利普杯",flavor:["薄荷","清凉","南方"],strength:"strong",desc:"肯塔基德比的官方饮品，碎冰与薄荷的夏日仪式。",color:"#00b894"},
  {id:"penicillin",img:"https://www.thecocktaildb.com/images/media/drink/hc9b1a1521853096.jpg/preview",name:"Penicillin",zh:"青霉素",base:"whiskey",ingredients:["60ml 苏格兰威士忌","22.5ml 柠檬汁","22.5ml 蜂蜜姜糖浆","7.5ml 艾雷岛威士忌"],method:"shake",glass:"古典杯",flavor:["烟熏","姜辣","蜂蜜"],strength:"strong",desc:"Sam Ross 2005年的现代经典，治愈一切的一杯。",color:"#fdcb6e"},
  {id:"sazerac",img:"https://www.thecocktaildb.com/images/media/drink/vvpxwy1439907208.jpg/preview",name:"Sazerac",zh:"赛泽瑞克",base:"whiskey",ingredients:["60ml 黑麦威士忌","1块方糖","3 dash 佩肖苦精","苦艾酒洗杯","柠檬皮"],method:"stir",glass:"古典杯",flavor:["辛辣","茴香","新奥尔良"],strength:"strong",desc:"新奥尔良的官方鸡尾酒，苦艾酒洗杯带来的幽灵香气。",color:"#e17055"},
  {id:"irish-coffee",img:"https://www.thecocktaildb.com/images/media/drink/sywsqw1439906999.jpg/preview",name:"Irish Coffee",zh:"爱尔兰咖啡",base:"whiskey",ingredients:["40ml 爱尔兰威士忌","80ml 热咖啡","15ml 红糖浆","鲜奶油浮层"],method:"build",glass:"爱尔兰咖啡杯",flavor:["温暖","咖啡","奶油"],strength:"medium",desc:"Shannon 机场的暖心发明，穿过奶油层喝到热咖啡的幸福感。",color:"#6F4E37"},

  // === RUM ===
  {id:"mojito",img:"https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg/preview",name:"Mojito",zh:"莫吉托",base:"rum",ingredients:["45ml 白朗姆","30ml 青柠汁","20ml 糖浆","6片薄荷","苏打水"],method:"build",glass:"高球杯",flavor:["清爽","薄荷","夏日"],strength:"light",desc:"海明威在哈瓦那的最爱。薄荷、青柠、朗姆的加勒比三重奏。",color:"#00b894"},
  {id:"daiquiri",img:"https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg/preview",name:"Daiquiri",zh:"代基里",base:"rum",ingredients:["60ml 白朗姆","30ml 青柠汁","15ml 糖浆"],method:"shake",glass:"鸡尾酒杯",flavor:["酸甜","清爽","纯粹"],strength:"medium",desc:"三种原料的极简主义，也是检验酒保功力的试金石。",color:"#dfe6e9"},
  {id:"pina-colada",img:"https://www.thecocktaildb.com/images/media/drink/upgsue1668419912.jpg/preview",name:"Piña Colada",zh:"椰林飘香",base:"rum",ingredients:["45ml 白朗姆","45ml 椰奶","45ml 菠萝汁","菠萝角"],method:"blend",glass:"飓风杯",flavor:["热带","椰子","甜"],strength:"light",desc:"波多黎各国饮，闭上眼就是加勒比海的白沙滩。",color:"#ffeaa7"},
  {id:"mai-tai",img:"https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg/preview",name:"Mai Tai",zh:"迈泰",base:"rum",ingredients:["30ml 白朗姆","30ml 深色朗姆","15ml 橙味利口酒","15ml 杏仁糖浆","30ml 青柠汁"],method:"shake",glass:"古典杯",flavor:["热带","复杂","tiki"],strength:"strong",desc:"Trader Vic 的杰作。Mai Tai 在塔希提语中意为「最好的」。",color:"#e17055"},
  {id:"dark-n-stormy",img:"https://www.thecocktaildb.com/images/media/drink/t1tn0s1504374905.jpg/preview",name:"Dark 'n Stormy",zh:"黑色风暴",base:"rum",ingredients:["60ml 深色朗姆","100ml 姜汁啤酒","青柠角"],method:"build",glass:"高球杯",flavor:["辛辣","深沉","姜味"],strength:"medium",desc:"百慕大的国饮，深色朗姆漂浮在姜汁啤酒上如暴风云层。",color:"#636e72"},
  {id:"cuba-libre",img:"https://www.thecocktaildb.com/images/media/drink/wmkbfj1606853905.jpg/preview",name:"Cuba Libre",zh:"自由古巴",base:"rum",ingredients:["50ml 白朗姆","120ml 可乐","10ml 青柠汁","青柠角"],method:"build",glass:"高球杯",flavor:["甜","可乐","易饮"],strength:"light",desc:"「为了自由古巴干杯！」——美西战争后的庆祝饮品。",color:"#2d3436"},

  // === TEQUILA ===
  {id:"margarita",img:"https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg/preview",name:"Margarita",zh:"玛格丽特",base:"tequila",ingredients:["50ml 龙舌兰","20ml 君度","30ml 青柠汁","盐边"],method:"shake",glass:"玛格丽特杯",flavor:["酸","盐","墨西哥"],strength:"medium",desc:"全球最受欢迎的龙舌兰鸡尾酒，盐边是仪式的一部分。",color:"#a8e6cf"},
  {id:"paloma",img:"https://www.thecocktaildb.com/images/media/drink/samm5j1513706393.jpg/preview",name:"Paloma",zh:"帕洛玛",base:"tequila",ingredients:["50ml 龙舌兰","15ml 青柠汁","葡萄柚苏打水","盐边"],method:"build",glass:"高球杯",flavor:["葡萄柚","清爽","墨西哥"],strength:"light",desc:"在墨西哥比玛格丽特更受欢迎的国民饮品。",color:"#fab1a0"},
  {id:"tequila-sunrise",img:"https://www.thecocktaildb.com/images/media/drink/quqyqp1480879103.jpg/preview",name:"Tequila Sunrise",zh:"龙舌兰日出",base:"tequila",ingredients:["45ml 龙舌兰","90ml 橙汁","15ml 红石榴糖浆"],method:"build",glass:"高球杯",flavor:["果味","甜","渐变"],strength:"light",desc:"红石榴沉入橙汁底部，如清晨的日出渐变。",color:"#e17055"},

  // === BRANDY ===
  {id:"sidecar",img:"https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg/preview",name:"Sidecar",zh:"边车",base:"brandy",ingredients:["50ml 干邑白兰地","20ml 君度","20ml 柠檬汁"],method:"shake",glass:"鸡尾酒杯",flavor:["优雅","果香","经典"],strength:"strong",desc:"一战后巴黎丽兹酒店的传奇，白兰地世界的 Whiskey Sour。",color:"#fdcb6e"},

  // === APERITIF ===
  {id:"aperol-spritz",img:"https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg/preview",name:"Aperol Spritz",zh:"阿佩罗雪碧兹",base:"aperitif",ingredients:["90ml 普罗赛克","60ml Aperol","30ml 苏打水","橙片"],method:"build",glass:"葡萄酒杯",flavor:["微苦","气泡","aperitif"],strength:"light",desc:"意大利夏日黄昏的标准配置，3-2-1 比例简单到不会出错。",color:"#e17055"},
  {id:"bellini",img:"https://www.thecocktaildb.com/images/media/drink/eaag491504367543.jpg/preview",name:"Bellini",zh:"贝里尼",base:"aperitif",ingredients:["100ml 普罗赛克","50ml 白桃果泥"],method:"build",glass:"香槟杯",flavor:["桃子","气泡","优雅"],strength:"light",desc:"威尼斯 Harry's Bar 的发明，以画家贝里尼命名。",color:"#fab1a0"},
  {id:"kir-royale",img:"https://www.thecocktaildb.com/images/media/drink/yt9i7n1504370388.jpg/preview",name:"Kir Royale",zh:"皇家基尔",base:"aperitif",ingredients:["120ml 香槟","15ml 黑加仑利口酒"],method:"build",glass:"香槟杯",flavor:["果味","气泡","庆祝"],strength:"light",desc:"勃艮第市长 Canon Kir 的日常待客之道。",color:"#6c5ce7"},

  // === OTHER CLASSICS ===
  {id:"amaretto-sour",img:"https://www.thecocktaildb.com/images/media/drink/xnzc541493070211.jpg/preview",name:"Amaretto Sour",zh:"杏仁酸",base:"other",ingredients:["45ml 杏仁利口酒","30ml 柠檬汁","15ml 糖浆","蛋白"],method:"shake",glass:"古典杯",flavor:["杏仁","酸甜","顺滑"],strength:"light",desc:"Jeffrey Morgenthaler 的改良版让这杯酒从被鄙视变成现代经典。",color:"#e17055"},
  {id:"long-island",img:"https://www.thecocktaildb.com/images/media/drink/wx7hsg1504370510.jpg/preview",name:"Long Island Iced Tea",zh:"长岛冰茶",base:"other",ingredients:["15ml 伏特加","15ml 金酒","15ml 白朗姆","15ml 龙舌兰","15ml 君度","25ml 柠檬汁","可乐"],method:"build",glass:"高球杯",flavor:["烈","伪装","杀手"],strength:"strong",desc:"看起来像冰茶，喝起来像冰茶，但五种基酒的后劲能击倒一头牛。",color:"#fdcb6e"},
  {id:"boulevardier",img:"https://www.thecocktaildb.com/images/media/drink/km84qi1513705868.jpg/preview",name:"Boulevardier",zh:"花花公子",base:"whiskey",ingredients:["30ml 波本威士忌","30ml 金巴利","30ml 甜味美思"],method:"stir",glass:"古典杯",flavor:["苦甜","醇厚","冬日"],strength:"strong",desc:"用波本替代金酒的 Negroni 变体，更温暖更深沉。",color:"#b33939"},
  {id:"paper-plane",name:"Paper Plane",zh:"纸飞机",base:"whiskey",ingredients:["22.5ml 波本","22.5ml Aperol","22.5ml Amaro Nonino","22.5ml 柠檬汁"],method:"shake",glass:"鸡尾酒杯",flavor:["苦甜","平衡","现代"],strength:"medium",desc:"Sam Ross 的又一杰作，四等份的现代完美。",color:"#fdcb6e"},
  {id:"corpse-reviver-2",img:"https://www.thecocktaildb.com/images/media/drink/gifgao1513704334.jpg/preview",name:"Corpse Reviver No.2",zh:"亡者复苏2号",base:"gin",ingredients:["22.5ml 金酒","22.5ml 君度","22.5ml 干味美思","22.5ml 柠檬汁","1 dash 苦艾酒"],method:"shake",glass:"鸡尾酒杯",flavor:["复杂","提神","经典"],strength:"medium",desc:"「连喝四杯就会变成亡者」——Savoy 鸡尾酒手册如是说。",color:"#dfe6e9"},
  {id:"jungle-bird",name:"Jungle Bird",zh:"丛林鸟",base:"rum",ingredients:["45ml 深色朗姆","22.5ml 金巴利","45ml 菠萝汁","15ml 青柠汁","15ml 糖浆"],method:"shake",glass:"古典杯",flavor:["热带","苦甜","tiki"],strength:"medium",desc:"1978年吉隆坡的 tiki 发明，苦味金巴利遇上热带风情。",color:"#e17055"},
  {id:"clover-club",img:"https://www.thecocktaildb.com/images/media/drink/t0aja61504348715.jpg/preview",name:"Clover Club",zh:"三叶草俱乐部",base:"gin",ingredients:["45ml 金酒","15ml 覆盆子糖浆","15ml 柠檬汁","蛋白"],method:"shake",glass:"鸡尾酒杯",flavor:["果味","绵密","优雅"],strength:"medium",desc:"费城绅士俱乐部的禁酒令前经典，粉色泡沫令人倾心。",color:"#fd79a8"},
  {id:"tommy-margarita",name:"Tommy's Margarita",zh:"汤米玛格丽特",base:"tequila",ingredients:["60ml 龙舌兰","30ml 青柠汁","15ml 龙舌兰糖浆"],method:"shake",glass:"古典杯",flavor:["纯粹","agave","酸甜"],strength:"medium",desc:"旧金山 Tommy's Mexican 的简化版，用龙舌兰糖浆突出 agave 本味。",color:"#a8e6cf"},
  {id:"bee-knees",name:"Bee's Knees",zh:"蜜蜂膝盖",base:"gin",ingredients:["52.5ml 金酒","22.5ml 柠檬汁","22.5ml 蜂蜜糖浆"],method:"shake",glass:"鸡尾酒杯",flavor:["蜂蜜","花香","禁酒令"],strength:"medium",desc:"禁酒令时期用蜂蜜掩盖私酒味道的智慧，名字是20年代俚语「最好的」。",color:"#fdcb6e"},
  {id:"naked-famous",name:"Naked and Famous",zh:"赤裸与名望",base:"tequila",ingredients:["22.5ml 梅斯卡尔","22.5ml Aperol","22.5ml 接骨木花利口酒","22.5ml 青柠汁"],method:"shake",glass:"鸡尾酒杯",flavor:["烟熏","花香","现代"],strength:"medium",desc:"Last Word 的梅斯卡尔变体，烟熏与花香的大胆碰撞。",color:"#ffeaa7"},
  {id:"hemingway-daiquiri",img:"https://www.thecocktaildb.com/images/media/drink/jfcvps1504369888.jpg/preview",name:"Hemingway Daiquiri",zh:"海明威代基里",base:"rum",ingredients:["60ml 白朗姆","15ml 黑樱桃利口酒","37.5ml 葡萄柚汁","15ml 青柠汁"],method:"shake",glass:"鸡尾酒杯",flavor:["干","柑橘","文学"],strength:"medium",desc:"海明威要求「双份朗姆不加糖」，这是酒保的优雅妥协。",color:"#fab1a0"},
  {id:"vieux-carre",name:"Vieux Carré",zh:"旧城区",base:"whiskey",ingredients:["30ml 黑麦威士忌","30ml 干邑","30ml 甜味美思","1 barspoon 本笃利口酒","2 dash 苦精"],method:"stir",glass:"古典杯",flavor:["复杂","醇厚","新奥尔良"],strength:"strong",desc:"新奥尔良法语区的液体肖像，层次丰富如爵士即兴。",color:"#b33939"},
  {id:"vesper",img:"https://www.thecocktaildb.com/images/media/drink/mtdxpa1504374514.jpg/preview",name:"Vesper",zh:"薇丝朋",base:"gin",ingredients:["60ml 金酒","15ml 伏特加","7.5ml 利莱开胃酒","柠檬皮"],method:"shake",glass:"马天尼杯",flavor:["烈","优雅","007"],strength:"strong",desc:"邦德的发明：「摇的，不要搅的」。以他爱过的女人命名。",color:"#dfe6e9"},
];

const BASE_LABELS = {
  gin: "金酒 Gin",
  vodka: "伏特加 Vodka",
  whiskey: "威士忌 Whiskey",
  rum: "朗姆 Rum",
  tequila: "龙舌兰 Tequila",
  brandy: "白兰地 Brandy",
  aperitif: "开胃酒 Aperitif",
  other: "其他 Other",
};

const BASE_EMOJI = {
  gin: "🫒", vodka: "🧊", whiskey: "🥃", rum: "🌴",
  tequila: "🌵", brandy: "🍷", aperitif: "🥂", other: "🍹",
};
