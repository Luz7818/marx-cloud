/**
 * 人物元数据。weight 由语录数量自动推导,无需手填。
 * color 用于粒子着色与 UI 高亮;group 用于侧栏分组。
 */
export const groups = [
  { key: 'pioneer', label: '思想先驱' },
  { key: 'founders', label: '创始人' },
  { key: 'inheritors', label: '继承与发展' },
  { key: 'china', label: '在中国' }
];

export const figures = [
  {
    id: 'moore', name: '托马斯·莫尔', en: 'Thomas More', years: '1478–1535',
    region: '英国', role: '空想社会主义先驱', group: 'pioneer', color: '#a78bfa',
    blurb: '《乌托邦》的作者,空想社会主义的奠基人。'
  },
  {
    id: 'campanella', name: '康帕内拉', en: 'Tommaso Campanella', years: '1568–1639',
    region: '意大利', role: '空想社会主义先驱', group: 'pioneer', color: '#8a7ff0',
    blurb: '在狱中写下《太阳城》的理想主义者。'
  },
  {
    id: 'saintsimon', name: '圣西门', en: 'Henri de Saint-Simon', years: '1760–1825',
    region: '法国', role: '空想社会主义先驱', group: 'pioneer', color: '#6fa8f7',
    blurb: '设想“实业制度”的空想社会主义先驱。'
  },
  {
    id: 'owen', name: '罗伯特·欧文', en: 'Robert Owen', years: '1771–1858',
    region: '英国', role: '空想社会主义先驱', group: 'pioneer', color: '#62d5b8',
    blurb: '新拉纳克的实践者,合作社运动的先驱。'
  },
  {
    id: 'fourier', name: '傅立叶', en: 'Charles Fourier', years: '1772–1837',
    region: '法国', role: '空想社会主义先驱', group: 'pioneer', color: '#52c7e8',
    blurb: '构想“和谐制度”与“法郎吉”的空想家。'
  },
  {
    id: 'marx', name: '卡尔·马克思', en: 'Karl Marx', years: '1818–1883',
    region: '德国', role: '科学社会主义创始人', group: 'founders', color: '#ff4d4d',
    blurb: '科学社会主义的创始人,《资本论》的作者。'
  },
  {
    id: 'engels', name: '弗里德里希·恩格斯', en: 'Friedrich Engels', years: '1820–1895',
    region: '德国', role: '马克思主义共同奠基人', group: 'founders', color: '#ff8a5c',
    blurb: '马克思最亲密的战友,思想的共同奠基人。'
  },
  {
    id: 'plekhanov', name: '普列汉诺夫', en: 'Georgi Plekhanov', years: '1856–1918',
    region: '俄国', role: '俄国马克思主义奠基人', group: 'inheritors', color: '#b8a7f5',
    blurb: '俄国马克思主义之父。'
  },
  {
    id: 'zetkin', name: '克拉拉·蔡特金', en: 'Clara Zetkin', years: '1857–1933',
    region: '德国', role: '妇女运动领袖', group: 'inheritors', color: '#b7e778',
    blurb: '国际社会主义妇女运动的奠基人。'
  },
  {
    id: 'lenin', name: '弗拉基米尔·列宁', en: 'Vladimir Lenin', years: '1870–1924',
    region: '俄国 · 苏联', role: '十月革命领袖', group: 'inheritors', color: '#ffb830',
    blurb: '布尔什维克的缔造者,十月革命的领袖。'
  },
  {
    id: 'luxemburg', name: '罗莎·卢森堡', en: 'Rosa Luxemburg', years: '1871–1919',
    region: '波兰 · 德国', role: '革命理论家', group: 'inheritors', color: '#ff9ad5',
    blurb: '德国革命的思想家与烈士。'
  },
  {
    id: 'stalin', name: '约瑟夫·斯大林', en: 'Joseph Stalin', years: '1878–1953',
    region: '苏联', role: '苏联领导人', group: 'inheritors', color: '#f7dd72',
    blurb: '领导苏联工业化与卫国战争的领导人。'
  },
  {
    id: 'dimitrov', name: '季米特洛夫', en: 'Georgi Dimitrov', years: '1882–1949',
    region: '保加利亚', role: '国际共运领导人', group: 'inheritors', color: '#5eead4',
    blurb: '莱比锡法庭上与法西斯对质的英雄。'
  },
  {
    id: 'lidazhao', name: '李大钊', en: 'Li Dazhao', years: '1889–1927',
    region: '中国', role: '中国共产主义先驱', group: 'china', color: '#ff6b8a',
    blurb: '中国最早的马克思主义传播者。'
  },
  {
    id: 'hochiminh', name: '胡志明', en: 'Hồ Chí Minh', years: '1890–1969',
    region: '越南', role: '越南革命领袖', group: 'inheritors', color: '#f9c74f',
    blurb: '越南民主共和国的缔造者。'
  },
  {
    id: 'gramsci', name: '葛兰西', en: 'Antonio Gramsci', years: '1891–1937',
    region: '意大利', role: '西方马克思主义理论家', group: 'inheritors', color: '#8ecae6',
    blurb: '在狱中写下《狱中札记》的西方马克思主义者。'
  },
  {
    id: 'mao', name: '毛泽东', en: 'Mao Zedong', years: '1893–1976',
    region: '中国', role: '中国革命领袖', group: 'china', color: '#ff2e54',
    blurb: '中华人民共和国的缔造者,毛泽东思想的主要创立者。'
  },
  {
    id: 'fangzhimin', name: '方志敏', en: 'Fang Zhimin', years: '1899–1935',
    region: '中国', role: '革命烈士', group: 'china', color: '#ff8fa3',
    blurb: '《可爱的中国》的作者,赣东北苏区的创建者。'
  },
  {
    id: 'xiaminghan', name: '夏明翰', en: 'Xia Minghan', years: '1900–1928',
    region: '中国', role: '革命烈士', group: 'china', color: '#ff5d8f',
    blurb: '“砍头不要紧,只要主义真”的青年烈士。'
  },
  {
    id: 'dengxiaoping', name: '邓小平', en: 'Deng Xiaoping', years: '1904–1997',
    region: '中国', role: '改革开放总设计师', group: 'china', color: '#f4a261',
    blurb: '中国改革开放的总设计师。'
  },
  {
    id: 'castro', name: '菲德尔·卡斯特罗', en: 'Fidel Castro', years: '1926–2016',
    region: '古巴', role: '古巴革命领袖', group: 'inheritors', color: '#7bdff2',
    blurb: '古巴革命的领袖。'
  },
  {
    id: 'muntzer', name: '托马斯·闵采尔', en: 'Thomas Müntzer', years: '1489–1525',
    region: '德国', role: '农民战争领袖', group: 'pioneer', color: '#c9a227',
    blurb: '把天国搬到地上来的激进改革者,德国农民战争的旗手。'
  },
  {
    id: 'weitling', name: '威廉·魏特林', en: 'Wilhelm Weitling', years: '1808–1871',
    region: '德国', role: '空想共产主义者', group: 'pioneer', color: '#9ad1a0',
    blurb: '正义者同盟的理论家,德国工人运动的空想共产主义代表。'
  },
  {
    id: 'chernyshevsky', name: '车尔尼雪夫斯基', en: 'N. G. Chernyshevsky', years: '1828–1889',
    region: '俄国', role: '革命民主主义者', group: 'pioneer', color: '#e0aaff',
    blurb: '写在狱中的《怎么办?》,影响了整整几代俄国革命者。'
  },
  {
    id: 'bebel', name: '奥古斯特·倍倍尔', en: 'August Bebel', years: '1840–1913',
    region: '德国', role: '社会民主党领袖', group: 'inheritors', color: '#89c2d9',
    blurb: '德国社会民主党的创建者与长期领袖,《妇女与社会主义》的作者。'
  },
  {
    id: 'lafargue', name: '保尔·拉法格', en: 'Paul Lafargue', years: '1842–1911',
    region: '法国', role: '马克思主义宣传家', group: 'inheritors', color: '#f2ca3a',
    blurb: '马克思的女婿,《懒惰的权利》的作者,把马克思介绍给法国工人。'
  },
  {
    id: 'morris', name: '威廉·莫里斯', en: 'William Morris', years: '1834–1896',
    region: '英国', role: '设计师与社会主义者', group: 'inheritors', color: '#7fd1ae',
    blurb: '工艺美术运动的领袖,也是英国社会主义最早的宣传家之一。'
  },
  {
    id: 'guevara', name: '切·格瓦拉', en: 'Che Guevara', years: '1928–1967',
    region: '阿根廷 · 古巴', role: '革命家', group: 'inheritors', color: '#e07a5f',
    blurb: '骑着摩托车读遍南美,然后把一生交给了这片大陆的革命。'
  },
  {
    id: 'mariategui', name: '马里亚特吉', en: 'José C. Mariátegui', years: '1894–1930',
    region: '秘鲁', role: '马克思主义思想家', group: 'inheritors', color: '#d4a373',
    blurb: '拉丁美洲马克思主义的奠基人,《关于秘鲁国情的七篇论文》的作者。'
  },
  {
    id: 'quqiubai', name: '瞿秋白', en: 'Qu Qiubai', years: '1899–1935',
    region: '中国', role: '早期领袖 · 文学家', group: 'china', color: '#f28db2',
    blurb: '翻译《国际歌》的人,也是写下《多余的话》的人。'
  },
  {
    id: 'caihesen', name: '蔡和森', en: 'Cai Hesen', years: '1895–1931',
    region: '中国', role: '早期理论家', group: 'china', color: '#6ec6ca',
    blurb: '最早提出“中国共产党”这一名称的人。'
  },
  {
    id: 'dengzhongxia', name: '邓中夏', en: 'Deng Zhongxia', years: '1894–1933',
    region: '中国', role: '工人运动领袖', group: 'china', color: '#f4d35e',
    blurb: '长辛店工人的教员,中国早期职工运动的领导者。'
  },
  {
    id: 'zhaoyiman', name: '赵一曼', en: 'Zhao Yiman', years: '1905–1936',
    region: '中国', role: '抗日民族英雄', group: 'china', color: '#ff6b81',
    blurb: '在狱中受尽酷刑而不屈,临刑前给儿子写下遗书。'
  },
  {
    id: 'yundaiying', name: '恽代英', en: 'Yun Daiying', years: '1895–1931',
    region: '中国', role: '青年运动领袖', group: 'china', color: '#bde0fe',
    blurb: '青年的楷模,在狱中写下“留得豪情作楚囚”。'
  },
  {
    id: 'asiqi', name: '艾思奇', en: 'Ai Siqi', years: '1910–1966',
    region: '中国', role: '马克思主义哲学家', group: 'china', color: '#cdb4db',
    blurb: '用一本《大众哲学》,把哲学交到了普通人手里。'
  },
  // ---------- 2026-09 扩充(追加在后,不改动上文顺序:数组下标即对外编号) ----------
  {
    id: 'winstanley', name: '温斯坦莱', en: 'Gerrard Winstanley', years: '1609–1676',
    region: '英国', role: '掘地派领袖', group: 'pioneer', color: '#8fae8b',
    blurb: '带领掘地派开垦荒地、宣称"土地应为共有的宝库"的平均派思想家。'
  },
  {
    id: 'babeuf', name: '巴贝夫', en: 'Gracchus Babeuf', years: '1760–1797',
    region: '法国', role: '平等派密谋家', group: 'pioneer', color: '#c9a15a',
    blurb: '热月反动后密谋"平等共和国"的起义者,近代共产主义运动的先声。'
  },
  {
    id: 'cabet', name: '卡贝', en: 'Étienne Cabet', years: '1788–1856',
    region: '法国', role: '伊加利亚共产主义者', group: 'pioneer', color: '#7fb8a4',
    blurb: '《伊加利亚旅行记》的作者,曾带领信徒赴美建立乌托邦公社。'
  },
  {
    id: 'dezamy', name: '德萨米', en: 'Théodore Dézamy', years: '1803–1850',
    region: '法国', role: '空想共产主义者', group: 'pioneer', color: '#a8c47a',
    blurb: '《公有法典》的作者,坚持唯物论的空想共产主义者。'
  },
  {
    id: 'blanqui', name: '布朗基', en: 'Louis Auguste Blanqui', years: '1805–1881',
    region: '法国', role: '起义革命家', group: 'pioneer', color: '#c78b8b',
    blurb: '一生约半生在狱中的职业革命家,"布朗基主义"以其命名。'
  },
  {
    id: 'bakunin', name: '巴枯宁', en: 'Mikhail Bakunin', years: '1814–1876',
    region: '俄国', role: '无政府主义思想家', group: 'pioneer', color: '#a89bc9',
    blurb: '第一国际中与马克思论战的无政府主义思想代表。'
  },
  {
    id: 'herzen', name: '赫尔岑', en: 'Alexander Herzen', years: '1812–1870',
    region: '俄国', role: '民粹主义先驱', group: 'pioneer', color: '#8fb8d0',
    blurb: '在伦敦创办"自由俄文印刷所"、《钟声》的思想家。'
  },
  {
    id: 'lassalle', name: '拉萨尔', en: 'Ferdinand Lassalle', years: '1825–1864',
    region: '德国', role: '全德工人联合会创始人', group: 'inheritors', color: '#d9a83e',
    blurb: '德国第一个全国性工人组织的缔造者。'
  },
  {
    id: 'pottier', name: '鲍狄埃', en: 'Eugène Pottier', years: '1816–1887',
    region: '法国', role: '《国际歌》词作者', group: 'inheritors', color: '#e05a5a',
    blurb: '巴黎公社社员,在公社失败后写下《国际歌》。'
  },
  {
    id: 'jaures', name: '若雷斯', en: 'Jean Jaurès', years: '1859–1914',
    region: '法国', role: '法国社会主义运动领袖', group: 'inheritors', color: '#e08a3c',
    blurb: '在大战爆发前夕被暗杀的法国社会主义者与反战领袖。'
  },
  {
    id: 'kautsky', name: '考茨基', en: 'Karl Kautsky', years: '1854–1938',
    region: '德国 · 奥地利', role: '第二国际主要理论家', group: 'inheritors', color: '#c9b06b',
    blurb: '曾被尊为"马克思主义教皇"的第二国际理论家。'
  },
  {
    id: 'bernstein', name: '伯恩施坦', en: 'Eduard Bernstein', years: '1850–1932',
    region: '德国', role: '修正主义理论家', group: 'inheritors', color: '#b3a36b',
    blurb: '以"运动就是一切"闻名的修正主义代表人物。'
  },
  {
    id: 'liebknecht', name: '卡尔·李卜克内西', en: 'Karl Liebknecht', years: '1871–1919',
    region: '德国', role: '反战革命家', group: 'inheritors', color: '#d97b5a',
    blurb: '在帝国议会独票反战、与卢森堡同月就义的德国共产党创始人。'
  },
  {
    id: 'thalmann', name: '台尔曼', en: 'Ernst Thälmann', years: '1886–1944',
    region: '德国', role: '德国共产党领袖', group: 'inheritors', color: '#d05050',
    blurb: '领导德国共产党反抗法西斯,牺牲于集中营。'
  },
  {
    id: 'kollontai', name: '柯伦泰', en: 'Alexandra Kollontai', years: '1872–1952',
    region: '俄国 · 苏联', role: '妇女运动理论家', group: 'inheritors', color: '#e89ab8',
    blurb: '世界上第一位女性政府成员与女大使。'
  },
  {
    id: 'krupskaya', name: '克鲁普斯卡娅', en: 'Nadezhda Krupskaya', years: '1869–1939',
    region: '苏联', role: '教育家 · 列宁的战友', group: 'inheritors', color: '#9ad0c0',
    blurb: '苏联教育的奠基人之一,《论共产主义教育》的作者。'
  },
  {
    id: 'lunacharsky', name: '卢那察尔斯基', en: 'Anatoly Lunacharsky', years: '1875–1933',
    region: '苏联', role: '文艺理论家', group: 'inheritors', color: '#b0a0e0',
    blurb: '首任教育人民委员,苏联文化建设的主持者。'
  },
  {
    id: 'bukharin', name: '布哈林', en: 'Nikolai Bukharin', years: '1888–1938',
    region: '苏联', role: '苏联理论家', group: 'inheritors', color: '#d0b090',
    blurb: '《共产主义ABC》的作者,列宁称之为"党的最爱"。'
  },
  {
    id: 'gorky', name: '高尔基', en: 'Maxim Gorky', years: '1868–1936',
    region: '苏联', role: '无产阶级文学奠基人', group: 'inheritors', color: '#8fc7b0',
    blurb: '《母亲》《海燕》的作者,社会主义现实主义文学的开创者。'
  },
  {
    id: 'mayakovsky', name: '马雅可夫斯基', en: 'Vladimir Mayakovsky', years: '1893–1930',
    region: '苏联', role: '革命诗人', group: 'inheritors', color: '#f0b050',
    blurb: '把诗写成阶梯的革命未来主义者。'
  },
  {
    id: 'ostrovsky', name: '奥斯特洛夫斯基', en: 'Nikolai Ostrovsky', years: '1904–1936',
    region: '苏联', role: '《钢铁是怎样炼成的》作者', group: 'inheritors', color: '#e07040',
    blurb: '在双目失明、全身瘫痪中写下保尔·柯察金的故事。'
  },
  {
    id: 'makarenko', name: '马卡连柯', en: 'Anton Makarenko', years: '1888–1939',
    region: '苏联', role: '教育家', group: 'inheritors', color: '#a0d0a0',
    blurb: '把流浪儿童集体验成建设者的教育家,《教育诗》的作者。'
  },
  {
    id: 'togliatti', name: '陶里亚蒂', en: 'Palmiro Togliatti', years: '1893–1964',
    region: '意大利', role: '意大利共产党领袖', group: 'inheritors', color: '#90b8e0',
    blurb: '意共"意大利走向社会主义"道路的缔造者。'
  },
  {
    id: 'lukacs', name: '卢卡奇', en: 'György Lukács', years: '1885–1971',
    region: '匈牙利', role: '西方马克思主义奠基人', group: 'inheritors', color: '#b8a878',
    blurb: '《历史与阶级意识》的作者,"物化"概念的提出者。'
  },
  {
    id: 'marcuse', name: '马尔库塞', en: 'Herbert Marcuse', years: '1898–1979',
    region: '德国 · 美国', role: '法兰克福学派代表', group: 'inheritors', color: '#a8b8d8',
    blurb: '《单向度的人》的作者,1968 年学生运动的精神导师。'
  },
  {
    id: 'debs', name: '德布斯', en: 'Eugene V. Debs', years: '1855–1926',
    region: '美国', role: '美国社会主义运动领袖', group: 'inheritors', color: '#78a8c8',
    blurb: '五次竞选总统的美国社会主义者,因反战入狱。'
  },
  {
    id: 'foster', name: '福斯特', en: 'William Z. Foster', years: '1881–1961',
    region: '美国', role: '美国共产党主席', group: 'inheritors', color: '#88b090',
    blurb: '从工团主义者成长为美共主席的工人运动组织者。'
  },
  {
    id: 'bethune', name: '白求恩', en: 'Norman Bethune', years: '1890–1939',
    region: '加拿大 · 中国', role: '国际主义战士', group: 'inheritors', color: '#d8c8b8',
    blurb: '牺牲在晋察冀前线的加拿大医生,毛泽东为之写下纪念文章。'
  },
  {
    id: 'kotoku', name: '幸德秋水', en: 'Kōtoku Shūsui', years: '1871–1911',
    region: '日本', role: '日本早期社会主义者', group: 'inheritors', color: '#c8a0b8',
    blurb: '译介《共产党宣言》、死于"大逆事件"的日本社会主义先驱。'
  },
  {
    id: 'kawakami', name: '河上肇', en: 'Kawakami Hajime', years: '1879–1946',
    region: '日本', role: '马克思主义经济学家', group: 'inheritors', color: '#a0c8b8',
    blurb: '《贫困物语》的作者,影响了整整一代日本与中国青年。'
  },
  {
    id: 'katayama', name: '片山潜', en: 'Sen Katayama', years: '1859–1933',
    region: '日本', role: '日本共产党创始人之一', group: 'inheritors', color: '#b0a088',
    blurb: '在莫斯科安息的国际共产主义运动日本代表。'
  },
  {
    id: 'allende', name: '阿连德', en: 'Salvador Allende', years: '1908–1973',
    region: '智利', role: '智利总统', group: 'inheritors', color: '#e0c060',
    blurb: '在政变炮火中留下最后演说的民选总统。'
  },
  {
    id: 'chenduxiu', name: '陈独秀', en: 'Chen Duxiu', years: '1879–1942',
    region: '中国', role: '新文化运动领袖', group: 'china', color: '#e05555',
    blurb: '创办《新青年》的"总司令",党的第一至五届最高领导人。'
  },
  {
    id: 'zhouenlai', name: '周恩来', en: 'Zhou Enlai', years: '1898–1976',
    region: '中国', role: '中华人民共和国开国总理', group: 'china', color: '#f06070',
    blurb: '为中华之崛起而读书,鞠躬尽瘁二十六年。'
  },
  {
    id: 'liushaoqi', name: '刘少奇', en: 'Liu Shaoqi', years: '1898–1969',
    region: '中国', role: '党和国家主要领导人之一', group: 'china', color: '#f08060',
    blurb: '《论共产党员的修养》的作者,白区工作路线的代表。'
  },
  {
    id: 'zhude', name: '朱德', en: 'Zhu De', years: '1886–1976',
    region: '中国', role: '人民军队总司令', group: 'china', color: '#e0985a',
    blurb: '从辛亥革命走到开国大典的红军之父。'
  },
  {
    id: 'luxun', name: '鲁迅', en: 'Lu Xun', years: '1881–1936',
    region: '中国', role: '新文化运动主将 · 左翼文化旗手', group: 'china', color: '#70d0a8',
    blurb: '横眉冷对千夫指,俯首甘为孺子牛。'
  },
  {
    id: 'pengpai', name: '彭湃', en: 'Peng Pai', years: '1896–1929',
    region: '中国', role: '农民运动领袖', group: 'china', color: '#e8a060',
    blurb: '烧掉自家田契的"农民运动大王",海陆丰苏维埃的创建者。'
  },
  {
    id: 'xiangjingyu', name: '向警予', en: 'Xiang Jingyu', years: '1895–1928',
    region: '中国', role: '妇女运动先驱', group: 'china', color: '#f0a8c0',
    blurb: '中国共产党第一位女中央委员,妇女解放的旗手。'
  },
  {
    id: 'zhangtailei', name: '张太雷', en: 'Zhang Tailei', years: '1898–1927',
    region: '中国', role: '广州起义领导人', group: 'china', color: '#e88888',
    blurb: '把"红色中文"第一次带进共产国际讲坛,牺牲于广州起义。'
  },
  {
    id: 'zhaoshiyan', name: '赵世炎', en: 'Zhao Shiyan', years: '1901–1927',
    region: '中国', role: '工人运动领袖', group: 'china', color: '#e8b070',
    blurb: '上海三次工人武装起义的总指挥,26 岁就义。'
  },
  {
    id: 'dongbiwu', name: '董必武', en: 'Dong Biwu', years: '1886–1975',
    region: '中国', role: '一大代表 · 法治建设奠基人', group: 'china', color: '#d8b078',
    blurb: '从清末秀才到共和国副主席的"延安五老"之一。'
  },
  {
    id: 'pengdehuai', name: '彭德怀', en: 'Peng Dehuai', years: '1898–1974',
    region: '中国', role: '开国元帅', group: 'china', color: '#e8a068',
    blurb: '百团大战与抗美援朝的统帅,"为人民鼓与呼"的人。'
  },
  {
    id: 'chenyi', name: '陈毅', en: 'Chen Yi', years: '1901–1972',
    region: '中国', role: '元帅诗人', group: 'china', color: '#f0b878',
    blurb: '写下《梅岭三章》的元帅,也是上海的第一任市长。'
  },
  {
    id: 'songqingling', name: '宋庆龄', en: 'Soong Ching-ling', years: '1893–1981',
    region: '中国', role: '国家名誉主席', group: 'china', color: '#f0c0d0',
    blurb: '孙中山事业的继承者,被誉为"国之瑰宝"。'
  },
  {
    id: 'jiangzhujun', name: '江竹筠', en: 'Jiang Zhujun', years: '1920–1949',
    region: '中国', role: '红岩英烈', group: 'china', color: '#e87a90',
    blurb: '在渣滓洞受尽酷刑不改其志的"江姐"。'
  },
  {
    id: 'liuhulan', name: '刘胡兰', en: 'Liu Hulan', years: '1932–1947',
    region: '中国', role: '青年英烈', group: 'china', color: '#f095a8',
    blurb: '"生的伟大,死的光荣",15 岁慷慨就义。'
  },
  {
    id: 'leifeng', name: '雷锋', en: 'Lei Feng', years: '1940–1962',
    region: '中国', role: '为人民服务的楷模', group: 'china', color: '#70b8e8',
    blurb: '把有限的生命投入无限为人民服务之中的普通士兵。'
  },
  {
    id: 'jiaoyulu', name: '焦裕禄', en: 'Jiao Yulu', years: '1922–1964',
    region: '中国', role: '县委书记的榜样', group: 'china', color: '#98c890',
    blurb: '在兰考治沙治水直到生命最后一刻的县委书记。'
  },
  {
    id: 'wangjinxi', name: '王进喜', en: 'Wang Jinxi', years: '1923–1970',
    region: '中国', role: '铁人 · 大庆石油工人', group: 'china', color: '#d8d0a0',
    blurb: '"宁肯少活二十年,拼命也要拿下大油田"的铁人。'
  },
  {
    id: 'yuanlongping', name: '袁隆平', en: 'Yuan Longping', years: '1930–2021',
    region: '中国', role: '杂交水稻之父', group: 'china', color: '#a8d878',
    blurb: '一稻济世,万家粮足的"共和国勋章"获得者。'
  },
  {
    id: 'qianxuesen', name: '钱学森', en: 'Qian Xuesen', years: '1911–2009',
    region: '中国', role: '人民科学家', group: 'china', color: '#88c0e0',
    blurb: '冲破封锁归国的"航天之父",五年归国路,十年两弹成。'
  },
  {
    id: 'guomoruo', name: '郭沫若', en: 'Guo Moruo', years: '1892–1978',
    region: '中国', role: '马克思主义史学家 · 诗人', group: 'china', color: '#c0a8e0',
    blurb: '《女神》的作者,甲骨文与先秦思想史研究的开拓者。'
  },
  {
    id: 'aiqing', name: '艾青', en: 'Ai Qing', years: '1910–1996',
    region: '中国', role: '人民诗人', group: 'china', color: '#88b8a8',
    blurb: '"为什么我的眼里常含泪水?因为我对这土地爱得深沉……"'
  },
  {
    id: 'taoxingzhi', name: '陶行知', en: 'Tao Xingzhi', years: '1891–1946',
    region: '中国', role: '人民教育家', group: 'china', color: '#b0c890',
    blurb: '"捧着一颗心来,不带半根草去"的生活教育倡导者。'
  },
  {
    id: 'wenyiduo', name: '闻一多', en: 'Wen Yiduo', years: '1899–1946',
    region: '中国', role: '民主战士 · 诗人', group: 'china', color: '#d09890',
    blurb: '发表《最后一次讲演》后在昆明倒在特务枪口下。'
  }
];

export const figureMap = Object.fromEntries(figures.map(f => [f.id, f]));

/** 搜索别名:字、原名、另一通译 */
const ALIAS = {
  lenin: ['乌里扬诺夫', '伊里奇', '弗拉基米尔·伊里奇'],
  stalin: ['朱加什维利', '科巴'],
  mao: ['润之', '润之先生'],
  lidazhao: ['守常'],
  dengxiaoping: ['希贤'],
  hochiminh: ['阮必成', '阮爱国'],
  zetkin: ['蔡特金', '克拉拉'],
  luxemburg: ['罗莎', '卢森堡'],
  fourier: ['傅里叶', '沙尔·傅立叶'],
  owen: ['欧文', '罗伯特·欧文'],
  saintsimon: ['昂利·圣西门', '克劳德'],
  plekhanov: ['沃尔基奇', '格奥尔基'],
  castro: ['菲德尔', '卡斯特罗'],
  dimitrov: ['格奥尔基·季米特洛夫', '季米托夫'],
  campanella: ['康帕内拉'],
  moore: ['托马斯·莫尔'],
  babeuf: ['格拉古·巴贝夫'],
  bakunin: ['米哈伊尔·巴枯宁'],
  herzen: ['亚·伊·赫尔岑', '亚历山大·赫尔岑'],
  kautsky: ['卡尔·考茨基'],
  luxun: ['周树人', '豫才', '迅哥儿'],
  chenduxiu: ['仲甫'],
  zhouenlai: ['伍豪', '翔宇'],
  liushaoqi: ['刘少奇'],
  zhude: ['玉阶'],
  pengdehuai: ['彭德怀', '石穿'],
  chenyi: ['仲弘'],
  songqingling: ['宋庆龄', '庆龄'],
  guomoruo: ['郭开贞', '沫若先生'],
  taoxingzhi: ['陶知行'],
  gorky: ['马克西姆·高尔基', '阿列克谢·彼什科夫'],
  ostrovsky: ['尼古拉·奥斯特洛夫斯基', '保尔'],
  mayakovsky: ['弗拉基米尔·马雅可夫斯基'],
  kollontai: ['柯伦泰夫人'],
  krupskaya: ['娜杰日达·克鲁普斯卡娅'],
  bukharin: ['尼古拉·布哈林'],
  lukacs: ['格奥尔格·卢卡奇', '卢卡奇·格奥尔格'],
  marcuse: ['赫伯特·马尔库塞'],
  debs: ['尤金·德布斯'],
  bethune: ['诺尔曼·白求恩', '白求恩大夫'],
  allende: ['萨尔瓦多·阿连德'],
  jiangzhujun: ['江姐'],
  leifeng: ['雷锋叔叔'],
  qianxuesen: ['钱学森'],
  jiaoyulu: ['焦裕禄'],
  wangjinxi: ['铁人', '王铁人']
};

/** 维基共享资源人物条目(enwiki 标题),用于离线头像抓取与署名;无则不生成头像 */
const WIKI = {
  moore: 'Thomas More', campanella: 'Tommaso Campanella', saintsimon: 'Henri de Saint-Simon',
  owen: 'Robert Owen', fourier: 'Charles Fourier', marx: 'Karl Marx', engels: 'Friedrich Engels',
  plekhanov: 'Georgi Plekhanov', zetkin: 'Clara Zetkin', lenin: 'Vladimir Lenin',
  luxemburg: 'Rosa Luxemburg', stalin: 'Joseph Stalin', dimitrov: 'Georgi Dimitrov',
  lidazhao: 'Li Dazhao', hochiminh: 'Ho Chi Minh', gramsci: 'Antonio Gramsci', mao: 'Mao Zedong',
  fangzhimin: 'Fang Zhimin', xiaminghan: 'Xia Minghan', dengxiaoping: 'Deng Xiaoping',
  castro: 'Fidel Castro', muntzer: 'Thomas Müntzer', weitling: 'Wilhelm Weitling',
  chernyshevsky: 'Nikolai Chernyshevsky', bebel: 'August Bebel', lafargue: 'Paul Lafargue',
  morris: 'William Morris', guevara: 'Che Guevara', mariategui: 'José Carlos Mariátegui',
  quqiubai: 'Qu Qiubai', caihesen: 'Cai Hesen', dengzhongxia: 'Deng Zhongxia',
  zhaoyiman: 'Zhao Yiman', yundaiying: 'Yun Daiying', asiqi: 'Ai Siqi',
  winstanley: 'Gerrard Winstanley', babeuf: 'François-Noël Babeuf', cabet: 'Étienne Cabet',
  dezamy: 'Théodore Dézamy', blanqui: 'Louis Auguste Blanqui', bakunin: 'Mikhail Bakunin',
  herzen: 'Alexander Herzen', lassalle: 'Ferdinand Lassalle', pottier: 'Eugène Pottier',
  jaures: 'Jean Jaurès', kautsky: 'Karl Kautsky', bernstein: 'Eduard Bernstein',
  liebknecht: 'Karl Liebknecht', thalmann: 'Ernst Thälmann', kollontai: 'Alexandra Kollontai',
  krupskaya: 'Nadezhda Krupskaya', lunacharsky: 'Anatoly Lunacharsky', bukharin: 'Nikolai Bukharin',
  gorky: 'Maxim Gorky', mayakovsky: 'Vladimir Mayakovsky', ostrovsky: 'Nikolai Ostrovsky',
  makarenko: 'Anton Makarenko', togliatti: 'Palmiro Togliatti', lukacs: 'György Lukács',
  marcuse: 'Herbert Marcuse', debs: 'Eugene V. Debs', foster: 'William Z. Foster',
  bethune: 'Norman Bethune', kotoku: 'Kōtoku Shūsui', kawakami: 'Kawakami Hajime',
  katayama: 'Sen Katayama', allende: 'Salvador Allende', chenduxiu: 'Chen Duxiu',
  zhouenlai: 'Zhou Enlai', liushaoqi: 'Liu Shaoqi', zhude: 'Zhu De', luxun: 'Lu Xun',
  pengpai: 'Peng Pai', xiangjingyu: 'Xiang Jingyu', zhangtailei: 'Zhang Tailei',
  zhaoshiyan: 'Zhao Shiyan', dongbiwu: 'Dong Biwu', pengdehuai: 'Peng Dehuai', chenyi: 'Chen Yi',
  songqingling: 'Soong Ching-ling', jiangzhujun: 'Jiang Zhujun', liuhulan: 'Liu Hulan',
  leifeng: 'Lei Feng', jiaoyulu: 'Jiao Yulu', wangjinxi: 'Wang Jinxi', yuanlongping: 'Yuan Longping',
  qianxuesen: 'Qian Xuesen', guomoruo: 'Guo Moruo', aiqing: 'Ai Qing', taoxingzhi: 'Tao Xingzhi',
  wenyiduo: 'Wen Yiduo'
};
for (const f of figures) f.aka = ALIAS[f.id] || [];
for (const f of figures) f.wiki = WIKI[f.id] || null;
