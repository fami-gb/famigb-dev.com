import Image, { ImageProps } from "next/image";

type AvatarProps = Omit<ImageProps, "className"> & {
    className?: string;
}

export function Avatar({ alt, className = "", ...props }: AvatarProps) {
    return (
        <Image
            alt={alt}
            className={`rounded-full shadow-lg ${className}`}
            {...props}
        />
    );
}
