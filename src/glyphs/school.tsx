import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function SchoolGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph school-glyph"><svg className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<path d="M24 24C24 24 18 18 4 18V40C18 40 24 46 24 46C24 46 30 40 44 40V18C30 18 24 24 24 24Z" fill="white"/>
<path d="M4 12L24 6L44 12" stroke="white" strokeWidth="5.33333"/>
</svg></div></Glypher>);};