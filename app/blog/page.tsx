import { getAllPosts } from '@/lib/blog';
import { Metadata } from 'next';
import { BlogList } from '@/components/organisms/blog-list';
import { Heading, Text } from '@/components/atoms/typography';
import { Container } from '@/components/atoms/container';

export const metadata: Metadata = {
    title: 'Blog',
    description: '技術系の話や日常の些細なことについてよしなに書いていきます。',
    openGraph: {
        title: 'Blog | fami-gb\'s portfolio',
        description: '技術系の話や日常の些細なことについてよしなに書いていきます。',
    },
};

export default function BlogTop() {
    const posts = getAllPosts();

    return (
        <>
            <Container className="p-20 flex flex-col items-center gap-8 justify-center">
                <Heading level={1}>Blog</Heading>
                <Text>技術系の話や日常の些細なことについてよしなに書いていきます。</Text>
            </Container>
            <Container className="pb-20">
                <BlogList posts={posts} />
            </Container>
        </>
    )
}
