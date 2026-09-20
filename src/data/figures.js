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
  }
];

export const figureMap = Object.fromEntries(figures.map(f => [f.id, f]));
