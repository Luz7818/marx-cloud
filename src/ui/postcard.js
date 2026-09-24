const SERIF = '"Noto Serif SC","Source Han Serif SC","Songti SC",serif';

/** 按字宽折行(CJK 无空格,只能逐字量) */
function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * 留影:把当前这句连同身后的星图导出成一张可分享的竖版图片。
 * 必须在同一次任务里先 render 再 drawImage,否则 WebGL 画布已被清空。
 */
export function savePostcard({ scene, quote, figure, index, total }) {
  const W = 1200, H = 1500, PAD = 110;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const src = scene.renderer.domElement;

  scene.renderNow();
  ctx.fillStyle = '#07080f';
  ctx.fillRect(0, 0, W, H);
  const s = Math.max(W / src.width, H / src.height);
  const dw = src.width * s, dh = src.height * s;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);

  const grad = ctx.createLinearGradient(0, H * 0.34, 0, H);
  grad.addColorStop(0, 'rgba(7,8,15,0)');
  grad.addColorStop(0.45, 'rgba(7,8,15,0.86)');
  grad.addColorStop(1, 'rgba(7,8,15,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(216,183,186,0.9)';
  ctx.font = `500 30px ${SERIF}`;
  ctx.fillText(figure.name + ' · ' + figure.years, PAD, 120);
  ctx.fillStyle = 'rgba(232,231,236,0.35)';
  ctx.font = `400 22px ${SERIF}`;
  ctx.fillText('思想云 · Marx Cloud', PAD, 170);

  ctx.fillStyle = figure.color;
  ctx.beginPath();
  ctx.arc(PAD + 9, H - 470, 9, 0, Math.PI * 2);
  ctx.fill();

  const quoteText = '“' + quote.t + '”';
  let size = 52;
  let lines;
  do {
    ctx.font = `600 ${size}px ${SERIF}`;
    lines = wrap(ctx, quoteText, W - PAD * 2);
    size -= 3;
  } while (lines.length * size * 1.72 > 560 && size > 26);

  const lh = size * 1.72;
  let y = H - 470 - lines.length * lh;
  ctx.fillStyle = '#f3f1f4';
  for (const ln of lines) { ctx.fillText(ln, PAD, y); y += lh; }

  ctx.fillStyle = 'rgba(232,231,236,0.55)';
  ctx.font = `400 26px ${SERIF}`;
  ctx.fillText(quote.w + (quote.y ? ` · ${quote.y}` : ''), PAD, H - 240);
  ctx.fillStyle = 'rgba(232,231,236,0.32)';
  ctx.font = `400 22px ${SERIF}`;
  ctx.fillText(`第 ${String(index + 1).padStart(3, '0')} 句 / 共 ${total} 句`, PAD, H - 190);

  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = `思想云-${figure.name}-第${index + 1}句.png`;
  a.click();
}
