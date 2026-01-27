import { safeApiFetcher } from "@/client-api/common-utils";
import { AuthSystem } from "@/shared-api/types";

export async function getAuthSystem()
{
    return (await safeApiFetcher('/api/env/auth-system')) as AuthSystem;
}
