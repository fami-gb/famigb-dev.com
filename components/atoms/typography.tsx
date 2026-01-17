import { ReactNode } from "react";

type HeadingProps = {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    children: ReactNode;
    className?: string;
}

type TextProps = {
    children: ReactNode;
    className?: string;
    as?: "p" | "span" | "div";
}

export function Heading({ level = 1, children, className = "" }: HeadingProps) {
    const Tag = `h${level}` as const;
    const baseStyles = "font-bold text-foreground";
    const sizeStyles = {
        1: "text-3xl md:text-4xl",
        2: "text-2xl md:text-3xl",
        3: "text-xl md:text-2xl",
        4: "text-lg md:text-xl",
        5: "text-base md:text-lg",
        6: "text-sm md:text-base",
    };

    return (
        <Tag className={`${baseStyles} ${sizeStyles[level]} ${className}`}>
            {children}
        </Tag>
    );
}

export function Text({ children, className = "", as = "p" }: TextProps) {
    const Tag = as;
    return (
        <Tag className={`text-foreground/80 leading-relaxed mb-4 last:mb-0 ${className}`}>
            {children}
        </Tag>
    );
}
