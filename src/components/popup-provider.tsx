'use client';
import '@/style/popup.css';
import { Typography } from '@mui/material';

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type PopupContext = {
    default: boolean;
    showPopup: (x: React.ReactNode) => void;
};

const PopupContextProvider = createContext<PopupContext>({
    default: true,
    showPopup: () => { },
});

export const PopupProvider = ({ children }: { children: React.ReactNode; }) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [popupText, setPopupText] = useState<React.ReactNode>(undefined);

    const keyDownCallback = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setVisible(false);
        }
    }, [setVisible]);

    useEffect(() => {
        document.addEventListener('keydown', keyDownCallback);

        return () => {
            document.removeEventListener('keydown', keyDownCallback);
        };
    }, [keyDownCallback]);

    const showPopup = useCallback((text: React.ReactNode): void => {
        setPopupText(text);
        setVisible(true);
    }, [setPopupText, setVisible]);

    return (
        <PopupContextProvider.Provider value={{
            default: false,
            showPopup
        }}>
            <div className="relative w-full h-full">
                <div className="notification-box" hidden={!visible} data-hidden={!visible} aria-disabled={!visible}>
                    <div className='inner-box rtl' dir='rtl'>
                        {/* <CloseButton className='close-button' onClick={() => setVisible(false)} /> */}
                        <Typography variant='h4' className='rtl'>
                            {popupText}
                        </Typography>
                    </div>
                </div>
                {children}
            </div>
        </PopupContextProvider.Provider>
    );
};

export const usePopup = () => useContext(PopupContextProvider);
