
"use server";

import axios from "axios";
import { z } from "zod";
import { accountStatusTemplate, gbsAccountCreationTemplate, interviewStatusTemplate } from "@/lib/admin-email-templates";

const BASEURL_EMAIL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_EMAIL;

// Schema for account status emails (approval/rejection)
const accountStatusEmailSchema = z.object({
    userName: z.string(),
    userEmail: z.string().email(),
    status: z.enum(['approve', 'reject']),
    userType: z.enum(['seeker', 'recruiter']),
    reason: z.string().optional(),
});

export async function sendAccountStatusEmailAction(input: z.infer<typeof accountStatusEmailSchema>) {
    const validation = accountStatusEmailSchema.safeParse(input);
    if (!validation.success) {
        console.error("Invalid input for account status email:", validation.error.flatten());
        return; // Don't block
    }
    
    const { userName, userEmail, status, userType, reason } = validation.data;
    const subject = status === 'approve' ? `Your HouseOfHire ${userType} account is approved!` : `Update on your HouseOfHire ${userType} account`;

    const mailData = {
        formatType: "html",
        message: accountStatusTemplate({ userName, status, userType, reason }),
        subject: subject,
        to: userEmail,
    };

    axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
        .then(response => console.log(`Account status email sent to ${userEmail}:`, response.data))
        .catch(error => console.error("Error sending account status email:", error));
}


// Schema for GBS account creation email
const gbsAccountCreationEmailSchema = z.object({
    userName: z.string(),
    userEmail: z.string().email(),
    password: z.string(),
});

export async function sendGbsAccountCreationEmailAction(input: z.infer<typeof gbsAccountCreationEmailSchema>) {
    const validation = gbsAccountCreationEmailSchema.safeParse(input);
    if (!validation.success) {
        console.error("Invalid input for GBS account creation email:", validation.error.flatten());
        return;
    }
    
    const { userName, userEmail, password } = validation.data;

    const mailData = {
        formatType: "html",
        message: gbsAccountCreationTemplate({ userName, userEmail, password }),
        subject: "Welcome to HouseOfHire - Your Account is Ready",
        to: userEmail,
    };

    axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
        .then(response => console.log(`GBS account creation email sent to ${userEmail}:`, response.data))
        .catch(error => console.error("Error sending GBS account creation email:", error));
}


// Schema for Interview Status Update Email
const interviewStatusEmailSchema = z.object({
    candidateName: z.string(),
    candidateEmail: z.string().email(),
    jobTitle: z.string(),
    interviewRound: z.number(),
    status: z.string(),
});

export async function sendInterviewStatusEmailAction(input: z.infer<typeof interviewStatusEmailSchema>) {
    const validation = interviewStatusEmailSchema.safeParse(input);
    if (!validation.success) {
        console.error("Invalid input for interview status email:", validation.error.flatten());
        return;
    }
    
    const { candidateName, candidateEmail, jobTitle, interviewRound, status } = validation.data;

    const mailData = {
        formatType: "html",
        message: interviewStatusTemplate({ candidateName, jobTitle, interviewRound, status }),
        subject: `Update on your Interview for ${jobTitle}`,
        to: candidateEmail,
    };

    axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
        .then(response => console.log(`Interview status email sent to ${candidateEmail}:`, response.data))
        .catch(error => console.error("Error sending interview status email:", error));
}
