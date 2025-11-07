import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function RecurringAppointmentExceptionGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph RecurringAppointmentException-glyph"><svg xmlns="http://www.w3.org/2000/svg"  className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 512 512" version="1.1"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<g id="surface1">
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 20 11 L 27 11 L 27 4 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 28 16 C 28 22.626953 22.626953 28 16 28 C 9.373047 28 4 22.626953 4 16 C 4 9.373047 9.373047 4 16 4 C 20.843994 4 25.018066 6.871094 26.914063 11.003906 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{stroke:'none',fillRule:'nonzero',fill:'currentColor',fillOpacity:'1',}} d="M 240 144 L 272 144 L 272 304 L 240 304 Z "/>
<path style={{stroke:'none',fillRule:'nonzero',fill:'currentColor',fillOpacity:'1',}} d="M 240 336 L 272 336 L 272 368 L 240 368 Z "/>
</g>
</svg></div></Glypher>);};