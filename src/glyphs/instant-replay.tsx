import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

/**
 * A counter-clockwise arrow around a clock face: rewind the last few seconds.
 */
export function InstantReplayGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph InstantReplay-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    version="1.1"
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        fill="transparent"
                        height="100%"
                        stroke="none"
                        width="100%"
                    />
                    {/* Open circle, broken at the top-left for the arrow head */}
                    <path
                        d="M 14 20 A 24 24 0 1 1 8 32"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="4"
                    />
                    {/* Arrow head pointing backwards in time */}
                    <path
                        d="M 8 20 L 8 33 L 20 33 Z"
                        fill="currentColor"
                        stroke="none"
                    />
                    {/* Clock hands */}
                    <path
                        d="M 32 20 L 32 33 L 41 38"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                    />
                </svg>
            </div>
        </Glypher>
    );
}
