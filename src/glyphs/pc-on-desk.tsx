import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function PcOnDeskGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph pc-on-desk-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        fill="transparent"
                        height="100%"
                        stroke="none"
                        width="100%"
                    />
                    <path
                        d="M4 17L28 17M6 20L26 20M26 17L26 28M6 17L6 28M9 5H23V14H9zM14 17L14 14M18 17L18 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M17.3 10.3L14 7 14 11.8 15.1 10.8 15.7 12 16.4 11.6 15.9 10.5z"
                        fill="currentColor"
                    />
                </svg>
            </div>
        </Glypher>
    );
}
