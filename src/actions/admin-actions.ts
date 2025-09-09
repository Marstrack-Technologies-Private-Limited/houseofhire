
"use server";
import axios from 'axios';
import { z } from 'zod';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

// --- Seeker Approval ---
const approveRejectSeekerSchema = z.object({
  jobSeekerRegNo: z.number(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  adminUserCode: z.string(),
});

type ApproveRejectSeekerInput = z.infer<typeof approveRejectSeekerSchema>;

export async function approveRejectSeekerAction(input: ApproveRejectSeekerInput) {
    const validation = approveRejectSeekerSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: "Invalid input." };
    }
    
    const { jobSeekerRegNo, action, reason, adminUserCode } = validation.data;

    if (action === 'reject' && !reason) {
        return { success: false, message: "A reason is required for rejection." };
    }

    try {
        const payload = {
            JOBSEEKERREGNO: jobSeekerRegNo,
            APPROVEDCANCELLED: action === "approve" ? "APPROVE" : "CANCEL",
            APPROVEDCANCELLEDREASON: reason || "",
            APPROVEDCANCELLEDBY: adminUserCode,
            SUCCESS_STATUS: "",
            ERROR_STATUS: "",
        };

        const response = await axios.post(
            `${BASEURL}/globalSpHandler?spname=1159`,
            payload,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        
        if (response.data?.message?.includes("Saved") || response.status === 201) {
            return { success: true, message: `Seeker ${action}d successfully.` };
        } else {
            return { success: false, message: response.data?.message || `Failed to ${action} seeker.` };
        }
    } catch (error) {
        console.error(`Error in ${action}SeekerAction:`, error);
        return { success: false, message: `An unexpected error occurred.` };
    }
}


// --- Recruiter Approval ---
const approveRejectRecruiterSchema = z.object({
  recruiterRegNo: z.number(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  adminUserCode: z.string(),
});

type ApproveRejectRecruiterInput = z.infer<typeof approveRejectRecruiterSchema>;

export async function approveRejectRecruiterAction(input: ApproveRejectRecruiterInput) {
    const validation = approveRejectRecruiterSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: "Invalid input." };
    }
    
    const { recruiterRegNo, action, reason, adminUserCode } = validation.data;

    if (action === 'reject' && !reason) {
        return { success: false, message: "A reason is required for rejection." };
    }

    try {
        const payload = {
            RECRUITERREGNO: recruiterRegNo,
            APPROVEDCANCELLED: action === "approve" ? "APPROVE" : "CANCEL",
            APPROVEDCANCELLEDREASON: reason || "",
            APPROVEDCANCELLEDBY: adminUserCode,
            SUCCESS_STATUS: "",
            ERROR_STATUS: "",
        };

        const response = await axios.post(
            `${BASEURL}/globalSpHandler?spname=58`,
            payload,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        
        if (response.data?.message?.includes("Saved") || response.status === 201) {
            return { success: true, message: `Recruiter ${action}d successfully.` };
        } else {
            return { success: false, message: response.data?.message || `Failed to ${action} recruiter.` };
        }
    } catch (error) {
        console.error(`Error in ${action}RecruiterAction:`, error);
        return { success: false, message: `An unexpected error occurred.` };
    }
}
