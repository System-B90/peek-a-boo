"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function StudentAvatar({
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
} & React.HTMLAttributes<HTMLDivElement>)
{
    const [ errorState, setErrorState ] = useState(false);
    const [ loading, setLoading ] = useState(true);

    useMemo(() =>
    {
        setLoading(v => v && !errorState);
    }, [ setLoading, errorState ]);

    return (
        <div
            className={ `relative overflow-hidden ${className}` }
            style={ { width, height } }
            { ...props }
        >
            {/* Skeleton */ }
            { loading && (
                <div
                    className="absolute inset-0 animate-pulse bg-purple-300 dark:bg-purple-700"
                />
            ) }

            { errorState || <Image
                width={ width }
                height={ height }
                src={ src }
                alt={ alt }
                placeholder='blur'
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mOcl3u9noEIwDiqkL4KAcRKF9W5T5ozAAAAAElFTkSuQmCC"
                onLoad={ () => setLoading(false) }
                onError={ () => setErrorState(true) }
                className={ `transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}` }
                unoptimized={ true /** See NextJS bug https://github.com/vercel/next.js/commit/71d667253783d210fb045aef8e957bab0ddd8806 */ }
            /> }
        </div>
    );
}
