/**
 * Maps a NextAuth `?error=` code (or a client-side sign-in failure) to a
 * user-facing Hebrew message. Returns null when there is no error.
 */
export function getAuthenticationErrorMessage(
    error: null | string,
): null | string {
    switch (error) {
    case null:
        return null;
    case "AccessDenied":
        return "למשתמש שלך אין הרשאה מתאימה לגישה למערכת.";
    case "OAuthAccountNotLinked":
        return "כתובת המייל משויכת לחשבון קיים. יש להתחבר באמצעות שיטת ההתחברות המקורית.";
    case "OAuthCallback":
    case "OAuthSignin":
        return "לא ניתן היה להשלים את תהליך ההזדהות מול הייב. ייתכן ששרת הייב אינו זמין כרגע.";
    case "Timeout":
        return "שרת הייב לא הגיב בזמן. בדקו את החיבור לרשת ונסו שוב.";
    case "NetworkError":
        return "לא ניתן להגיע לשרת הייב. בדקו את החיבור לרשת ונסו שוב.";
    case "Configuration":
        return "תקלת הגדרות בצד השרת. יש לפנות לצוות התמיכה.";
    case "SessionRequired":
        return "נדרשת התחברות מחדש כדי להמשיך.";
    case "Verification":
        return "קישור ההתחברות פג תוקף או שכבר נעשה בו שימוש.";
    default:
        return "אירעה שגיאה במהלך תהליך ההתחברות. ניתן לנסות שוב.";
    }
}
