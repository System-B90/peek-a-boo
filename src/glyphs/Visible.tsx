import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function VisibleGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Visible-glyph">
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
                    <g id="surface1">
                        <path
                            d="M 38 30 C 38 33.3125 35.3125 36 32 36 C 28.6875 36 26 33.3125 26 30 C 26 26.6875 28.6875 24 32 24 C 35.3125 24 38 26.6875 38 30 Z "
                            style={{
                                stroke: "none",
                                fillRule: "nonzero",
                                fill: "currentColor",
                                fillOpacity: "1",
                            }}
                        />
                        <path
                            d="M 30 16 C 30 16 23.732422 23 16 23 C 8.267578 23 2 16 2 16 C 2 16 8.267578 9 16 9 C 23.732422 9 30 16 30 16 Z "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(2,0,0,2,0,0)"
                        />
                        <path
                            d="M 22.771484 10.738281 C 23.550781 11.972656 24 13.433594 24 15 C 24 19.417969 20.417969 23 16 23 C 11.582031 23 8 19.417969 8 15 C 8 13.513672 8.40625 12.121094 9.111328 10.927734 "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(2,0,0,2,0,0)"
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
