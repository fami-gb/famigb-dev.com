import { useState, useEffect } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const targetTheme = userTheme === 'dark' || (!userTheme && systemPrefersDark) ? 'dark' : 'light';

        setTheme(targetTheme);

        if (targetTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    return { theme, toggleTheme, mounted };
}
