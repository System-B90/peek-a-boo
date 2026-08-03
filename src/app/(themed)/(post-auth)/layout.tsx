"use client";

import "@/style/globals.css";
import { ActiveStudentsProvider } from "@/components/active-students-provider";
import { AllStudentInfoProvider } from "@/components/all-student-info-provider";
import { PeekABooCommandPalette } from "@/components/app-commands/PeekABooCommandPalette";
import { StudentCommands } from "@/components/app-commands/StudentCommands";
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
            {/*
              The palette sits above MentorAccessBar so the access bar's button
              can reach its context, which puts it above the student providers
              too — hence StudentCommands lower down rather than inside it.
            */}
            <PeekABooCommandPalette>
                <AllStudentInfoProvider>
                    <MentorAccessBar />
                    <ClassesProvider>
                        <KnownTagsProvider>
                            <ActiveStudentsProvider>
                                <CurrentTagsProvider>
                                    <StudentCommands />
                                    {children}
                                </CurrentTagsProvider>
                            </ActiveStudentsProvider>
                        </KnownTagsProvider>
                    </ClassesProvider>
                </AllStudentInfoProvider>
            </PeekABooCommandPalette>
        </AuthProvider>
    );
}
