import { getCollection } from 'astro:content';

export const fmt = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '.');

const byDateDesc = <T extends { data: { date: Date } }>(a: T, b: T) => b.data.date.getTime() - a.data.date.getTime();

export const getPosts = async () => (await getCollection('blog')).sort(byDateDesc);
export const getWorks = async () => (await getCollection('works')).sort(byDateDesc);
