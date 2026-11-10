import katex from 'katex';

const raw = (value) => ({ type: 'raw', value });
const tex = (src, displayMode) => raw(katex.renderToString(src, { displayMode, throwOnError: false }));
const cls = (node) => node?.properties?.className ?? [];

// satteri の math 機能が出力する code.math-inline / pre > code.math-display を KaTeX の HTML に置き換える
export const katexPlugin = {
  name: 'katex',
  element: {
    filter: ['pre', 'code'],
    visit(node, ctx) {
      if (node.tagName === 'pre') {
        const code = node.children?.find((c) => c.tagName === 'code');
        if (cls(code).includes('math-display')) return tex(ctx.textContent(code), true);
        return;
      }
      if (cls(node).includes('math-inline')) return tex(ctx.textContent(node), false);
    },
  },
};

// ```mermaid は Shiki を通さず <pre class="mermaid">図のソース</pre> にして、クライアント側で描画する
export const mermaidPlugin = {
  name: 'mermaid',
  element: {
    filter: ['pre'],
    visit(node, ctx) {
      const code = node.children?.find((c) => c.tagName === 'code');
      if (!cls(code).includes('language-mermaid')) return;
      return { type: 'element', tagName: 'pre', properties: { class: 'mermaid' }, children: [{ type: 'text', value: ctx.textContent(code) }] };
    },
  },
};

const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

const decode = (s) =>
  s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (_, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1))
      : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()]);

// <meta property="og:title" content="..."> などを拾う。属性の順序は問わない
const parseOgp = (html) => {
  const meta = {};
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (key && content && !(key in meta)) meta[key] = decode(content[1] ?? content[2]);
  }
  return {
    title: meta['og:title'] ?? meta['twitter:title'] ?? decode(html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? '').trim(),
    description: meta['og:description'] ?? meta['twitter:description'] ?? meta.description ?? '',
    image: meta['og:image'] ?? meta['twitter:image'],
  };
};

// ponytail: OGP はビルドごとに取りに行き、ビルド中だけメモリに持つ。記事やビルドが増えて遅くなったらファイルにキャッシュする
// ponytail: 文字コードは UTF-8 前提。Shift_JIS のページは文字化けする
const ogpCache = new Map();
const fetchOgp = (href) => {
  if (!ogpCache.has(href)) {
    ogpCache.set(href, (async () => {
      try {
        const res = await fetch(href, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; link-card)' }, signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return {};
        const ogp = parseOgp(await res.text());
        if (ogp.image) ogp.image = new URL(ogp.image, res.url).href;
        return ogp;
      } catch {
        return {};
      }
    })());
  }
  return ogpCache.get(href);
};

// 段落がリンクひとつだけのとき、リンク先の OGP を左に画像・右に文章のカードにする。取得できなければ URL だけのカード
export const linkCard = {
  name: 'link-card',
  element: {
    filter: ['p'],
    async visit(node) {
      const [link, ...rest] = (node.children ?? []).filter((c) => c.type !== 'text' || c.value.trim());
      if (rest.length || link?.tagName !== 'a') return;
      const href = link.properties?.href;
      const url = URL.parse(href);
      if (!url?.protocol.startsWith('http')) return;
      const { title, description, image } = await fetchOgp(href);
      const display = url.host + url.pathname.replace(/\/+$/, '');
      return el('a', { class: 'link-card', href }, [
        ...(image ? [el('img', { src: image, alt: '', loading: 'lazy' })] : []),
        el('span', { class: 'link-card-body' }, [
          el('span', { class: 'link-card-title' }, [text(title || display)]),
          ...(description ? [el('span', { class: 'link-card-desc' }, [text(description)])] : []),
          ...(title ? [el('span', { class: 'link-card-url' }, [text(display)])] : []),
        ]),
      ]);
    },
  },
};

// > [!NOTE] などで始まる引用を GitHub 風の注記 <aside class="alert" data-alert="NOTE"> にする
export const alertPlugin = {
  name: 'alert',
  element: {
    filter: ['blockquote'],
    visit(node) {
      const [p, ...rest] = (node.children ?? []).filter((c) => c.type === 'element');
      const [first, ...inline] = p?.tagName === 'p' ? p.children : [];
      const m = first?.type === 'text' && first.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
      if (!m) return;
      const body = [text(first.value.slice(m[0].length)), ...inline].filter((c) => c.type !== 'text' || c.value);
      return el('aside', { class: 'alert', 'data-alert': m[1].toUpperCase() }, [...(body.length ? [el('p', {}, body)] : []), ...rest]);
    },
  },
};

// ```json title="settings.json" → ファイル名・言語・yank ボタン付きの <figure> で包む
export const codeFrame = {
  name: 'code-frame',
  root(root) {
    const meta = this.options.meta;
    const title = (typeof meta === 'string' ? meta : meta?.__raw)?.match(/title="([^"]+)"/)?.[1] ?? '';
    root.children = [
      el('figure', { class: 'code' }, [
        el('figcaption', {}, [
          el('span', { class: 'code-title' }, [text(title)]),
          el('span', { class: 'code-lang' }, [text(this.options.lang)]),
          el('button', { type: 'button', 'data-yank': '' }, [text('yank')]),
        ]),
        ...root.children,
      ]),
    ];
  },
};

export const nierTheme = {
  name: 'nier',
  type: 'dark',
  colors: { 'editor.background': '#34322B', 'editor.foreground': '#E6E0CB' },
  tokenColors: [
    { scope: ['comment'], settings: { foreground: '#A59F88', fontStyle: 'italic' } },
    { scope: ['string'], settings: { foreground: '#B9C99A' } },
    { scope: ['support.type.property-name', 'entity.name.tag', 'entity.other.attribute-name'], settings: { foreground: '#E8C98E' } },
    { scope: ['keyword', 'storage', 'keyword.operator.new'], settings: { foreground: '#E3A784' } },
    { scope: ['constant', 'support.constant'], settings: { foreground: '#D9B8E0' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#A8CFD0' } },
    { scope: ['entity.name.type', 'support.type', 'support.class'], settings: { foreground: '#E8C98E' } },
  ],
};
