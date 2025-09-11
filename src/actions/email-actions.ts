
"use server";

import axios from "axios";
import { z } from "zod";
import { applicationStatusUpdateTemplate } from "@/lib/application-status-email-template";

const BASEURL_EMAIL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_EMAIL;

const emailSchema = z.object({
    candidateName: z.string(),
    candidateEmail: z.string().email(),
    companyName: z.string(),
    jobTitle: z.string(),
    status: z.string(),
    applicationNo: z.number(),
});

type EmailInput = z.infer<typeof emailSchema>;

export async function sendStatusUpdateEmailAction(input: EmailInput) {
    const validation = emailSchema.safeParse(input);

    if (!validation.success) {
        console.error("Invalid input for sending email:", validation.error.flatten());
        return { success: false, message: "Invalid input." };
    }
    
    const { candidateEmail, candidateName, companyName, jobTitle, status, applicationNo } = validation.data;

    const mailData = {
        formatType: "html",
        message: applicationStatusUpdateTemplate({
            candidateName,
            jobTitle,
            companyName,
            status,
            applicationNo
        }),
        subject: `Update on your application for ${jobTitle} at ${companyName}`,
        to: candidateEmail,
    };

    try {
        axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
            .then(response => {
                console.log(`Status update email sent to ${candidateEmail}:`, response.data);
            })
            .catch(error => {
                // We don't want to block the user, so we just log the error server-side
                console.error("Failed to send status update email:", error);
            });
        
        // Return success immediately, don't await the email
        return { success: true, message: "Email sending process initiated." };

    } catch (error) {
        console.error("Error initiating status update email:", error);
        // This catch block might be for synchronous errors in setting up the axios post
        return { success: false, message: "Failed to initiate status update email." };
    }
}
