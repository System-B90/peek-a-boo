"use client";

import { useCallback } from "react";
import VncCard, { VncCardSkeleton } from "./vnc-card";
import { useQueryParams } from "@/components/query-params-provider";
import { useActiveStudents } from "@/components/active-students-provider";


export default function VncGrid()
{
    const { activeStudents } = useActiveStudents();
    const { removeActive, initialized: queryParamsInitialized } = useQueryParams();

    const onClose = useCallback((username: string) => removeActive(username), [ removeActive ]);

    const vncCards = queryParamsInitialized ? [ ...activeStudents ].map((username) => (
        <VncCard key={ `vnc-card-${username}` } studentUsername={ username } onClose={ onClose } />
    )) : (
        [ ...Array(3).keys() ].map((i) => (<VncCardSkeleton key={ `vnc-card-skeleton-${i}` } />))
    );

    if (vncCards.length === 0 && queryParamsInitialized)
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
