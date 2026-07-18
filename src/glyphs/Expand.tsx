import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function ExpandGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Expand-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    version="1.1"
                    viewBox="0 0 512 512"
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
                            d="M 27 13 L 27 5 L 19 5 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 27 5 L 18 14 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 19 27 L 27 27 L 27 19 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 27 27 L 18 18 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 5 19 L 5 27 L 13 27 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 5 27 L 14 18 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 13 5 L 5 5 L 5 13 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 5 5 L 14 14 "
                            className="glyph-stroke-path"
                            transform="matrix(16,0,0,16,0,0)"
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
