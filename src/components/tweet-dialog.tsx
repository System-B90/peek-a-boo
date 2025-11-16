import TwitterGlyph from "@/glyphs/twitter";
import
{
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Tooltip,
} from "@mui/material";
import { useCallback, useState } from "react";
import SendIcon from '@mui/icons-material/Send';
import Image from "next/image";

type TweetDialogProps = {
    title: string;
    description?: string;
    imageSrc?: string;
    baseMessageText?: string;

    open: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
};

export default function TweetDialog({ title, description, imageSrc, baseMessageText, open, onClose, onSubmit }: TweetDialogProps)
{
    const [ text, setText ] = useState("");

    const handleSubmit = () =>
    {
        onSubmit(text);
        setText("");
    };

    const screenshotClickHandler = useCallback(() =>
    {
        if (!imageSrc) return;
        // Convert base64 to Blob
        const byteString = atob(imageSrc.split(",")[ 1 ]);
        const mimeString = imageSrc.split(",")[ 0 ].split(":")[ 1 ].split(";")[ 0 ];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++)
        {
            ia[ i ] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ ab ], { type: mimeString });
        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");
    }, [ imageSrc ]);

    return (
        <Dialog open={ open } onClose={ onClose } maxWidth="sm" fullWidth dir="rtl">
            <DialogTitle dir="rtl" className="flex flex-row items-center gap-2">
                <TwitterGlyph glyphTitle="" data-static="true" className="w-8 h-8" style={ { color: '#bb86fc' } } />
                { title }
            </DialogTitle>
            <DialogContent dir="rtl">
                <DialogContentText>
                    { description }
                </DialogContentText>
                <Box mt={ 2 } mb={ 2 }>
                    <Tooltip title="לחץ לפתיחת התמונה בחלון חדש" arrow placement="right">
                        <Image
                            className="cursor-pointer"
                            onClick={ screenshotClickHandler }
                            src={ imageSrc ?? "" }
                            alt="צילום מסך"
                            width={ 1920 }
                            height={ 1200 }
                            style={ { width: "100%", maxHeight: 200, objectFit: "contain" } }
                            unoptimized
                        />
                    </Tooltip>
                </Box>
                <Typography variant="subtitle1" className="mb-0 pb-0 mt-2 pt-2" fontStyle={ 'italic' }>
                    { baseMessageText }
                </Typography>
                <TextField
                    autoFocus
                    dir="rtl"
                    margin="dense"
                    label="פירוט (אופציונלי)"
                    type="text"
                    fullWidth
                    multiline
                    maxRows={ 4 }
                    value={ text }
                    className="mt-0 pt-0"
                    onChange={ (e) => setText(e.target.value) }
                />
            </DialogContent>
            <DialogActions dir="ltr" className="flex flex-row-reverse gap-x-1">
                <Button onClick={ onClose }>בטל</Button>
                <Button onClick={ handleSubmit } variant="contained" startIcon={ <SendIcon style={ { transform: 'rotateZ(180deg)' } } /> }>שלח</Button>
            </DialogActions>
        </Dialog>
    );
}
