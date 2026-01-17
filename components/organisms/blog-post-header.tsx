import { Heading } from "@/components/atoms/typography";
import { Time } from "@/components/atoms/time";

type BlogPostHeaderProps = {
    title: string;
    date: string;
}

export function BlogPostHeader({ title, date }: BlogPostHeaderProps) {
    return (
        <header className="mb-12 border-b border-foreground/10 pb-8">
            <Heading level={1} className="mb-4 leading-tight">
                {title}
            </Heading>
            <Time date={date} />
        </header>
    );
}
