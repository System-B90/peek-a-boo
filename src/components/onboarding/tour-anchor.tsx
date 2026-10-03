"use client";
import { useTourAnchor } from "@system-b90/onboarding";
import { ReactNode } from "react";

/** Marks its children as the target of tour steps with this anchor id. */
export function TourAnchor({
    id,
    children,
    className,
}: {
    id: string;
    children: ReactNode;
    className?: string;
}) {
    const ref = useTourAnchor<HTMLDivElement>(id);

    return (
        <div className={className} data-tour-anchor={id} ref={ref}>
            {children}
        </div>
    );
}
