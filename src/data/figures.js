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
  moore: ['托马斯·莫尔']
};
for (const f of figures) f.aka = ALIAS[f.id] || [];
