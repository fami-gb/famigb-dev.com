"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { MenuToggle } from "@/components/molecules/menu-toggle";
import { NavLink } from "@/components/molecules/nav-link";
import { Heading } from "@/components/atoms/typography";
import { Logo } from "@/components/atoms/logo";

export function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="p-4 bg-background text-foreground sticky top-0 z-40 border-b border-foreground/5 backdrop-blur-sm bg-background/80">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="font-bold text-xl hover:text-foreground/80 transition-colors flex items-center gap-2" aria-label="Home">
                    {/* <Logo className="w-8 h-8" /> */}
                    Top
                </Link>

                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <MenuToggle isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                    onClick={closeMenu}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-background text-foreground shadow-lg 
                             transform transition-transform duration-300 ease-in-out z-50 
                             ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6">
                    <Heading level={2} className="mb-6 !text-xl">Menu</Heading>
                    <ul className="space-y-4">
                        <NavLink href="/" onClick={closeMenu}>ホーム</NavLink>
                        <NavLink href="/blog" onClick={closeMenu}>ブログ記事一覧</NavLink>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
