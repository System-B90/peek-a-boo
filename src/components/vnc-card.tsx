"use client";

import { StudentInfoProvider } from "@/components/student-info-provider";
import VncCardInner from "@/components/vnc-card-inner";
import { VncCardProps } from "@/components/vnc-card-inner-utils";

export default function VncCard({
    studentUsername,
    onClose,
    ...props
}: VncCardProps)
{
    return (
        <StudentInfoProvider studentUsername={ studentUsername }>
            <VncCardInner
                studentUsername={ studentUsername }
                onClose={ onClose }
                { ...props }
            />
        </StudentInfoProvider>
    );
}

export function VncCardSkeleton()
{
    const isFullscreen = false;
    const scaleFactor = 0.2;
    const width = 1920 * scaleFactor;
    const height = 1200 * scaleFactor;

    return (
        <div>
            <div
                className={ `${isFullscreen ? "m-0" : "m-4"
                    } pt-2 bg-slate-800 rounded-xl shadow-2xl transition-all vnc-card` }
                style={ { width } }
                data-is-expanded={ false }
            >
                {
                    <div className="relative">
                        <div
                            className={ `
                                       absolute
                                       rounded-full 
                                       bg-[#cd6679] 
                                       aspect-square 
                                       w-[25px] 
                                       -left-[0.6rem] 
                                       -top-[0.8rem]
                                       flex 
                                       justify-center 
                                       items-center 
                                       cursor-pointer
                                       `}
                        >
                            X
                        </div>
                    </div>
                }
                <>
                    <div className="p-4 flex flex-row justify-between">
                        <div className="animate-pulse bg-gray-700 h-6 w-32 rounded-md" />
                        <div className="flex flex-row space-x-2">
                            <div className="animate-pulse bg-gray-700 h-6 w-6 rounded-full" />
                            <div className="animate-pulse bg-gray-700 h-6 w-6 rounded-full" />
                            <div className="animate-pulse bg-gray-700 h-6 w-6 rounded-full" />
                        </div>
                    </div>
                    <div
                        className={ `
                                bg-black 
                                mx-auto 
                                rounded-b-xl 
                                shadow-inner 
                                `}
                        style={ {
                            width,
                            height,
                        } }
                    >
                        <div className="animate-pulse bg-gray-700 h-full w-full rounded-b-xl" />
                    </div>
                </>
            </div>
        </div>
    );
}
