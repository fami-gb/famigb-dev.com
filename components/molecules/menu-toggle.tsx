"use client";

type MenuToggleProps = {
    isOpen: boolean;
    onToggle: () => void;
}

export function MenuToggle({ isOpen, onToggle }: MenuToggleProps) {
    return (
        <button 
            onClick={onToggle}
            className="flex flex-col justify-center items-center w-8 h-8 space-y-1.5 z-50 p-1"
            aria-label="メニュー"
        >
            <span className={`block w-6 h-0.5 bg-current transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-current transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-current transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
    );
}
