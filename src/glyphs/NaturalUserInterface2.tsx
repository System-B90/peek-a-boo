import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function NaturalUserInterface2Glyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph NaturalUserInterface2-glyph">
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
                            d="M 10.005859 20 L 10.003906 16 "
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
                            d="M 18 15 L 18 14 C 18 12.894531 18.894531 12 20 12 C 21.105469 12 22 12.894531 22 14 L 22 16 "
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
                            d="M 14 15 L 14 13 C 14 11.894531 14.894531 11 16 11 C 17.105469 11 18 11.894531 18 13 L 18 16 "
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
                            d="M 22 15 C 22 13.894531 22.894531 13 24 13 C 25.105469 13 26 13.894531 26 15 L 26.003906 22 C 26.003906 25.314453 23.316406 28 20.003906 28 L 14.71875 28 C 12.992188 28 11.349609 27.257813 10.210938 25.960938 L 7.839844 23.261719 C 6.773438 22.048828 6.716797 20.248047 7.705078 18.970703 L 10.003906 16 L 10.003906 7 C 10.003906 5.894531 10.898438 5 12.003906 5 C 13.107422 5 14 5.792969 14 7 L 14.003906 16 "
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
                            d="M 23.992188 6 C 19.574219 6 15.992188 9.582031 15.992188 14 C 15.992188 17.722656 18.550781 20.824219 21.992188 21.71875 L 21.992188 14 C 21.992188 12.898438 22.894531 12 23.992188 12 C 25.09375 12 25.992188 12.898438 25.992188 14 L 25.992188 21.71875 C 29.4375 20.824219 31.992188 17.722656 31.992188 14 C 31.992188 9.582031 28.410156 6 23.992188 6 Z "
                            style={{
                                stroke: "none",
                                fillRule: "nonzero",
                                fill: "currentColor",
                                fillOpacity: "1",
                            }}
                        />
                    </g>
                </svg>
            </div>
        </Glypher>
    );
}
