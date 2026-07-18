import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function Grid({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Grid-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    version="1.1"
                    viewBox="0 -5 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        fill="transparent"
                        height="100%"
                        stroke="none"
                        width="100%"
                    />
                    <g id="surface1">
                        <path
                            className="glyph-stroke-path"
                            d="M 4 8 L 7 8 L 7 11 L 4 11 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 11 8 L 14 8 L 14 11 L 11 11 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 18 8 L 21 8 L 21 11 L 18 11 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 25 8 L 28 8 L 28 11 L 25 11 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 4 15 L 7 15 L 7 18 L 4 18 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 11 15 L 14 15 L 14 18 L 11 18 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 18 15 L 21 15 L 21 18 L 18 18 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 25 15 L 28 15 L 28 18 L 25 18 Z "
                            transform="matrix(2,0,0,2,0,0)"
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
