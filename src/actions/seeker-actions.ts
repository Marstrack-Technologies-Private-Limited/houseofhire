

"use server";
import axios from 'axios';
import { z } from 'zod';
import { Country } from 'country-state-city';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

const deactivateAccountSchema = z.object({
  jobSeekerRegNo: z.number(),
  reason: z.string().min(1, "Deactivation reason is required."),
});

type DeactivateAccountInput = z.infer<typeof deactivateAccountSchema>;

export async function deactivateSeekerAccountAction(input: DeactivateAccountInput) {
    const validation = deactivateAccountSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: "Invalid input." };
    }
    const { jobSeekerRegNo, reason } = validation.data;

    try {
        const payload = {
            JOBSEEKERREGNO: jobSeekerRegNo,
            INACTIVATEACCOUNT: 1, // 1 for true
            INACTIVATEREASON: reason,
            INACTIVATEDATETIME: new Date().toISOString(), 
            JOBSEEKERNAME: "",
            MIDDLENAME: "",
            LASTNAME: "",
            ADDRESSDETAILS: "",
            MOBILENO: "",
            EMAILADDRESS: "",
            DOB: null,
            NATIONALITY: "",
            CITY: "",
            COUNTRYRESIDENCE: "",
            TRIBE: "",
            LICENSENO: "",
            NATIONALID: "",
            PASSPORTNO: "",
            SPECIALIZATION: "",
            MAXQUALIFICATION: "",
            EXPERIENCELEVEL: "",
            PREVIOUSCOMPANY: "",
            LASTCOMPANYLEFTDATE: null,
            REASONOFLEAVING: "",
            LICENSEATTACHMENT: "",
            NATIONAIDATTACHMENT: "",
            PASSPORTATTACHMENT: "",
            RECOMMENDATIONLETTERATTACHMENT: "",
            NOCATTACHMENT: "",
            PHOTOATTACHMENT: "",
            PASSWORD: "",
            CVATTACHMENT: "",
            SUCCESS_STATUS: "",
            ERROR_STATUS: "",
        };

        const response = await axios.post(
            `${BASEURL}/globalSpHandler?spname=1160`,
            payload,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        
        if (response.data?.message?.includes("Saved") || response.status === 201) {
            return { success: true, message: "Account deactivated successfully." };
        } else {
            return { success: false, message: response.data?.message || "Failed to deactivate account." };
        }
    } catch (error) {
        console.error("Error in deactivateSeekerAccountAction:", error);
        return { success: false, message: "An unexpected error occurred during deactivation." };
    }
}


const seekerProfileUpdateSchema = z.object({
    jobSeekerRegNo: z.number(),
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    addressDetails: z.string().min(1, "Address is required"),
    mobileNumber: z.string().min(1, "Mobile number is required"),
    dob: z.string().min(1, "Date of birth is required"),
    nationality: z.string().min(1, "Nationality is required"),
    city: z.string().min(1, "City is required"),
    countryOfResidence: z.string().min(1, "Country of residence is required"),
    tribe: z.string().min(1, "Tribe/Cast is required"),
    drivingLicenseNo: z.string().min(1, "Driving license number is required"),
    nationalIdNumber: z.string().min(1, "National ID is required"),
    passportNumber: z.string().min(1, "Passport number is required"),
    lastCompany: z.string().min(1, "Last company is required"),
    reasonOfLeaving: z.string().min(1, "Reason for leaving is required"),
    specialization: z.string().min(1, "Specialization is required"),
    maxQualification: z.string().min(1, "Maximum qualification is required"),
    experienceLevel: z.string().min(1, "Experience level is required"),
    lastCompanyLeftDate: z.string().min(1, "Last company left date is required"),
    currentUser: z.any(),
});

type SeekerProfileUpdateInput = z.infer<typeof seekerProfileUpdateSchema>;


export async function updateSeekerProfileAction(input: SeekerProfileUpdateInput) {
    const validation = seekerProfileUpdateSchema.safeParse(input);
    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const errorMessage = Object.entries(errors).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ');
        return { success: false, message: `Invalid input: ${errorMessage}` };
    }
    
    try {
        const { currentUser, ...formValues } = input;
        
        const payload = {
            JOBSEEKERREGNO: Number(currentUser.JOBSEEKERREGNO),
            JOBSEEKERNAME: formValues.firstName,
            MIDDLENAME: formValues.middleName || "",
            LASTNAME: formValues.lastName,
            ADDRESSDETAILS: formValues.addressDetails,
            MOBILENO: formValues.mobileNumber,
            EMAILADDRESS: currentUser.EMAILADDRESS, 
            DOB: formValues.dob,
            NATIONALITY: formValues.nationality,
            CITY: formValues.city,
            COUNTRYRESIDENCE: Country.getCountryByCode(formValues.countryOfResidence)?.name || formValues.countryOfResidence,
            TRIBE: formValues.tribe,
            LICENSENO: formValues.drivingLicenseNo,
            NATIONALID: formValues.nationalIdNumber,
            PASSPORTNO: formValues.passportNumber,
            SPECIALIZATION: formValues.specialization,
            MAXQUALIFICATION: formValues.maxQualification,
            EXPERIENCELEVEL: formValues.experienceLevel,
            PREVIOUSCOMPANY: formValues.lastCompany,
            LASTCOMPANYLEFTDATE: formValues.lastCompanyLeftDate,
            REASONOFLEAVING: formValues.reasonOfLeaving,
            LICENSEATTACHMENT: currentUser.LICENSEATTACHMENT || "",
            NATIONAIDATTACHMENT: currentUser.NATIONAIDATTACHMENT || "",
            PASSPORTATTACHMENT: currentUser.PASSPORTATTACHMENT || "",
            RECOMMENDATIONLETTERATTACHMENT: currentUser.RECOMMENDATIONLETTERATTACHMENT || "",
            NOCATTACHMENT: currentUser.NOCATTACHMENT || "",
            PHOTOATTACHMENT: currentUser.PHOTOATTACHMENT || "",
            CVATTACHMENT: currentUser.OM_JOB_SEEKER_CV_ATTACHMENT || currentUser.CVATTACHMENT || "",
            PASSWORD: currentUser.PASSWORD, 
            INACTIVATEACCOUNT: currentUser.INACTIVATEACCOUNT || 0,
            INACTIVATEREASON: currentUser.INACTIVATEREASON || "",
            INACTIVATEDATETIME: currentUser.INACTIVATEDATETIME || null,
            SUCCESS_STATUS: "",
            ERROR_STATUS: "",
        };

        const response = await axios.post(
            `${BASEURL}/globalSpHandler?spname=1160`,
            payload,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );

        if (response.data?.message?.includes("Saved") || response.status === 201) {
             const updatedData = {
                JOBSEEKERNAME: payload.JOBSEEKERNAME,
                MIDDLENAME: payload.MIDDLENAME,
                LASTNAME: payload.LASTNAME,
                ADDRESSDETAILS: payload.ADDRESSDETAILS,
                MOBILENO: payload.MOBILENO,
                DOB: payload.DOB,
                NATIONALITY: payload.NATIONALITY,
                CITY: payload.CITY,
                COUNTRYRESIDENCE: payload.COUNTRYRESIDENCE,
                TRIBE: payload.TRIBE,
                LICENSENO: payload.LICENSENO,
                NATIONALID: payload.NATIONALID,
                PASSPORTNO: payload.PASSPORTNO,
                SPECIALIZATION: payload.SPECIALIZATION,
                QUALIFICATION: payload.MAXQUALIFICATION,
                EXPERIENCELEVEL: payload.EXPERIENCELEVEL,
                PREVIOUSCOMPANY: payload.PREVIOUSCOMPANY,
                LASTCOMPANYLEFTDATE: payload.LASTCOMPANYLEFTDATE,
                REASONOFLEAVING: payload.REASONOFLEAVING,
                OM_JOB_SEEKER_CV_ATTACHMENT: payload.CVATTACHMENT,
            };
            return { success: true, message: "Profile updated successfully.", data: updatedData };
        } else {
            return { success: false, message: response.data?.message || "Failed to update profile." };
        }
    } catch (error) {
        console.error("Error in updateSeekerProfileAction:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
}
