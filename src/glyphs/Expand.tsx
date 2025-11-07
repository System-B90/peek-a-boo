import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function ExpandGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph Expand-glyph"><svg xmlns="http://www.w3.org/2000/svg"  className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 512 512" version="1.1"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<g id="surface1">
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 27 13 L 27 5 L 19 5 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 27 5 L 18 14 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 19 27 L 27 27 L 27 19 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 27 27 L 18 18 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 5 19 L 5 27 L 13 27 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 5 27 L 14 18 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 13 5 L 5 5 L 5 13 " transform="matrix(16,0,0,16,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 5 5 L 14 14 " transform="matrix(16,0,0,16,0,0)"/>
</g>
</svg></div></Glypher>);};