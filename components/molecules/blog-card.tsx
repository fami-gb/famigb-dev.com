import Link from "next/link";
import { Heading, Text } from "@/components/atoms/typography";
import { Time } from "@/components/atoms/time";

type BlogCardProps = {
    title: string;
    description?: string; // いずれ使う
    date: string;
    slug: string;
}

export function BlogCard({ title, date, slug }: BlogCardProps) {
    return (
        <Link href={`/blog/${slug}`} className="block p-6 border rounded-lg hover:bg-foreground/5 transition group">
            <div className="flex flex-col gap-2">
                <Heading level={3} className="group-hover:text-primary transition-colors">
                    {title}
                </Heading>
                <Time date={date} />
            </div>
        </Link>
    );
}
