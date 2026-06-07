export interface Question {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: "簡單" | "中等" | "難";
}

export const TRIVIA_QUESTIONS: Question[] = [
  // 台灣常識 (15 questions)
  { id: "tw_1", question: "台灣最高的高山是哪一座山？", answer: "玉山", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_2", question: "台灣最南端的燈塔是哪一座？", answer: "鵝鑾鼻燈塔", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_3", question: "台灣的第一大天然湖泊是哪一個？", answer: "日月潭", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_4", question: "台灣哪一個縣市以「太陽餅」為著名地方特產？", answer: "台中市", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_5", question: "台南古蹟「安平古堡」最早是由哪一個國家的人建造的？", answer: "荷蘭", category: "台灣常識", difficulty: "中等" },
  { id: "tw_6", question: "台灣島的地理形狀常被形容像哪一種水果或植物？", answer: "番薯", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_7", question: "台北101大樓曾經是世界第一高樓，其高度約為多少公尺？", answer: "508", category: "台灣常識", difficulty: "難" },
  { id: "tw_8", question: "台灣哪一個外島以花崗岩戰地景觀與高粱酒聞名？", answer: "金門", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_9", question: "著名的野柳「女王頭」是屬於哪一種地質景觀？", answer: "蕈狀石", category: "台灣常識", difficulty: "中等" },
  { id: "tw_10", question: "台灣哪一條河流流經的流域面積最廣，且是台灣最長的河流？", answer: "濁水溪", category: "台灣常識", difficulty: "中等" },
  { id: "tw_11", question: "台灣現行的行政區劃中，共有幾個直轄市（雙北、桃園、台中、台南、高雄）？", answer: "6", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_12", question: "素有「櫻花鉤吻鮭的故鄉」之稱，且是台灣著名高山溪流國家公園的是哪一個？", answer: "雪霸國家公園", category: "台灣常識", difficulty: "中等" },
  { id: "tw_13", question: "台灣每年農曆正月十五元宵節時，哪裡會舉辦著名的平溪活動？", answer: "放天燈", category: "台灣常識", difficulty: "簡單" },
  { id: "tw_14", question: "台灣第一個設立的國家公園是哪一個？", answer: "墾丁國家公園", category: "台灣常識", difficulty: "難" },
  { id: "tw_15", question: "著名的原住民慶典「豐年祭」主要是哪一個族群的傳統節日？", answer: "阿美族", category: "台灣常識", difficulty: "中等" },

  // 流行文化 (15 questions)
  { id: "pop_1", question: "台灣第一位獲得金馬獎最佳導演，並曾獲奧斯卡最佳導演的是誰？", answer: "李安", category: "流行文化", difficulty: "簡單" },
  { id: "pop_2", question: "被譽為「華語流行天王」，唱過《雙截棍》、《告白氣球》的男歌手是誰？", answer: "周杰倫", category: "流行文化", difficulty: "簡單" },
  { id: "pop_3", question: "台灣天團「五月天」的主唱是誰？", answer: "阿信", category: "流行文化", difficulty: "簡單" },
  { id: "pop_4", question: "女子流行組合「S.H.E」中，「S」代表哪一位團員？", answer: "Selina", category: "流行文化", difficulty: "中等" },
  { id: "pop_5", question: "2019年風靡亞洲、由柯佳嬿與許光漢主演的科幻愛情台劇是哪一部？", answer: "想見你", category: "流行文化", difficulty: "中等" },
  { id: "pop_6", question: "金曲歌后、被譽為「妹神」，代表作有《姐妹》、《聽海》的女歌手是誰？", answer: "張惠妹", category: "流行文化", difficulty: "簡單" },
  { id: "pop_7", question: "華語流行天后蔡依林，在2019年獲得金曲獎年度歌曲獎的代表作品是哪一首？", answer: "玫瑰少年", category: "流行文化", difficulty: "中等" },
  { id: "pop_8", question: "台灣知名動畫長片，主角是個會抓鬼的阿嬤，這部片名叫做？", answer: "魔法阿媽", category: "流行文化", difficulty: "簡單" },
  { id: "pop_9", question: "金馬獎的創辦年份是西元幾年？（提示：196X年）", answer: "1962", category: "流行文化", difficulty: "難" },
  { id: "pop_10", question: "台灣YouTube訂閱數最快突破百萬的虛擬網紅或個人創作者之一，以開箱與日常聞名，是誰？", answer: "Joeman", category: "流行文化", difficulty: "中等" },
  { id: "pop_11", question: "以一首《愛你》重新翻紅，甜心教主之稱的女歌手是誰？", answer: "王心凌", category: "流行文化", difficulty: "簡單" },
  { id: "pop_12", question: "第58屆金鐘獎戲劇節目男主角獎，由《八尺門的辯護人》展現精湛演技的是誰？", answer: "李銘順", category: "流行文化", difficulty: "難" },
  { id: "pop_13", question: "在華語影壇具有極高影響力，以《花樣年華》、《重慶森林》聞名的香港導演是誰？", answer: "王家衛", category: "流行文化", difficulty: "中等" },
  { id: "pop_14", question: "樂團「告五人」的知名代表作，歌詞包含「我會披星戴月地想你」，歌名是？", answer: "披星戴月", category: "流行文化", difficulty: "簡單" },
  { id: "pop_15", question: "台劇《俗女養成記》主角「陳嘉玲」是由哪位獲得金馬最佳女主角的演員飾演？", answer: "謝盈萱", category: "流行文化", difficulty: "中等" },

  // 運動 (12 questions)
  { id: "sport_1", question: "台灣女子羽球傳球人物，曾位居世界女單排名第一（球后）的是哪位選手？", answer: "戴資穎", category: "運動", difficulty: "簡單" },
  { id: "sport_2", question: "在東京奧運奪得男子羽球雙打金牌，且在巴黎奧運成功衛冕的台灣組合名字簡稱是什麼？", answer: "麟洋配", category: "運動", difficulty: "簡單" },
  { id: "sport_3", question: "有「不死鳥」之稱，曾效力美國職棒大聯盟洛杉磯道奇隊的台灣左投是誰？", answer: "郭泓志", category: "運動", difficulty: "中等" },
  { id: "sport_4", question: "台灣女子舉重傳奇，多次在奧運奪金並創下世界紀錄的是誰？", answer: "郭婞淳", category: "運動", difficulty: "簡單" },
  { id: "sport_5", question: "美國職業籃球聯賽（NBA）中，創下「林來瘋（Linsanity）」熱潮的台裔球員是誰？", answer: "林書豪", category: "運動", difficulty: "簡單" },
  { id: "sport_6", question: "台灣職棒知名地標、台北最新啟用的大型室內多功能體育館常被稱為什麼？", answer: "台北大巨蛋", category: "運動", difficulty: "簡單" },
  { id: "sport_7", question: "第一位在世界桌球職業大聯盟（WTT）嶄露頭角、綽號「小林同學」的台灣小將是誰？", answer: "林昀儒", category: "運動", difficulty: "中等" },
  { id: "sport_8", question: "跆拳道名將，曾在2004年雅典奧運為台灣奪下歷史上第一面奧運金牌的是誰？", answer: "陳詩欣", category: "運動", difficulty: "難" },
  { id: "sport_9", question: "世界最古老的現代馬拉松賽事，也是跑者殿堂的「六大馬」之一，在波士頓舉辦的叫什麼？", answer: "波士頓馬拉松", category: "運動", difficulty: "中等" },
  { id: "sport_10", question: "桌球教父、代表台灣出戰六屆奧運的男子桌球傳奇老將是誰？", answer: "莊智淵", category: "運動", difficulty: "中等" },
  { id: "sport_11", question: "網球世界四大滿貫賽事中，唯一在草地上進行的是哪一個公開賽？", answer: "溫布頓網球錦標賽", category: "運動", difficulty: "中等" },
  { id: "sport_12", question: "極限馬拉松運動員，曾獲得磁北極極限馬拉松冠軍、撒哈拉沙漠挑戰賽冠軍的是誰？", answer: "陳彥博", category: "運動", difficulty: "難" },

  // 食物 (12 questions)
  { id: "food_1", question: "風靡全球、發源於台灣，混合了奶茶與黑色粉圓的代表性飲料是什麼？", answer: "珍珠奶茶", category: "食物", difficulty: "簡單" },
  { id: "food_2", question: "台灣夜市小吃中，將雞肉裹粉油炸後撒上椒鹽與九層塔的美食是什麼？", answer: "鹽酥雞", category: "食物", difficulty: "簡單" },
  { id: "food_3", question: "台灣哪一種冰品最深受國際觀光客喜愛，甚至曾被CNN評選為世界頂級甜品？", answer: "芒果冰", category: "食物", difficulty: "簡單" },
  { id: "food_4", question: "鼎泰豐最出名、以「皮薄、餡多、湯汁鮮美」聞名世界的點心是什麼？", answer: "小籠包", category: "食物", difficulty: "簡單" },
  { id: "food_5", question: "台灣傳統早餐中，通常與豆漿搭配食用、油炸雙股形狀的麵食是什麼？", answer: "油條", category: "食物", difficulty: "簡單" },
  { id: "food_6", question: "傳統小吃「大腸包小腸」中，包裹在外面、代替麵包的是什麼食物？", answer: "糯米腸", category: "食物", difficulty: "簡單" },
  { id: "food_7", question: "台灣夜市中以豆腐發酵製作，聞起來香氣獨特、吃起來香酥的名產是什麼？", answer: "臭豆腐", category: "食物", difficulty: "簡單" },
  { id: "food_8", question: "被稱為「平民燕窩」，由台灣特有愛玉子搓洗出果膠凝固造成的黃色涼凍是什麼？", answer: "愛玉", category: "食物", difficulty: "中等" },
  { id: "food_9", question: "彰化最著名的傳統小吃，外皮用番薯粉製成，裡面包豬肉，淋上特製甜醬的是什麼？", answer: "肉圓", category: "食物", difficulty: "中等" },
  { id: "food_10", question: "台灣伴手禮之王，外表酥脆、內餡主要由鳳梨或冬瓜製成的甜點是什麼？", answer: "鳳梨酥", category: "食物", difficulty: "簡單" },
  { id: "food_11", question: "四川麻辣鍋常見的配料「鴨血」，是由哪一種家禽的血製成？", answer: "鴨", category: "食物", difficulty: "簡單" },
  { id: "food_12", question: "日本拉麵中，常見的呈半熟狀態、煮過後浸泡醬汁的蛋稱為什麼？", answer: "溫泉蛋", category: "食物", difficulty: "中等" },

  // 腦筋急轉彎 (12 questions)
  { id: "brain_1", question: "什麼人一年只上一天班，卻從來不被開除？", answer: "聖誕老人", category: "腦筋急轉彎", difficulty: "簡單" },
  { id: "brain_2", question: "世界上寫得最慢的字是什麼字？【提示：與動物有關】", answer: "疝", category: "腦筋急轉彎", difficulty: "難" },
  { id: "brain_3", question: "冰塊最想做什麼事？【提示：猜一動作】", answer: "退燒", category: "腦筋急轉彎", difficulty: "中等" },
  { id: "brain_4", question: "哪一種桶子永遠裝不滿？", answer: "馬桶", category: "腦筋急轉彎", difficulty: "簡單" },
  { id: "brain_5", question: "一顆心值多少錢？【提示：比喻名詞】", answer: "一億", category: "腦筋急轉彎", difficulty: "中等" },
  { id: "brain_6", question: "什麼雞沒有翅膀？", answer: "田雞", category: "腦筋急轉彎", difficulty: "簡單" },
  { id: "brain_7", question: "最倒楣的數字是哪一個？【提示：原因與英文發音有關】", answer: "13", category: "腦筋急轉彎", difficulty: "中等" },
  { id: "brain_8", question: "什麼球沒人敢踢，也沒人敢接，只能躲？", answer: "原子彈", category: "腦筋急轉彎", difficulty: "簡單" },
  { id: "brain_9", question: "哪一個英文字母最酷？【提示：酷的音譯】", answer: "C", category: "腦筋急轉彎", difficulty: "中等" },
  { id: "brain_10", question: "什麼馬不會跑？", answer: "木馬", category: "腦筋急轉彎", difficulty: "簡單" },
  { id: "brain_11", question: "為什麼香蕉出門要塗防曬乳？【提示：因為它是……】", answer: "黃色", category: "腦筋急轉彎", difficulty: "中等" },
  { id: "brain_12", question: "黑人與白人結婚後生下來的小孩，牙齒是什麼顏色？", answer: "白色", category: "腦筋急轉彎", difficulty: "簡單" }
];
