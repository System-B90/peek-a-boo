"use client";
import { redirect } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { ACTIVATE_ALL_QUERY_PARAM } from "@/components/query-params-provider";

export default function Page() {
    const { username } = useAuth();
    if (!username) {
        return <></>;
    }
    redirect(`/?filter=${username}&${ACTIVATE_ALL_QUERY_PARAM}=true`);
}
