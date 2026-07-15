import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function InvisibleGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph Invisible-glyph">
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
                            d="M 3 3 L 29 29 "
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
                            d="M 35.144531 43.628906 C 34.132813 43.863281 33.082031 44 32 44 C 24.28125 44 18 37.71875 18 30 C 18 28.9375 18.144531 27.890625 18.378906 26.867188 L 13.355469 21.839844 C 6.945313 25.785156 2.808594 30.328125 2.511719 30.664063 L 1.316406 32 L 2.511719 33.335938 C 3.027344 33.910156 14.855469 46.878906 30.121094 47.898438 C 30.738281 47.964844 31.367188 48 32 48 C 32.632813 48 33.261719 47.964844 33.878906 47.898438 C 35.523438 47.789063 37.121094 47.519531 38.679688 47.160156 Z M 6.804688 31.996094 C 8.300781 30.550781 11.003906 28.148438 14.511719 25.871094 C 14.191406 27.21875 14 28.601563 14 30 C 14 33.472656 15.007813 36.707031 16.714844 39.460938 C 12.136719 36.839844 8.601563 33.730469 6.804688 31.996094 Z "
                            style={{
                                stroke: "none",
                                fillRule: "nonzero",
                                fill: "currentColor",
                                fillOpacity: "1",
                            }}
                        />
                        <path
                            d="M 32 24 C 29.050781 24 26.613281 26.132813 26.109375 28.9375 L 33.066406 35.894531 C 35.867188 35.386719 38 32.949219 38 30 C 38 26.6875 35.3125 24 32 24 Z "
                            style={{
                                stroke: "none",
                                fillRule: "nonzero",
                                fill: "currentColor",
                                fillOpacity: "1",
                            }}
                        />
                        <path
                            d="M 61.488281 30.664063 C 60.953125 30.066406 48.171875 16 32 16 C 26.484375 16 21.378906 17.648438 17.003906 19.832031 L 20.007813 22.835938 C 23.621094 21.179688 27.703125 20 32 20 C 36.300781 20 40.390625 21.1875 44.019531 22.851563 C 45.304688 25.011719 46 27.46875 46 30 C 46 35.097656 43.253906 39.550781 39.171875 42 L 43.027344 45.855469 C 53.632813 41.921875 61.085938 33.785156 61.488281 33.335938 L 62.683594 32 Z M 47.273438 39.476563 C 48.988281 36.722656 50 33.480469 50 30 C 50 28.601563 49.800781 27.222656 49.480469 25.878906 C 52.988281 28.15625 55.695313 30.558594 57.195313 32.003906 C 55.398438 33.738281 51.859375 36.855469 47.273438 39.476563 Z "
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
