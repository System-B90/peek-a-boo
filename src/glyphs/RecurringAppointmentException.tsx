import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function RecurringAppointmentExceptionGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph RecurringAppointmentException-glyph">
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
                            d="M 20 11 L 27 11 L 27 4 "
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
                            d="M 28 16 C 28 22.626953 22.626953 28 16 28 C 9.373047 28 4 22.626953 4 16 C 4 9.373047 9.373047 4 16 4 C 20.843994 4 25.018066 6.871094 26.914063 11.003906 "
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
                            d="M 240 144 L 272 144 L 272 304 L 240 304 Z "
                            style={{
                                stroke: "none",
                                fillRule: "nonzero",
                                fill: "currentColor",
                                fillOpacity: "1",
                            }}
                        />
                        <path
                            d="M 240 336 L 272 336 L 272 368 L 240 368 Z "
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
