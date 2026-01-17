import Link from "next/link";

type NavLinkProps = {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
}

export function NavLink({ href, children, onClick }: NavLinkProps) {
    return (
        <li>
            <Link 
                href={href} 
                className="block hover:text-foreground/60 transition-colors text-lg font-medium"
                onClick={onClick}
            >
                {children}
            </Link>
        </li>
    );
}
