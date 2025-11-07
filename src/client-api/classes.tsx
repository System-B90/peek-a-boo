import { RawHiveClass } from "@/shared-api/types";
import { safeApiFetcher } from "./common-utils";

export async function queryHiveClasses() {
    return (await safeApiFetcher('/api/class')) as Array<RawHiveClass>;
}
