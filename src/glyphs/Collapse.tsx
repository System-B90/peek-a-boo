import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function CollapseGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Collapse-glyph">
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
                            className="glyph-stroke-path"
                            d="M 19 5 L 19 13 L 27 13 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 19 13 L 28 4 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 27 19 L 19 19 L 19 27 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 19 19 L 28 28 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 13 27 L 13 19 L 5 19 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 13 19 L 4 28 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 5 13 L 13 13 L 13 5 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            className="glyph-stroke-path"
                            d="M 13 13 L 4 4 "
                            transform="matrix(16,0,0,16,0,0)"
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
