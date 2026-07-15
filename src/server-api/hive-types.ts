export enum Clearance {
    Logged_Out = 0,
    Hanich = 1,
    Checker = 2,
    Segel = 3,
    Admin = 5,
}

/**
 * * `1` - Hanich
 * `2` - Checker
 * `3` - Segel
 * `5` - Admin
 */
export type ClearanceEnum = (typeof ClearanceEnum)[keyof typeof ClearanceEnum];

export const ClearanceEnum = {
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_3: 3,
    NUMBER_5: 5,
} as const;
