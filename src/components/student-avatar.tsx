"use client";

import Image from "next/image";
import { useState } from "react";

export function StudentAvatar({
    src,
    alt,
    className,
    width,
    height,
    ...props
}: {
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
} & React.HTMLAttributes<HTMLDivElement>) {
    const [errorState, setErrorState] = useState(false);
    const [loading, setLoading] = useState(true);
    const showSkeleton = loading && !errorState;

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            {...props}
        >
            {/* Skeleton */}
            {showSkeleton ? <div className="absolute inset-0 animate-pulse bg-purple-300 dark:bg-purple-700" /> : null}

            {errorState || (
                <Image
                    alt={alt}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mOcl3u9noEIwDiqkL4KAcRKF9W5T5ozAAAAAElFTkSuQmCC"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${showSkeleton ? "opacity-0" : "opacity-100"}`}
                    height={height}
                    onError={() => setErrorState(true)}
                    onLoad={() => setLoading(false)}
                    placeholder="blur"
                    src={src}
                    unoptimized={
                        true /** See NextJS bug https://github.com/vercel/next.js/commit/71d667253783d210fb045aef8e957bab0ddd8806 */
                    }
                    width={width}
                />
            )}
        </div>
    );
}
