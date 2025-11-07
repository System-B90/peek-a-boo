import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function ExternalLinkGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph ExternalLink-glyph"><svg xmlns="http://www.w3.org/2000/svg"  className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 64 64" version="1.1"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<g id="surface1">
<path style={{stroke:'none',fillRule:'nonzero',fill:'currentColor',fillOpacity:'1',}} d="M 42 32 L 42 50 L 14 50 L 14 22 L 32 22 L 36 18 L 10 18 L 10 54 L 46 54 L 46 28 Z "/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 18 6 L 26 6 L 26 14 " transform="matrix(2,0,0,2,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 26 6 L 12 20 " transform="matrix(2,0,0,2,0,0)"/>
</g>
</svg></div></Glypher>);};