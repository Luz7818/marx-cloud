// 动效曲线单源(批2 归仓):屏上移动/变形/巡游类 JS 逐帧动效统一引用此处,
// 不得再手写内联三次曲线。与 style.css :root --ease-in-out
// (cubic-bezier(0.77, 0, 0.175, 1))同值同语义——CSS 令牌管 transition/animation,
// 本文件管逐帧插值,二者是同一条「in-out 缓动」的两个投影,改值需同批同改。
// easeInOutCubic:t<0.5 时 4t³,否则 1 − (−2t+2)³/2
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
