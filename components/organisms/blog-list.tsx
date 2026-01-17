import { BlogCard } from "@/components/molecules/blog-card";

type Post = {
    slug: string;
    title: string;
    date: string;
    [key: string]: any;
}

type BlogListProps = {
    posts: Post[];
}

export function BlogList({ posts }: BlogListProps) {
    return (
        <ul className="flex flex-col gap-4">
            {posts.map((post) => (
                <li key={post.slug}>
                    <BlogCard 
                        title={post.title}
                        date={post.date}
                        slug={post.slug}
                    />
                </li>
            ))}
        </ul>
    );
}
