"use client";

import "@/style/globals.css";
import { ActiveStudentsProvider } from "@/components/active-students-provider";
import { AllStudentInfoProvider } from "@/components/all-student-info-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ClassesProvider } from "@/components/classes-provider";
import { CurrentTagsProvider } from "@/components/current-tags-provider";
import { KnownTagsProvider } from "@/components/known-tags-provider";
import { MentorAccessBar } from "@/components/mentor-access-bar";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthProvider>
            <AllStudentInfoProvider>
                <MentorAccessBar />
                <ClassesProvider>
                    <KnownTagsProvider>
                        <ActiveStudentsProvider>
                            <CurrentTagsProvider>
                                {children}
                            </CurrentTagsProvider>
                        </ActiveStudentsProvider>
                    </KnownTagsProvider>
                </ClassesProvider>
            </AllStudentInfoProvider>
        </AuthProvider>
    );
}
