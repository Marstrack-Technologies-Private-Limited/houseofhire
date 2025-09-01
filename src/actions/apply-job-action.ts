
"use server";
import axios from 'axios';
import { z } from 'zod';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

const applyJobSchema = z.object({
  requestNo: z.number(),
  jobSeekerRegNo: z.number(),
});

type ApplyJobInput = z.infer<typeof applyJobSchema>;

export async function applyForJobAction(input: ApplyJobInput) {
    const validation = applyJobSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: "Invalid input." };
    }
    const { requestNo, jobSeekerRegNo } = validation.data;

    try {
        // 1. Check if already applied
        const alreadyAppliedResponse = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=1157&JOBSEEKERREGNO=${jobSeekerRegNo}&REQUESTNO=${requestNo}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );

        if (alreadyAppliedResponse.data?.length > 0) {
            return { success: false, message: "You have already applied for this job!" };
        }

        // 2. Get new application number
        const appNoResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=1158`, {
            headers: { "session-token": BASEURL_SESSION_TOKEN },
        });
        const applicationNo = appNoResponse.data[0]?.NEWAPPLICATIONNO;

        if (!applicationNo) {
            throw new Error("Could not retrieve a new application number.");
        }
        
        // 3. Submit application
        const payload = {
            APPLICATIONNO: Number(applicationNo),
            REQUESTNO: Number(requestNo),
            JOBSEEKERREGNO: Number(jobSeekerRegNo),
            SUCCESS_STATUS: "",
            ERROR_STATUS: "",
        };

        const response = await axios.post(
            `${BASEURL}/globalSpHandler?spname=160`,
            payload,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );

        if (response.data?.message === "Document Saved") {
            return { success: true, message: "Job application submitted successfully!" };
        } else {
            return { success: false, message: response.data?.message || "Failed to submit application." };
        }
    } catch (error) {
        console.error("Error in applyForJobAction:", error);
        return { success: false, message: "An unexpected error occurred while applying." };
    }
}


export async function trackApplicationAction(input: { requestNo: number; jobSeekerRegNo: number; }) {
    try {
        const res = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=1157&JOBSEEKERREGNO=${input.jobSeekerRegNo}&REQUESTNO=${input.requestNo}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        return { success: true, data: res.data };
    } catch (error) {
        console.error("Error tracking application:", error);
        return { success: false, error: "Could not fetch tracking details." };
    }
}
