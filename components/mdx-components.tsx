import Image from 'next/image';
import { type ComponentPropsWithoutRef, isValidElement } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CustomComponents = {
    h1: (props: ComponentPropsWithoutRef<'h1'>) => (
        <h1 className="text-lg md:text-xl font-bold mt-8 mb-4 text-foreground border-b-2 border-foreground/20 pb-2" {...props} />
    ),
    h2: (props: ComponentPropsWithoutRef<'h2'>) => (
        <h2 className="relative text-base md:text-lg font-bold mt-10 mb-4 text-foreground pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:bg-foreground/20 before:rounded-full" {...props} />
    ),
    h3: (props: ComponentPropsWithoutRef<'h3'>) => (
        <h3 className="text-sm md:text-base font-semibold mt-6 mb-3 text-foreground/90" {...props} />
    ),
    h4: (props: ComponentPropsWithoutRef<'h4'>) => (
        <h4 className="text-xs md:text-sm font-semibold mt-4 mb-2 text-foreground/80" {...props} />
    ),
    h5: (props: ComponentPropsWithoutRef<'h5'>) => (
        <h5 className="text-[10px] md:text-xs font-semibold mt-4 mb-2 text-foreground/80" {...props} />
    ),
    h6: (props: ComponentPropsWithoutRef<'h6'>) => (
        <h6 className="text-[9px] md:text-[10px] font-semibold mt-4 mb-2 text-foreground/70" {...props} />
    ),
    p: (props: ComponentPropsWithoutRef<'p'>) => (
        <p className="text-base leading-8 mb-6 text-foreground/80" {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<'ul'>) => (
        <ul className="list-disc list-inside mb-4 space-y-2 ml-4 text-foreground/80" {...props} />
    ),
    ol: (props: ComponentPropsWithoutRef<'ol'>) => (
        <ol className="list-decimal list-inside mb-4 space-y-2 ml-4 text-foreground/80" {...props} />
    ),
    li: (props: ComponentPropsWithoutRef<'li'>) => (
        <li className="text-foreground/80 leading-7" {...props} />
    ),
    blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
        <blockquote className="border-l-4 border-foreground/30 pl-4 py-2 my-4 italic bg-foreground/5 text-foreground/80" {...props} />
    ),
    pre: ({ children }: ComponentPropsWithoutRef<'pre'>) => {
        if (!isValidElement(children)) {
            return <pre>{children}</pre>;
        }

        const childProps = children.props as ComponentPropsWithoutRef<'code'>;
        const { className, children: codeContent } = childProps;
        const match = /language-([\w\d]+)(?::(.+))?/.exec(className || '');
        
        const language = match ? match[1] : 'text';
        const fileName = match ? match[2] : undefined;

        return (
            <figure className="my-6">
                {fileName && (
                    <figcaption className="bg-foreground/10 text-foreground text-xs font-mono px-4 py-2 rounded-t-lg border-b border-foreground/10 inline-block">
                        {fileName}
                    </figcaption>
                )}
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    className={`rounded-lg shadow-lg !mt-0 overflow-x-auto border border-foreground/20 text-sm font-mono ${fileName ? 'rounded-tl-none' : ''}`}
                >
                    {String(codeContent).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </figure>
        );
    },
    code: (props: ComponentPropsWithoutRef<'code'>) => (
        <code className="bg-foreground/10 px-2 py-1 rounded text-sm font-mono text-foreground" {...props} />
    ),
    a: (props: ComponentPropsWithoutRef<'a'>) => (
        <a className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 transition-colors" {...props} />
    ),
    table: (props: ComponentPropsWithoutRef<'table'>) => (
        <div className="overflow-x-auto w-full mb-6">
            <table className="min-w-full border-collapse border border-foreground/20 mb-0" {...props} />
        </div>
    ),
    thead: (props: ComponentPropsWithoutRef<'thead'>) => (
        <thead className="bg-foreground/5" {...props} />
    ),
    tbody: (props: ComponentPropsWithoutRef<'tbody'>) => (
        <tbody className="divide-y divide-foreground/10" {...props} />
    ),
    tr: (props: ComponentPropsWithoutRef<'tr'>) => (
        <tr className="hover:bg-foreground/5 transition-colors" {...props} />
    ),
    th: (props: ComponentPropsWithoutRef<'th'>) => (
        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border border-foreground/20" {...props} />
    ),
    td: (props: ComponentPropsWithoutRef<'td'>) => (
        <td className="px-4 py-3 text-sm text-foreground/80 border border-foreground/20" {...props} />
    ),
    hr: (props: ComponentPropsWithoutRef<'hr'>) => (
        <hr className="my-8 border-t-2 border-foreground/10" {...props} />
    ),
    img: (props: ComponentPropsWithoutRef<'img'>) => {
        const src = props.src as string | undefined;
        const isMp4 = src?.endsWith('.mp4');
        const isGif = src?.endsWith('.gif');

        if (isMp4) {
            return (
                <span className="block my-4">
                    <video
                        src={src}
                        controls
                        muted
                        loop
                        className="rounded-lg shadow-lg max-w-full max-h-[500px] w-auto h-auto mx-auto block"
                    />
                </span>
            );
        }
        return (
            <figure className="my-8">
                <Image
                    src={src || ''}
                    alt={props.alt || ''}
                    width={800}
                    height={600}
                    className={`rounded-lg shadow-lg ${isGif ? 'max-w-full max-h-[500px] w-auto h-auto mx-auto block' : 'w-full h-auto'}`}
                    unoptimized={isGif}
                />
                {props.alt && (
                    <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {props.alt}
                    </figcaption>
                )}
            </figure>
        );
    },
};
