"use client";
import Tooltip from "@mui/material/Tooltip";
import { TooltipProps } from "@mui/material/Tooltip";
import React, { KeyboardEvent, useCallback } from "react";

import { KeyboardNavigation } from "@/components/keyboard-navigation";

export function Glypher({
    children,
    glyphTitle,
    placement,
    className,
    onClick,
    tabIndex,
    ...props
}: {
    children: TooltipProps["children"];
    glyphTitle: string;
    placement?: TooltipProps["placement"];
} & React.HTMLAttributes<HTMLDivElement>) {
    const keyDownHandler = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (typeof onClick === "undefined") {
                return;
            }
            if (KeyboardNavigation.isClick(event)) {
                event.preventDefault();
                event.stopPropagation();

                // Simulate a mouse click by calling onClick with a MouseEvent
                const mouseEvent =
                    KeyboardNavigation.keyboardToMouseClickEvent(event);
                onClick(mouseEvent);
            }
        },
        [onClick],
    );

    return (
        <div
            {...props}
            className={`flex flex-row items-center justify-center ${className ?? ""}`}
            onClick={onClick}
            onKeyDown={keyDownHandler}
            tabIndex={
                tabIndex !== undefined
                    ? tabIndex
                    : typeof onClick !== "undefined"
                        ? 0
                        : -1
            }
        >
            <Tooltip placement={placement} title={glyphTitle}>
                {children}
            </Tooltip>
        </div>
    );
}
