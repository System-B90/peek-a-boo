"use client";

import { StudentInfoProvider } from "@/components/student-info-provider";
import VncCardInner from "@/components/vnc-card-inner";
import { VncCardProps } from "@/components/vnc-card-inner-utils";

export default function VncCard({
    studentNumber,
    onClose,
    ...props
}: VncCardProps) {
    return (
        <StudentInfoProvider studentNumber={studentNumber}>
            <VncCardInner
                studentNumber={studentNumber}
                onClose={onClose}
                {...props}
            />
        </StudentInfoProvider>
    );
}
