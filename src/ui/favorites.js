const KEY = 'marxcloud.favs.v1';

/** 拾遗:被收下的句子,存在 localStorage(静态站没有账号体系,收藏只在本机)。 */
export function initFavorites() {
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(KEY)) || []; } catch { ids = []; }
  const set = new Set(ids.filter(n => Number.isInteger(n)));

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* 隐私模式下写不进去,只影响持久化 */ }
  }

  return {
    has: (i) => set.has(i),
    list: () => [...set],
    toggle(i) {
      if (set.has(i)) set.delete(i); else set.add(i);
      save();
      return set.has(i);
    },
    clear() { set.clear(); save(); }
  };
}
