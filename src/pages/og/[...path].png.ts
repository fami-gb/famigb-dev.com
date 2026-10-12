import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPosts, fmt } from '../../utils';

const C = { ground: '#D2CDB5', ink: '#4A4740', tab: '#C9C3AA', alert: '#8E3A2A', onAlert: '#F3EEDC' };
const SANS = 'Zen Kaku Gothic New';
const MONO = 'IBM Plex Mono';

type Node = { type: string; props: Record<string, unknown> };
const h = (style: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

// 画像に出す文字だけを Google Fonts から TrueType で取得する(text= でサブセット化)
async function loadFonts(text: string) {
  const url = `https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400&family=IBM+Plex+Mono:wght@400;500&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const faces = [...css.matchAll(/font-family: '([^']+)';[^}]*?font-weight: (\d+);[^}]*?src: url\(([^)]+)\)/g)];
  if (!faces.length) throw new Error('OG 用フォントを取得できませんでした');
  return Promise.all(
    faces.map(async ([, name, weight, src]) => ({
      name,
      weight: Number(weight) as 300 | 400 | 500,
      data: await (await fetch(src)).arrayBuffer(),
    })),
  );
}

type Card = { label: string; title: string; titleSize: number; titleWeight: number; meta: string[]; file: string };

function card({ label, title, titleSize, titleWeight, meta, file }: Card): Node {
  const mono = (size: number, extra = {}) => ({ fontFamily: MONO, fontSize: size, letterSpacing: size * 0.14, ...extra });
  return h(
    {
      width: 1200, height: 630, flexDirection: 'column', background: C.ground, color: C.ink, fontFamily: SANS,
      backgroundImage: 'radial-gradient(circle, #B9B39A 1.5px, transparent 1.5px)', backgroundSize: '24px 24px',
    },
    h(
      { flexDirection: 'column', flexGrow: 1, padding: '48px 64px 40px' },
      h(
        { justifyContent: 'space-between', alignItems: 'flex-end' },
        h({ fontSize: 44, fontWeight: 300, letterSpacing: 13, lineHeight: 1 }, 'FAMI-GB'),
        h(mono(16), 'SYSTEM // famigb-dev.com ── ONLINE'),
      ),
      h({ height: 6, borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, marginTop: 18 }),
      h({ marginTop: 44, alignSelf: 'flex-start', background: C.ink, color: C.ground, padding: '8px 18px', ...mono(20) }, label),
      h(
        {
          flexGrow: 1, flexDirection: 'column', justifyContent: 'center', gap: 28,
          borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, padding: '24px 0',
        },
        h({ fontSize: titleSize, fontWeight: titleWeight, lineHeight: 1.4, letterSpacing: titleSize * 0.04 }, title),
        h({ gap: 12, alignItems: 'center' }, ...meta.map((m, i) => h(i ? { background: C.tab, padding: '4px 12px', ...mono(18) } : mono(18), m))),
      ),
    ),
    h(
      { background: C.ink, color: C.ground, ...mono(18, { letterSpacing: 1 }) },
      h({ background: C.alert, color: C.onAlert, padding: '8px 18px', fontWeight: 500, letterSpacing: 2 }, 'NORMAL'),
      h({ padding: '8px 18px', flexGrow: 1 }, file),
      h({ padding: '8px 18px' }, 'Top'),
    ),
  );
}

export async function getStaticPaths() {
  const posts = await getPosts();
  const site: Card = {
    label: 'UNIT DATA',
    title: 'fami-gb',
    titleSize: 120,
    titleWeight: 300,
    meta: ['Backend Engineer / Vimmer / Univ. Student'],
    file: '~/index.md',
  };
  return [
    { params: { path: 'index' }, props: site },
    ...posts.map((p, n) => ({
      params: { path: `blog/${p.id}` },
      props: {
        label: `ARCHIVE // LOG-${String(posts.length - n).padStart(4, '0')}`,
        title: p.data.title,
        titleSize: p.data.title.length > 20 ? 52 : 60,
        titleWeight: 400,
        meta: [`RECORDED ${fmt(p.data.date)}`, ...p.data.tags],
        file: `archive/${p.id}.md`,
      } satisfies Card,
    })),
  ];
}

export async function GET({ props }: { props: Card }) {
  const node = card(props);
  const text = JSON.stringify(props) + 'FAMI-GBSYSTEM//famigb-dev.com──ONLINENORMALTop';
  const svg = await satori(node as never, { width: 1200, height: 630, fonts: await loadFonts(text) });
  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
