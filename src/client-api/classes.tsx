import { safeApiFetcher } from "@/client-api/common-utils";
import { RawHiveClass } from "@/shared-api/types";

export async function queryHiveClasses() {
    return (await safeApiFetcher("/api/class")) as Array<RawHiveClass>;
}
