type TimeProps = {
    date: string;
    className?: string;
}

export function Time({ date, className = "" }: TimeProps) {
    return (
        <time dateTime={date} className={`text-sm text-foreground/60 font-medium ${className}`}>
            {date}
        </time>
    );
}
