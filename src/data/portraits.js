/**
 * 生成文件(tools/make-portraits.mjs 产出),勿手改。
 * ava/mask 路径相对 public/;mask 为 null 表示该人物不参与星尘换装,界面回退徽记。
 * v 是旗舰掩膜的缓存串,重画 public/<id>-mask.png 后必须递增。
 */
export const portraits = {
  "moore": {
    "ava": "avatars/moore.jpg",
    "mask": "portraits/moore.png",
    "credit": "Commons:Hans Holbein, the Younger - Sir Thomas More - Google Art Project.jpg(Public domain)"
  },
  "campanella": {
    "ava": "avatars/campanella.jpg",
    "mask": "portraits/campanella.png",
    "credit": "Commons:Cozza Tommaso Campanella.jpg(Public domain)"
  },
  "saintsimon": {
    "ava": "avatars/saintsimon.jpg",
    "mask": "portraits/saintsimon.png",
    "credit": "Commons:Claude Henri de Rouvroy.jpg(Public domain)"
  },
  "owen": {
    "ava": "avatars/owen.jpg",
    "mask": "portraits/owen.png",
    "credit": "Commons:Robert Owen by William Henry Brooke.jpg(Public domain)"
  },
  "fourier": {
    "ava": "avatars/fourier.jpg",
    "mask": "portraits/fourier.png",
    "credit": "Commons:Françoise Foliot - Jean Gigoux - Portrait de Charles Fourrier (cropped) (1).jpg(CC BY-SA 4.0)"
  },
  "marx": {
    "ava": "avatars/marx.jpg",
    "mask": "marx-mask.png",
    "v": 7,
    "credit": "本仓素材 tools/marx-photo.jpg"
  },
  "engels": {
    "ava": "avatars/engels.jpg",
    "mask": "engels-mask.png",
    "v": 3,
    "credit": "本仓素材 tools/engels-photo.jpg"
  },
  "plekhanov": {
    "ava": "avatars/plekhanov.jpg",
    "mask": "portraits/plekhanov.png",
    "credit": "Commons:Georgi Valentinovich Plekhanov, ca. 1917.jpg(Public domain)"
  },
  "zetkin": {
    "ava": "avatars/zetkin.jpg",
    "mask": "portraits/zetkin.png",
    "credit": "Commons:C Zetkin 1.jpg(Public domain)"
  },
  "lenin": {
    "ava": "avatars/lenin.jpg",
    "mask": "lenin-mask.png",
    "v": 3,
    "credit": "本仓素材 tools/lenin-photo.jpg"
  },
  "luxemburg": {
    "ava": "avatars/luxemburg.jpg",
    "mask": "luxemburg-mask.png",
    "v": 3,
    "credit": "本仓素材 tools/luxemburg-photo.jpg"
  },
  "stalin": {
    "ava": "avatars/stalin.jpg",
    "mask": "portraits/stalin.png",
    "credit": "Commons:Joseph Stalin official portrait.jpg(Public domain)"
  },
  "dimitrov": {
    "ava": "avatars/dimitrov.jpg",
    "mask": "portraits/dimitrov.png",
    "credit": "Commons:Georgi Dimitrow.png(Public domain)"
  },
  "lidazhao": {
    "ava": "avatars/lidazhao.jpg",
    "mask": "portraits/lidazhao.png",
    "credit": "Commons:1989 CPA 6111.jpg(Public domain)"
  },
  "hochiminh": {
    "ava": "avatars/hochiminh.jpg",
    "mask": "portraits/hochiminh.png",
    "credit": "Commons:Ho Chi Minh 1946.jpg(Public domain)"
  },
  "gramsci": {
    "ava": "avatars/gramsci.jpg",
    "mask": "portraits/gramsci.png",
    "credit": "Commons:Gramsci.png(Public domain)"
  },
  "mao": {
    "ava": "avatars/mao.jpg",
    "mask": "portraits/mao.png",
    "credit": "Commons:Mao Tse Tung.jpg(Public domain)"
  },
  "fangzhimin": {
    "ava": "avatars/fangzhimin.jpg",
    "mask": "portraits/fangzhimin.png",
    "credit": "Commons:Fangzhimin2.JPG(Public domain)"
  },
  "xiaminghan": {
    "ava": "avatars/xiaminghan.jpg",
    "mask": "portraits/xiaminghan.png",
    "credit": "Commons:Xia Minghan.jpg(Public domain)"
  },
  "dengxiaoping": {
    "ava": "avatars/dengxiaoping.jpg",
    "mask": "portraits/dengxiaoping.png",
    "credit": "Commons:Deng Xiaoping and Jimmy Carter at the arrival ceremony for the Vice Premier of China. - NARA - 183157-restored(cropped).jpg(Public domain)"
  },
  "castro": {
    "ava": "avatars/castro.jpg",
    "mask": "portraits/castro.png",
    "credit": "Commons:Fidel Castro 1950s.jpg(Public domain)"
  },
  "muntzer": {
    "ava": "avatars/muntzer.jpg",
    "mask": "portraits/muntzer.png",
    "credit": "Commons:Thomas Muentzer.jpg(Public domain)"
  },
  "weitling": {
    "ava": "avatars/weitling.jpg",
    "mask": "portraits/weitling.png",
    "credit": "Commons:WilhelmWeitling.jpg(Public domain)"
  },
  "bebel": {
    "ava": "avatars/bebel.jpg",
    "mask": "portraits/bebel.png",
    "credit": "Commons:August Bebel 2.jpg(Public domain)"
  },
  "lafargue": {
    "ava": "avatars/lafargue.jpg",
    "mask": "portraits/lafargue.png",
    "credit": "Commons:Paul Lafargue 1869.jpg(Public domain)"
  },
  "morris": {
    "ava": "avatars/morris.jpg",
    "mask": "portraits/morris.png",
    "credit": "Commons:William Morris age 53.jpg(Public domain)"
  },
  "guevara": {
    "ava": "avatars/guevara.jpg",
    "mask": "portraits/guevara.png",
    "credit": "Commons:Che Guevara - ca. 1945.jpg(Public domain)"
  },
  "mariategui": {
    "ava": "avatars/mariategui.jpg",
    "mask": "portraits/mariategui.png",
    "credit": "Commons:José Carlos Mariátegui in 1929.jpg(Public domain)"
  },
  "quqiubai": {
    "ava": "avatars/quqiubai.jpg",
    "mask": "portraits/quqiubai.png",
    "credit": "Commons:Qu Qiubai.JPG(Public domain)"
  },
  "caihesen": {
    "ava": "avatars/caihesen.jpg",
    "mask": "portraits/caihesen.png",
    "credit": "Commons:Cai Hesen.jpg(Public domain)"
  },
  "dengzhongxia": {
    "ava": "avatars/dengzhongxia.jpg",
    "mask": "portraits/dengzhongxia.png",
    "credit": "Commons:Deng Zhongxia.jpg(Public domain)"
  },
  "zhaoyiman": {
    "ava": "avatars/zhaoyiman.jpg",
    "mask": "portraits/zhaoyiman.png",
    "credit": "Commons:Zhao Yiman.jpg(Public domain)"
  },
  "yundaiying": {
    "ava": "avatars/yundaiying.jpg",
    "mask": "portraits/yundaiying.png",
    "credit": "Commons:Yun Daiying.jpg(Public domain)"
  },
  "asiqi": {
    "ava": "avatars/asiqi.jpg",
    "mask": "portraits/asiqi.png",
    "credit": "Commons:艾思奇 (Cropped).jpg(CC BY-SA 4.0)"
  },
  "babeuf": {
    "ava": "avatars/babeuf.jpg",
    "mask": "portraits/babeuf.png",
    "credit": "Commons:François-Noël Babeuf.jpg(Public domain)"
  },
  "cabet": {
    "ava": "avatars/cabet.jpg",
    "mask": "portraits/cabet.png",
    "credit": "Commons:Etienne Cabet (1788-1856) même portrait, l'habit simplement esquissé, D.1740.jpg(CC0)"
  },
  "bakunin": {
    "ava": "avatars/bakunin.jpg",
    "mask": "portraits/bakunin.png",
    "credit": "Commons:Bakunin Nadar.jpg(Public domain)"
  },
  "herzen": {
    "ava": "avatars/herzen.jpg",
    "mask": "portraits/herzen.png",
    "credit": "Commons:Herzen ge.png(Public domain)"
  },
  "lassalle": {
    "ava": "avatars/lassalle.jpg",
    "mask": "portraits/lassalle.png",
    "credit": "Commons:Ferdinandlasalle.jpg(Public domain)"
  },
  "pottier": {
    "ava": "avatars/pottier.jpg",
    "mask": "portraits/pottier.png",
    "credit": "Commons:Eugène Pottier par Étienne Carjat.jpg(Public domain)"
  },
  "jaures": {
    "ava": "avatars/jaures.jpg",
    "mask": "portraits/jaures.png",
    "credit": "Commons:Jean Jaurès, 1904, par Nadar.jpg(Public domain)"
  },
  "kautsky": {
    "ava": "avatars/kautsky.jpg",
    "mask": "portraits/kautsky.png",
    "credit": "Commons:Karl Kautsky.jpg(Public domain)"
  },
  "bernstein": {
    "ava": "avatars/bernstein.jpg",
    "mask": "portraits/bernstein.png",
    "credit": "Commons:Eduard Bernstein (portrait).jpg(Public domain)"
  },
  "liebknecht": {
    "ava": "avatars/liebknecht.jpg",
    "mask": "portraits/liebknecht.png",
    "credit": "Commons:Karl Liebknecht portrait (cropped).jpg(Public domain)"
  },
  "thalmann": {
    "ava": "avatars/thalmann.jpg",
    "mask": "portraits/thalmann.png",
    "credit": "Commons:Bundesarchiv Bild 102-12940, Ernst Thälmann (scrap).jpg(CC BY-SA 3.0 de)"
  },
  "kollontai": {
    "ava": "avatars/kollontai.jpg",
    "mask": "portraits/kollontai.png",
    "credit": "Commons:Alexandra Kollontai 1946.jpg(Public domain)"
  },
  "krupskaya": {
    "ava": "avatars/krupskaya.jpg",
    "mask": "portraits/krupskaya.png",
    "credit": "Commons:KrupskayaY 1922PorMariaUlyanova (cropped).jpg(Public domain)"
  },
  "lunacharsky": {
    "ava": "avatars/lunacharsky.jpg",
    "mask": "portraits/lunacharsky.png",
    "credit": "Commons:Lunacharsky.jpg(Public domain)"
  },
  "bukharin": {
    "ava": "avatars/bukharin.jpg",
    "mask": "portraits/bukharin.png",
    "credit": "Commons:Bucharin.bra.jpg(Public domain)"
  },
  "gorky": {
    "ava": "avatars/gorky.jpg",
    "mask": "portraits/gorky.png",
    "credit": "Commons:Maxim Gorky LOC Restored edit1.jpg(Public domain)"
  },
  "mayakovsky": {
    "ava": "avatars/mayakovsky.jpg",
    "mask": "portraits/mayakovsky.png",
    "credit": "Commons:Majakovszkij.jpg(Public domain)"
  },
  "ostrovsky": {
    "ava": "avatars/ostrovsky.jpg",
    "mask": "portraits/ostrovsky.png",
    "credit": "Commons:N Ostrovskiy.jpg(Public domain)"
  },
  "makarenko": {
    "ava": "avatars/makarenko.jpg",
    "mask": "portraits/makarenko.png",
    "credit": "Commons:Makarenko.jpg(Public domain)"
  },
  "togliatti": {
    "ava": "avatars/togliatti.jpg",
    "mask": "portraits/togliatti.png",
    "credit": "Commons:Palmiro-Togliatti-00504708.jpg(Public domain)"
  },
  "lukacs": {
    "ava": "avatars/lukacs.jpg",
    "mask": "portraits/lukacs.png",
    "credit": "Commons:Lukács György.jpg(CC BY-SA 3.0 de)"
  },
  "marcuse": {
    "ava": "avatars/marcuse.jpg",
    "mask": "portraits/marcuse.png",
    "credit": "Commons:Herbert Marcuse in Newton, Massachusetts 1955.jpeg(CC BY-SA 3.0)"
  },
  "debs": {
    "ava": "avatars/debs.jpg",
    "mask": "portraits/debs.png",
    "credit": "Commons:Eugene V Debs 1912.jpg(Public domain)"
  },
  "foster": {
    "ava": "avatars/foster.jpg",
    "mask": "portraits/foster.png",
    "credit": "Commons:William Z. Foster, cropped.PNG(Public domain)"
  },
  "bethune": {
    "ava": "avatars/bethune.jpg",
    "mask": "portraits/bethune.png",
    "credit": "Commons:Norman Bethune graduation 1922.jpg(Public domain)"
  },
  "kotoku": {
    "ava": "avatars/kotoku.jpg",
    "mask": "portraits/kotoku.png",
    "credit": "Commons:KotokuShusui.jpg(Public domain)"
  },
  "katayama": {
    "ava": "avatars/katayama.jpg",
    "mask": "portraits/katayama.png",
    "credit": "Commons:Sen Katayama.jpg(Public domain)"
  },
  "allende": {
    "ava": "avatars/allende.jpg",
    "mask": "portraits/allende.png",
    "credit": "Commons:Salvador Allende, President of Chile, gtfy.00154.jpg(Public domain)"
  },
  "chenduxiu": {
    "ava": "avatars/chenduxiu.jpg",
    "mask": "portraits/chenduxiu.png",
    "credit": "Commons:Chen Duxiu4.jpg(Public domain)"
  },
  "zhouenlai": {
    "ava": "avatars/zhouenlai.jpg",
    "mask": "portraits/zhouenlai.png",
    "credit": "Commons:國共內戰時期周恩來.jpg(Public domain)"
  },
  "liushaoqi": {
    "ava": "avatars/liushaoqi.jpg",
    "mask": "portraits/liushaoqi.png",
    "credit": "Commons:Liu Shaoqi (cropped).jpg(Public domain)"
  },
  "zhude": {
    "ava": "avatars/zhude.jpg",
    "mask": "portraits/zhude.png",
    "credit": "Commons:Zhu De, Commander of PLA.jpg(Public domain)"
  },
  "luxun": {
    "ava": "avatars/luxun.jpg",
    "mask": "portraits/luxun.png",
    "credit": "Commons:LuXun1930.jpg(Public domain)"
  },
  "pengpai": {
    "ava": "avatars/pengpai.jpg",
    "mask": "portraits/pengpai.png",
    "credit": "Commons:Peng Pai.jpg(Public domain)"
  },
  "xiangjingyu": {
    "ava": "avatars/xiangjingyu.jpg",
    "mask": "portraits/xiangjingyu.png",
    "credit": "Commons:向警予.jpg(Public domain)"
  },
  "zhangtailei": {
    "ava": "avatars/zhangtailei.jpg",
    "mask": "portraits/zhangtailei.png",
    "credit": "Commons:Zhang Tailei.jpg(Public domain)"
  },
  "zhaoshiyan": {
    "ava": "avatars/zhaoshiyan.jpg",
    "mask": "portraits/zhaoshiyan.png",
    "credit": "Commons:Zhao Shiyan.jpg(Public domain)"
  },
  "dongbiwu": {
    "ava": "avatars/dongbiwu.jpg",
    "mask": "portraits/dongbiwu.png",
    "credit": "Commons:DONGBIWU.JPG(Public domain)"
  },
  "pengdehuai": {
    "ava": "avatars/pengdehuai.jpg",
    "mask": "portraits/pengdehuai.png",
    "credit": "Commons:General Peng Dehuai.jpg(Public domain)"
  },
  "songqingling": {
    "ava": "avatars/songqingling.jpg",
    "mask": "portraits/songqingling.png",
    "credit": "Commons:Soong Ching-ling.jpg(Public domain)"
  },
  "liuhulan": {
    "ava": "avatars/liuhulan.jpg",
    "mask": "portraits/liuhulan.png",
    "credit": "Commons:195202 1952年 刘胡兰雕塑.png(Public domain)"
  },
  "leifeng": {
    "ava": "avatars/leifeng.jpg",
    "mask": "portraits/leifeng.png",
    "credit": "Commons:Lei Feng 13.jpg(Public domain)"
  },
  "jiaoyulu": {
    "ava": "avatars/jiaoyulu.jpg",
    "mask": "portraits/jiaoyulu.png",
    "credit": "Commons:Jiaoyulu.jpg(Public domain)"
  },
  "wangjinxi": {
    "ava": "avatars/wangjinxi.jpg",
    "mask": "portraits/wangjinxi.png",
    "credit": "Commons:1966-07 大庆铁人王进喜.jpg(Public domain)"
  },
  "yuanlongping": {
    "ava": "avatars/yuanlongping.jpg",
    "mask": "portraits/yuanlongping.png",
    "credit": "Commons:Yuan Longping at news conference (cropped).png(CC BY 3.0)"
  },
  "qianxuesen": {
    "ava": "avatars/qianxuesen.jpg",
    "mask": "portraits/qianxuesen.png",
    "credit": "Commons:歸國後的錢學森.png(Public domain)"
  },
  "guomoruo": {
    "ava": "avatars/guomoruo.jpg",
    "mask": "portraits/guomoruo.png",
    "credit": "Commons:郭开贞.jpg(Public domain)"
  },
  "aiqing": {
    "ava": "avatars/aiqing.jpg",
    "mask": "portraits/aiqing.png",
    "credit": "Commons:Ai Qing 1929.jpg(Public domain)"
  },
  "taoxingzhi": {
    "ava": "avatars/taoxingzhi.jpg",
    "mask": "portraits/taoxingzhi.png",
    "credit": "Commons:Tao Xing-zhi.jpg(Public domain)"
  }
};
