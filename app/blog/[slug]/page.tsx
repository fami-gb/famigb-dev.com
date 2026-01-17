import { getBlogData } from '@/lib/blog';
import { Metadata } from 'next';
import { BlogPostHeader } from '@/components/organisms/blog-post-header';
import { BlogPostContent } from '@/components/organisms/blog-post-content';
import { Container } from '@/components/atoms/container';
import { SocialLinks } from '@/components/molecules/social-links';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const { frontmatter } = await getBlogData(slug);

    return {
        title: frontmatter.title,
        description: frontmatter.description || `${frontmatter.title}についての記事です。`,
        openGraph: {
            title: frontmatter.title,
            description: frontmatter.description || `${frontmatter.title}についての記事です。`,
            type: 'article',
            publishedTime: frontmatter.date,
        },
    };
}

export default async function BlogPost({ params }: Props) {
    const { slug } = await params;
    const { content, frontmatter } = await getBlogData(slug);

    return (
        <Container className="py-8">
            <article>
                <BlogPostHeader 
                    title={frontmatter.title}
                    date={frontmatter.date}
                />
                
                {/* ここにリスト形式でタグを表示させる */}
                <BlogPostContent content={content} />
                <SocialLinks className="justify-center mt-8" />
                {/* TODO: ページネーションの実装 */}
            </article>
        </Container>
    )
}
