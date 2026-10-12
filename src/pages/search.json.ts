import { getPosts, getWorks, fmt } from '../utils';

export async function GET() {
  const posts = (await getPosts()).map((p) => ({
    title: p.data.title,
    url: `/blog/${p.id}/`,
    kind: 'ARCHIVE',
    date: fmt(p.data.date),
    text: [p.data.title, p.data.description, ...p.data.tags].join(' ').toLowerCase(),
  }));
  const works = (await getWorks()).map((w) => ({
    title: w.data.title,
    url: `/works/${w.id}/`,
    kind: 'UNITS',
    date: fmt(w.data.date),
    text: [w.data.title, w.data.description, ...w.data.stack].join(' ').toLowerCase(),
  }));
  return Response.json([...posts, ...works]);
}
