import { GithubIcon, XIcon } from "@/components/atoms/icons";

export function SocialLinks({ className = "" }: { className?: string }) {
    return (
        <div className={`flex gap-4 ${className}`}>
            <a
                href="https://x.com/fami_gb1618"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="X (Twitter)"
            >
                <XIcon />
            </a>
            <a
                href="https://github.com/fami-gb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="GitHub"
            >
                <GithubIcon />
            </a>
        </div>
    );
}
