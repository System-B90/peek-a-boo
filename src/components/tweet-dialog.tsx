import SendIcon from "@mui/icons-material/Send";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useCallback, useState } from "react";

import { TwitterGlyph } from "@/glyphs/twitter";

type TweetDialogProps = {
    title: string;
    description?: string;
    imageSrc?: string;
    baseMessageText?: string;

    open: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
};

export function TweetDialog({
    title,
    description,
    imageSrc,
    baseMessageText,
    open,
    onClose,
    onSubmit,
}: TweetDialogProps) {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        onSubmit(text);
        setText("");
    };

    const screenshotClickHandler = useCallback(() => {
        if (!imageSrc) return;
        // Convert base64 to Blob
        const byteString = atob(imageSrc.split(",")[1]);
        const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");
    }, [imageSrc]);

    return (
        <Dialog dir="rtl" fullWidth maxWidth="sm" onClose={onClose} open={open}>
            <DialogTitle className="flex flex-row items-center gap-2" dir="rtl">
                <TwitterGlyph
                    className="w-8 h-8"
                    data-static="true"
                    glyphTitle=""
                    style={{ color: "#bb86fc" }}
                />
                {title}
            </DialogTitle>
            <DialogContent dir="rtl">
                <DialogContentText>{description}</DialogContentText>
                <Box mb={2} mt={2}>
                    <Tooltip
                        arrow
                        placement="right"
                        title="לחץ לפתיחת התמונה בחלון חדש"
                    >
                        <Image
                            alt="צילום מסך"
                            className="cursor-pointer"
                            height={1200}
                            onClick={screenshotClickHandler}
                            src={imageSrc ?? ""}
                            style={{
                                width: "100%",
                                maxHeight: 200,
                                objectFit: "contain",
                            }}
                            unoptimized
                            width={1920}
                        />
                    </Tooltip>
                </Box>
                <Typography
                    className="mb-0 pb-0 mt-2 pt-2"
                    fontStyle={"italic"}
                    variant="subtitle1"
                >
                    {baseMessageText}
                </Typography>
                <TextField
                    autoFocus
                    className="mt-0 pt-0"
                    dir="rtl"
                    fullWidth
                    label="פירוט (אופציונלי)"
                    margin="dense"
                    maxRows={4}
                    multiline
                    onChange={(e) => setText(e.target.value)}
                    type="text"
                    value={text}
                />
            </DialogContent>
            <DialogActions className="flex flex-row-reverse gap-x-1" dir="ltr">
                <Button onClick={onClose}>בטל</Button>
                <Button
                    onClick={handleSubmit}
                    startIcon={
                        <SendIcon style={{ transform: "rotateZ(180deg)" }} />
                    }
                    variant="contained"
                >
                    שלח
                </Button>
            </DialogActions>
        </Dialog>
    );
}
