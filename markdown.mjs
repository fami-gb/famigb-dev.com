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

const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

// 段落が GitHub リポジトリへのリンクだけを含むとき OGP カードに置き換える
export const githubCard = {
  name: 'github-card',
  element: {
    filter: ['p'],
    visit(node) {
      let link = null;
      for (const child of node.children ?? []) {
        if (child.type === 'text') {
          if (!/^\s*$/.test(child.value)) return;
          continue;
        }
        if (child.type === 'element' && child.tagName === 'a' && child.children?.length > 0) {
          if (link) return;
          link = child;
          continue;
        }
        return;
      }
      if (!link) return;
      const href = link.properties?.href;
      if (typeof href !== 'string') return;
      let url;
      try { url = new URL(href); } catch { return; }
      if (url.hostname !== 'github.com') return;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return;
      const [owner, repo, ...rest] = parts;
      const sub = rest.length ? `/${rest.join('/')}` : '';
      const ogp = `https://opengraph.githubassets.com/1/${owner}/${repo}${sub}`;
      return el('a', { class: 'gh-card', href }, [
        el('img', { src: ogp, alt: `${owner}/${repo}`, width: 1200, height: 600, loading: 'lazy' }),
        el('span', { class: 'gh-card-url' }, [text(`github.com/${owner}/${repo}${sub}`)]),
      ]);
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
