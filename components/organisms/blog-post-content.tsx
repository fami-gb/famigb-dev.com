import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { CustomComponents } from '@/components/mdx-components';

type BlogPostContentProps = {
    content: string;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
    return (
        <div className='prose prose-lg dark:prose-invert max-w-none'>
            <MDXRemote
                source={content}
                components={CustomComponents}
                options={{
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                    }
                }}
            />
        </div>
    );
}
