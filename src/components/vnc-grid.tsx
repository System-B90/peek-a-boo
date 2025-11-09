"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import VncCard from "./vnc-card";

export interface Props
{
    activeUsers: Set<string>;
    setActiveStudents: Dispatch<SetStateAction<Set<string>>>;
}

export default function VncGrid({ activeUsers, setActiveStudents }
    : Props
)
{
    const onClose = useCallback((username: string) =>
    {
        setActiveStudents(new Set([ ...activeUsers ].filter((s) => s !== username)));
    }, [ setActiveStudents, activeUsers ]);

    const vncCards = [ ...activeUsers ].map((username) => (
        <VncCard key={ `vnc-card-${username}` } studentUsername={ username } onClose={ onClose } />
    ));

    if (vncCards.length === 0)
    {
        return (
            <div className="flex-5 h-screen">
                <div className="flex flex-col space-y-5 flex-wrap justify-center items-center h-screen">
                    <span className="text-6xl">No active students!</span>
                    <span className="text-2xl">
                        Select one from the list on the left to begin peeking (～￣▽￣)～
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-5 overflow-y-scroll h-screen">
            <div className="flex flex-row flex-wrap justify-center ">{ vncCards }</div>
        </div>
    );
}
