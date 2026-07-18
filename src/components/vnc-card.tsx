"use client";

import { StudentInfoProvider } from "@/components/student-info-provider";
import { VncCardInner } from "@/components/vnc-card-inner";
import { VncCardProps } from "@/components/vnc-card-inner-utils";

export function VncCard({
    studentUsername,
    onClose,
    ...props
}: VncCardProps) {
    return (
        <StudentInfoProvider studentUsername={studentUsername}>
            <VncCardInner
                onClose={onClose}
                studentUsername={studentUsername}
                {...props}
            />
        </StudentInfoProvider>
    );
}

export function VncCardSkeleton() {
    const isFullscreen = false;

    return (
        <div>
            <div
                className={`${
                    isFullscreen ? "m-0" : "m-4"
                } pt-2 bg-secondary-dark rounded-xl shadow-2xl transition-all vnc-card w-[384px]`}
                data-is-expanded={false}
            >
                {
                    <div className="relative">
                        <div
                            className={`
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
                        className={`
                                bg-black
                                mx-auto
                                rounded-b-xl
                                shadow-inner
                                w-[384px]
                                h-[240px]
                                `}
                    >
                        <div className="animate-pulse bg-gray-700 h-full w-full rounded-b-xl" />
                    </div>
                </>
            </div>
        </div>
    );
}
