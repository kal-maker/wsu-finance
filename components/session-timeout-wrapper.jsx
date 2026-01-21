"use client";

import { useEffect, useCallback, useRef } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SessionTimeoutWrapper({ children, timeoutMinutes = 5 }) {
    const { signOut } = useClerk();
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const timeoutRef = useRef(null);

    const handleLogout = useCallback(async () => {
        if (isSignedIn) {
            console.log("🔒 [SESSION] Inactivity timeout reached. Logging out...");
            await signOut();
            toast.info("You have been logged out due to inactivity.", {
                duration: 5000,
            });
            router.push("/sign-in");
        }
    }, [isSignedIn, signOut, router]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Convert minutes to milliseconds
        const timeoutMs = timeoutMinutes * 60 * 1000;

        timeoutRef.current = setTimeout(() => {
            handleLogout();
        }, timeoutMs);
    }, [timeoutMinutes, handleLogout]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        // List of events that reset the timer
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click"
        ];

        // Initial timer start
        resetTimer();

        // Add event listeners
        const activityHandler = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, activityHandler);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
        };
    }, [isLoaded, isSignedIn, resetTimer]);

    return <>{children}</>;
}
