import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function CheckAllGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph check-all-glyph"><svg className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<path d="M12 40V44H40C42.21 44 44 42.21 44 40V12H40V40H12Z" fill="white"/>
<path d="M32 4H8C5.79 4 4 5.79 4 8V32C4 34.21 5.79 36 8 36H32C34.21 36 36 34.21 36 32V8C36 5.79 34.21 4 32 4ZM18 26.828L10 18.828L12.828 16L18 21.172L27.172 12L30 14.828L18 26.828Z" fill="white"/>
</svg></div></Glypher>);};