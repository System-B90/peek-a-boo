import "@/glyphs/glyphs.css";
import { TooltipProps } from "@mui/material/Tooltip";

import { Glypher } from "@/glyphs/glypher";

export function SearchGlyph({
    glyphTitle,
    placement,
    ...props
}: {
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Glypher glyphTitle={glyphTitle} placement={placement} {...props}>
            <div className="svg-glyph search-glyph">
                <svg
                    className="min-h-full min-w-full max-h-full max-w-full w-full h-full"
                    fill="none"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        fill="transparent"
                        height="100%"
                        stroke="none"
                        width="100%"
                    />
                    <path d="M33 30L30 33L21 24V21H24L33 30Z" fill="#808080" />
                    <path
                        d="M13.5 4.5C11.1131 4.5 8.82387 5.44821 7.13604 7.13604C5.44821 8.82387 4.5 11.1131 4.5 13.5C4.5 15.8869 5.44821 18.1761 7.13604 19.864C8.82387 21.5518 11.1131 22.5 13.5 22.5C15.8869 22.5 18.1761 21.5518 19.864 19.864C21.5518 18.1761 22.5 15.8869 22.5 13.5C22.5 11.1131 21.5518 8.82387 19.864 7.13604C18.1761 5.44821 15.8869 4.5 13.5 4.5Z"
                        fill="transparent"
                        stroke="#808080"
                        strokeWidth="5.33333"
                    />
                    <path
                        d="M19.5 19.5L23.25 23.25L19.5 19.5Z"
                        fill="#808080"
                    />
                    <path
                        d="M19.5 19.5L23.25 23.25"
                        stroke="#808080"
                        strokeWidth="2.66667"
                    />
                </svg>
            </div>
        </Glypher>
    );
}
