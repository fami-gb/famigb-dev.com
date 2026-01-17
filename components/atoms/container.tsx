import { ReactNode } from "react";

type ContainerProps = {
    children: ReactNode;
    className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
    return (
        <div className={`max-w-4xl mx-auto px-4 ${className}`}>
            {children}
        </div>
    );
}
