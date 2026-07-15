import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function MenuGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph menu-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    fill="none"
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        fill="transparent"
                        height="100%"
                        stroke="none"
                        width="100%"
                    />
                    <path
                        d="M5.33333 32H58.6667M5.33333 16H58.6667M5.33333 48H58.6667"
                        stroke="white"
                        strokeWidth="5.33333"
                    />
                </svg>
            </div>
        </Glypher>
    );
}
