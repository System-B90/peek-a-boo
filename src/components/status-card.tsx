"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type StatusCardAction = {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "contained" | "outlined" | "text";
};

export type StatusCardProps = {
    icon: ReactNode;
    tone?: "error" | "primary";
    title: string;
    description: ReactNode;
    /** Emphasised call-out between the description and the actions. */
    highlight?: ReactNode;
    /** Short technical hint (digest / code). Rendered monospace, muted. */
    details?: string;
    actions?: Array<StatusCardAction>;
};

/**
 * The single visual for every full-page status surface (access denied, 404,
 * crash). Same card as the login page so failures look like part of
 * Peek-a-boo, not like Next's default English pages.
 */
export function StatusCard({
    actions = [],
    description,
    details,
    highlight,
    icon,
    title,
    tone = "primary",
}: StatusCardProps) {
    return (
        <Box
            alignItems="flex-start"
            bgcolor="background.default"
            dir="rtl"
            display="flex"
            justifyContent="center"
            minHeight="100vh"
            pt="15vh"
            px={2}
            width="100%"
        >
            <Box
                alignItems="center"
                bgcolor="background.paper"
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="20px"
                boxShadow="0 24px 50px rgba(0,0,0,0.35)"
                display="flex"
                flexDirection="column"
                gap={3}
                maxWidth="448px"
                p={5}
                textAlign="center"
                width="100%"
            >
                <Box
                    alignItems="center"
                    borderRadius="50%"
                    color={`${tone}.main`}
                    display="flex"
                    height={64}
                    justifyContent="center"
                    sx={(theme) => ({
                        bgcolor: alpha(theme.palette[tone].main, 0.15),
                        "& svg": { fontSize: 34 },
                    })}
                    width={64}
                >
                    {icon}
                </Box>

                <Box>
                    <Typography
                        component="h1"
                        fontSize={26}
                        fontWeight="bold"
                        letterSpacing="-0.02em"
                    >
                        {title}
                    </Typography>
                    <Typography color="text.secondary" component="p" fontSize={14} mt={1}>
                        {description}
                    </Typography>
                </Box>

                {highlight ? (
                    <Box
                        bgcolor="action.hover"
                        borderRadius="10px"
                        fontSize={18}
                        fontWeight="bold"
                        px={2}
                        py={1.5}
                        width="100%"
                    >
                        {highlight}
                    </Box>
                ) : null}

                {details ? (
                    <Typography
                        color="text.secondary"
                        component="p"
                        fontFamily="monospace"
                        fontSize={11}
                        sx={{ wordBreak: "break-word" }}
                    >
                        {details}
                    </Typography>
                ) : null}

                {actions.length > 0 ? (
                    <Box display="flex" flexDirection="column" gap={1.5} width="100%">
                        {actions.map((action) => (
                            <Button
                                fullWidth
                                href={action.href}
                                key={action.label}
                                onClick={action.onClick}
                                size={action.variant === "contained" ? "large" : "medium"}
                                variant={action.variant ?? "text"}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}
