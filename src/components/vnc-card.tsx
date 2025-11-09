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
