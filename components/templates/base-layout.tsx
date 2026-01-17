import { ReactNode } from "react";
import { Header } from "@/components/organisms/header";

type BaseLayoutProps = {
    children: ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}
