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

// 段落が GitHub リポジトリへのリンクだけを含むとき OGP カードに置き換える
export const githubCard = {
  name: 'github-card',
  element: {
    filter: ['p'],
    visit(node) {
      const [link, ...rest] = (node.children ?? []).filter((c) => c.type !== 'text' || c.value.trim());
      if (rest.length || link?.tagName !== 'a') return;
      const url = URL.parse(link.properties?.href);
      if (url?.hostname !== 'github.com') return;
      const path = url.pathname.replace(/\/+$/, '');
      const [owner, repo] = path.split('/').filter(Boolean);
      if (!repo) return;
      return el('a', { class: 'gh-card', href: link.properties.href }, [
        el('img', { src: `https://opengraph.githubassets.com/1${path}`, alt: `${owner}/${repo}`, width: 1200, height: 600, loading: 'lazy' }),
        el('span', { class: 'gh-card-url' }, [text(`github.com${path}`)]),
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
