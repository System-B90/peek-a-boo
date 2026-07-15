import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function OnlineGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Online-glyph">
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
                            d="M 18 16 C 18 17.104492 17.104492 18 16 18 C 14.895508 18 14 17.104492 14 16 C 14 14.895508 14.895508 14 16 14 C 17.104492 14 18 14.895508 18 16 Z "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 21.656982 10.343018 C 24.781006 13.467041 24.781006 18.532959 21.656982 21.656982 "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 10.343018 21.656982 C 7.218994 18.532959 7.218994 13.467041 10.343018 10.343018 "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 25.898926 6.101074 C 31.365967 11.568115 31.365967 20.433105 25.898926 25.899902 "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(16,0,0,16,0,0)"
                        />
                        <path
                            d="M 6.101074 25.898926 C 0.634033 20.431885 0.634033 11.566895 6.101074 6.100098 "
                            style={{
                                fill: "none",
                                strokeWidth: "2",
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                stroke: "currentColor",
                                strokeOpacity: "1",
                                strokeMiterlimit: "10",
                            }}
                            transform="matrix(16,0,0,16,0,0)"
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
