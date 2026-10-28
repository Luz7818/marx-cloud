import { toast } from './toast.js';

/**
 * 复制文本到剪贴板,带失败反馈与降级:
 * 1. Clipboard API(仅安全上下文可用);
 * 2. 降级到隐藏 textarea + execCommand(http 局域网 IP 等场景)。
 * 结果一律 toast 提示,不再静默。
 */
export async function copyText(text, { okMsg = '已复制到剪贴板' } = {}) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast(okMsg);
      return true;
    }
  } catch { /* 落到降级路径 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) { toast(okMsg); return true; }
    throw new Error('execCommand 失败');
  } catch {
    toast('复制失败:浏览器拒绝了剪贴板访问', { tone: 'err' });
    return false;
  }
}
