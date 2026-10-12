type Entry = { title: string; url: string; kind: string; date: string; text: string };

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

export function initKeys() {
  // ── j/k/l: [data-nav] を NieR のメニューのように選ぶ。無いページでは j/k はスクロール
  const items = [...document.querySelectorAll<HTMLElement>('[data-nav]')];
  const desc = $('#desc');
  let cur = -1;
  const select = (n: number, scroll = true) => {
    items[cur]?.classList.remove('is-sel');
    cur = (n + items.length) % items.length;
    const el = items[cur];
    el.classList.add('is-sel');
    if (scroll) el.scrollIntoView({ block: 'nearest' });
    if (desc && el.dataset.desc !== undefined) desc.textContent = el.dataset.desc || 'NO DATA ── 概要未登録';
  };
  if (items.length) select(0, false);
  items.forEach((el, n) => el.addEventListener('mouseenter', () => select(n, false)));

  const echo = (s: string) => ($('#echo')!.textContent = s);

  addEventListener('keydown', (e) => {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey || dialog.open) return;
    if ((e.target as HTMLElement).closest('input, textarea, select')) return;
    const nav = items.length > 0;
    switch (e.key) {
      case 'j': nav ? select(cur + 1) : scrollBy({ top: 120 }); break;
      case 'k': nav ? select(cur - 1) : scrollBy({ top: -120 }); break;
      case 'l': if (nav) items[cur].click(); break;
      case 'h': if (document.body.dataset.back) location.href = document.body.dataset.back; break;
      case 'g': scrollTo({ top: 0 }); break;
      case 'G': scrollTo({ top: document.documentElement.scrollHeight }); break;
      case '/': openSearch(); break;
      default: return;
    }
    e.preventDefault();
    echo(e.key);
  });

  // ── / 検索
  const dialog = $<HTMLDialogElement>('#search')!;
  const input = $<HTMLInputElement>('#q')!;
  const list = $('#results')!;
  const hits = $('#hits')!;
  let index: Entry[] | undefined;
  let results: Entry[] = [];
  let sel = 0;

  async function openSearch() {
    dialog.showModal();
    input.select();
    index ??= await (await fetch('/search.json')).json();
    render();
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    results = q ? index!.filter((x) => x.text.includes(q)) : index!;
    sel = 0;
    hits.textContent = `${results.length} HIT`;
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'NO DATA ── 該当なし';
      list.replaceChildren(li);
      return;
    }
    list.replaceChildren(
      ...results.map((r, n) => {
        const a = document.createElement('a');
        a.href = r.url;
        a.className = 'item' + (n === sel ? ' is-sel' : '');
        const title = document.createElement('span');
        title.className = 'title';
        const at = q ? r.title.toLowerCase().indexOf(q) : -1;
        if (at < 0) title.textContent = r.title;
        else {
          const m = document.createElement('mark');
          m.textContent = r.title.slice(at, at + q.length);
          title.append(r.title.slice(0, at), m, r.title.slice(at + q.length));
        }
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = `${r.kind} · ${r.date}`;
        a.append(title, meta);
        const li = document.createElement('li');
        li.append(a);
        return li;
      }),
    );
  }

  const move = (d: number) => {
    const links = list.querySelectorAll('a');
    if (!links.length) return;
    links[sel].classList.remove('is-sel');
    sel = (sel + d + links.length) % links.length;
    links[sel].classList.add('is-sel');
    links[sel].scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    // Ctrl-n はブラウザが新規ウィンドウに予約しているので取れない。Ctrl-j/k で代用
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) move(1);
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) move(-1);
    else if (e.key === 'Enter' && results[sel]) location.href = results[sel].url;
    else return;
    e.preventDefault();
  });
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());

  // ── スクロール位置: ステータスラインの Top/Bot/NN%、目次の現在地、読了バー
  const pct = $('#pct')!;
  const bar = $('#progress');
  const barText = $('#progress-text');
  const heads = [...document.querySelectorAll('.prose h2')];
  const toc = [...document.querySelectorAll('[data-toc]')];
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.round((scrollY / max) * 100) : 100;
    pct.textContent = max <= 0 ? 'All' : p === 0 ? 'Top' : p === 100 ? 'Bot' : `${p}%`;
    if (bar) bar.style.width = `${p}%`;
    if (barText) barText.textContent = `${p}%`;
    const at = Math.max(0, heads.findLastIndex((h) => h.getBoundingClientRect().top < 120));
    toc.forEach((a, n) => a.setAttribute('aria-current', String(n === at)));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── コードブロックの yank
  document.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-yank]');
    if (!b) return;
    const code = b.closest('figure')!.querySelector('pre')!.innerText.replace(/\n$/, '');
    await navigator.clipboard.writeText(code);
    const n = code.split('\n').length;
    b.textContent = 'yanked';
    echo(n === 1 ? '1 line yanked' : `${n} lines yanked`);
    setTimeout(() => (b.textContent = 'yank'), 1200);
  });
}
