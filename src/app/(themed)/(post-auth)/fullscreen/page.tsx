'use client';

import ClientOnly from "@/app/(themed)/(post-auth)/client-only";
import { useAuth } from "@/components/auth-provider";
import VncCard from "@/components/vnc-card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Fullscreen()
{
    const searchParams = useSearchParams();
    const { clientEnvConfig } = useAuth();
    const [ studentNumber, setStudentNumber ] = useState<number>(parseInt(searchParams.get('id') ?? '0'));

    useEffect(() =>
    {
        if (searchParams.get('hostname'))
        {
            setStudentNumber(studentHostnameDestructor(clientEnvConfig, searchParams.get('hostname') ?? ''));
        } else if (searchParams.get('username'))
        {
            setStudentNumber(parseInt(searchParams.get('username') ?? '0'));
        }
    }, [ searchParams, clientEnvConfig, setStudentNumber ]);

    return (
        <div className="w-screen h-screen m-0 p-0 flex flex-row content-center justify-center">
            <ClientOnly>
                <VncCard studentUsername={ studentUsername } isFullscreen={ true } />
            </ClientOnly>
        </div>
    );
}
