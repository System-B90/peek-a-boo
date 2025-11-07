'use client'

import "@/style/globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { SnackbarProvider } from "notistack";
import { AllStudentInfoProvider } from "@/components/all-student-info-provider";
import { KnownTagsProvider } from "@/components/known-tags-provider";
import { ActiveStudentsProvider } from "@/components/active-students-provider";
import { CurrentTagsProvider } from "@/components/current-tags-provider";
import { ClassesProvider } from "@/components/classes-provider";
import MentorAccessBar from "@/components/mentor-access-bar";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <SnackbarProvider
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}>
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
        </SnackbarProvider >

    );
}
