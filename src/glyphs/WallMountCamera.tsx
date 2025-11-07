import "./glyphs.css"
import { TooltipProps } from "@mui/material";
import Glypher from "./glypher"
export default function WallMountCameraGlyph({glyphTitle, placement, ...props} : {glyphTitle: string, placement?: TooltipProps[ "placement" ]} & React.HTMLAttributes<HTMLDivElement>){return(<Glypher glyphTitle={glyphTitle} placement={placement} { ...props }><div className="svg-glyph WallMountCamera-glyph"><svg xmlns="http://www.w3.org/2000/svg"  className="min-h-full min-w-full max-h-full max-w-full w-full h-full" viewBox="0 0 64 64" version="1.1"><rect fill="transparent" stroke="none" width="100%" height="100%" />
<g id="surface1">
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 21 17.167969 L 21 25 L 29 25 " transform="matrix(2,0,0,2,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 24.087891 6.970703 L 27.625 14.146484 L 11.830078 21.904297 L 8.292969 14.728516 Z " transform="matrix(2,0,0,2,0,0)"/>
<path style={{fill:'none',strokeWidth:'2',strokeLinecap:'butt',strokeLinejoin:'miter',stroke:'currentColor',strokeOpacity:'1',strokeMiterlimit:'10',}} d="M 9.40625 17 L 10.5 19.34375 L 7.445313 23.556641 L 6.548828 23.998047 L 3.353516 17.509766 L 4.25 17 Z " transform="matrix(2,0,0,2,0,0)"/>
</g>
</svg></div></Glypher>);};