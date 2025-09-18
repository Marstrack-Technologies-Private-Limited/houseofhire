
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Eye, EyeOff, Loader2, Badge } from "lucide-react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid, parseISO } from 'date-fns';
import Link from "next/link";
import { deactivateSeekerAccountAction, updateSeekerProfileAction } from "@/actions/seeker-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation";
import { Country, City, ICountry, ICity } from 'country-state-city';
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;


const recruiterFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  physicalAddress: z.string().min(1, "Physical address is required"),
  geoCoordinates: z.string().optional(),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  officeNumber: z.string().min(1, "Office number is required"),
  pointOfContact: z.string().min(1, "Point of contact is required"),
  kraPinNo: z.string().min(1, "KRA PIN is required"),
  businessLine: z.string().min(1, "Business line is required"),
  specificRequirement: z.string().min(1, "Specific requirement is required"),
  recruiterSelfHiringProcess: z.boolean().default(false),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  companyInformation: z.string().optional(),
});

const seekerFormSchema = z.object({
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
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
});


const RecruiterProfileForm = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

     const joditConfig = useMemo(() => ({
        readonly: false,
        height: 300,
    }), []);

    const form = useForm<z.infer<typeof recruiterFormSchema>>({
        resolver: zodResolver(recruiterFormSchema),
        defaultValues: {},
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
            form.reset({
                companyName: userData.RECRUITERCOMPANYNAME,
                country: userData.COUNTRY,
                city: userData.CITY,
                physicalAddress: userData.PHYSICALADDRESS,
                geoCoordinates: userData.GEOCOORDINATES,
                mobileNumber: userData.MOBILENUMBER,
                officeNumber: userData.OFFICENUMBER,
                pointOfContact: userData.POINTOFCONTACT,
                kraPinNo: userData.KRAPINNO,
                businessLine: userData.BUSINESSLINE,
                specificRequirement: userData.SPECIFICREQUIREMENT,
                recruiterSelfHiringProcess: userData.SELFHIRING || false,
                website: userData.OM_RECRUITER_WEBSITE || "",
                companyInformation: userData.OM_RECRUITER_COMPANY_INFORMATION || "",
            });
        }
    }, [form]);

    async function onSubmit(values: z.infer<typeof recruiterFormSchema>) {
        setIsSubmitting(true);
        try {
            const payload = {
                RECRUITERID: Number(currentUser.RECRUITERID),
                RECRUITERCOMPANYNAME: values.companyName,
                RECRUITERCOUNTRY: values.country,
                RECRUITERCITY: values.city,
                RECRUITERPHYSICALADDRESS: values.physicalAddress,
                RECRUITERPHYSICALGEOCOORDINATES: values.geoCoordinates || "",
                RECRUITEREMAILADDRESS: currentUser.EMAILADDRESS,
                RECRUITERMOBILENUMBER: values.mobileNumber,
                RECRUITEROFFICENUMBER: values.officeNumber,
                RECRUITERPOINTOFCONTACT: values.pointOfContact,
                RECRUITERKRAPIN: values.kraPinNo,
                RECRUITERBUSINESSLINE: values.businessLine,
                RECRUITERSPECIFICREQUIREMENT: values.specificRequirement,
                COMPANYKRAPINATTACHMENT: currentUser.KRAPIN,
                COMPANYTAXCOMPLIANCEATTACHMENT: currentUser.COMPLIANCECERTIFICATE,
                RECRUITERPASSWORD: currentUser.RECRUITERPASSWORD,
                RECRUITERSELFHIRINGPROCESS: values.recruiterSelfHiringProcess ? 1 : 0,
                RECRUITERWEBSITE: values.website || "",
                RECRUITERCOMPANYINFORMATION: values.companyInformation || "",
                SUCCESS_STATUS: "",
                ERROR_STATUS: "",
            };

            const response = await axios.post(
                `${BASEURL}/globalSpHandler?spname=197`,
                payload,
                { headers: { "session-token": BASEURL_SESSION_TOKEN } }
            );

            if (response.status === 201 && response?.data?.message === "Document Saved") {
                toast({ title: "Success", description: "Profile updated successfully!" });
                const updatedUser = { 
                    ...currentUser,
                    RECRUITERCOMPANYNAME: values.companyName,
                    COUNTRY: values.country,
                    CITY: values.city,
                    PHYSICALADDRESS: values.physicalAddress,
                    GEOCOORDINATES: values.geoCoordinates,
                    MOBILENUMBER: values.mobileNumber,
                    OFFICENUMBER: values.officeNumber,
                    POINTOFCONTACT: values.pointOfContact,
                    KRAPINNO: values.kraPinNo,
                    BUSINESSLINE: values.businessLine,
                    SPECIFICREQUIREMENT: values.specificRequirement,
                    SELFHIRING: values.recruiterSelfHiringProcess,
                    OM_RECRUITER_WEBSITE: values.website,
                    OM_RECRUITER_COMPANY_INFORMATION: values.companyInformation,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
            } else {
                 toast({ title: "Update Failed", description: response.data.message || "An unknown error occurred.", variant: "destructive" });
            }

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ title: "Error", description: "An unexpected error occurred while updating.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (!currentUser) return <div>Loading profile...</div>

    return (
        <Card>
            <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
                This information is visible to potential candidates. Keep it up to date.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input type="url" placeholder="https://company.com" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormItem>
                        <FormLabel>Email Address (Read-only)</FormLabel>
                        <FormControl><Input value={currentUser.EMAILADDRESS} readOnly disabled /></FormControl>
                    </FormItem>
                    <FormField control={form.control} name="pointOfContact" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Point of Contact</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="officeNumber" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Office Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                        <FormLabel>City / Head Office</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="geoCoordinates" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Geo-Coordinates</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="kraPinNo" render={({ field }) => (
                        <FormItem>
                        <FormLabel>KRA PIN</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="businessLine" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Business Line</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                <FormField control={form.control} name="physicalAddress" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="specificRequirement" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Specific Requirement</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField
                    control={form.control}
                    name="companyInformation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>About The Company</FormLabel>
                        <FormControl>
                            <JoditEditor
                                value={field.value ?? ""}
                                config={joditConfig}
                                onBlur={newContent => field.onChange(newContent)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="recruiterSelfHiringProcess"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            Enable Self-Hiring Process (Subscription Model)
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                            Turn this on to manage your own recruitment. If off, GBS will handle candidate hunting and shortlisting for you.
                            </p>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />

                <h3 className="text-lg font-semibold border-b pb-2 pt-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentUser.KRAPIN && (
                    <FormItem>
                        <FormLabel>KRA PIN</FormLabel>
                        <div className="flex items-center gap-2">
                        <Input value={currentUser.KRAPIN} readOnly disabled />
                        <Button asChild variant="outline" size="icon">
                            <Link href={currentUser.KRAPIN} target="_blank"><Eye /></Link>
                        </Button>
                        </div>
                    </FormItem>
                    )}
                    {currentUser.COMPLIANCECERTIFICATE && (
                    <FormItem>
                        <FormLabel>Tax Compliance Certificate</FormLabel>
                        <div className="flex items-center gap-2">
                        <Input value={currentUser.COMPLIANCECERTIFICATE} readOnly disabled />
                        <Button asChild variant="outline" size="icon">
                            <Link href={currentUser.COMPLIANCECERTIFICATE} target="_blank"><Eye /></Link>
                        </Button>
                        </div>
                    </FormItem>
                    )}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
                </form>
            </Form>
            </CardContent>
      </Card>
    )
}

const SeekerProfileForm = () => {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [deactivationReason, setDeactivationReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);

    const form = useForm<z.infer<typeof seekerFormSchema>>({
        resolver: zodResolver(seekerFormSchema),
        defaultValues: {},
    });

    const resetFormWithUserData = useCallback((userData: any) => {
        const dob = userData.DOB ? parseISO(userData.DOB) : null;
        const leftDate = userData.LASTCOMPANYLEFTDATE ? parseISO(userData.LASTCOMPANYLEFTDATE) : null;
        const countryData = Country.getAllCountries().find(c => c.name === userData.COUNTRYRESIDENCE);

        form.reset({
            firstName: userData.JOBSEEKERNAME || "",
            middleName: userData.MIDDLENAME || "",
            lastName: userData.LASTNAME || "",
            addressDetails: userData.ADDRESSDETAILS || "",
            mobileNumber: userData.MOBILENO || "",
            dob: dob && isValid(dob) ? format(dob, 'yyyy-MM-dd') : '',
            nationality: userData.NATIONALITY || "",
            city: userData.CITY || "",
            countryOfResidence: countryData?.isoCode || "",
            tribe: userData.TRIBE || "",
            drivingLicenseNo: userData.LICENSENO || "",
            nationalIdNumber: userData.NATIONALID || "",
            passportNumber: userData.PASSPORTNO || "",
            lastCompany: userData.PREVIOUSCOMPANY || "",
            reasonOfLeaving: userData.REASONOFLEAVING || "",
            specialization: userData.SPECIALIZATION || "",
            maxQualification: userData.QUALIFICATION || "",
            experienceLevel: userData.EXPERIENCELEVEL || "",
            lastCompanyLeftDate: leftDate && isValid(leftDate) ? format(leftDate, 'yyyy-MM-dd') : '',
        });

        if (countryData?.isoCode) {
            setCities(City.getCitiesOfCountry(countryData.isoCode) || []);
            // Set city value again after cities are loaded
            form.setValue('city', userData.CITY || "");
        } else {
            setCities([]);
        }
    }, [form]);


     useEffect(() => {
        setCountries(Country.getAllCountries());
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
            resetFormWithUserData(userData);
        }
    }, [resetFormWithUserData]);
    
    async function onSubmit(values: z.infer<typeof seekerFormSchema>) {
        if (!currentUser) {
            toast({ title: "Error", description: "User data not found.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const result = await updateSeekerProfileAction({
            ...values,
            jobSeekerRegNo: currentUser.JOBSEEKERREGNO,
            currentUser,
        });

        if(result.success && result.data) {
            toast({ title: "Success", description: "Profile updated successfully!" });
            const updatedUser = { ...currentUser, ...result.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            resetFormWithUserData(updatedUser);
        } else {
             toast({ title: "Update Failed", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    }
    
    const handleDeactivate = async () => {
        const reasonsMap: { [key: string]: string } = {
          found_careerlink: "I found a job through CareerLink",
          found_elsewhere: "I found a job elsewhere",
          not_looking: "I am no longer looking for a job",
          other: "Other",
        };
        const finalReason = deactivationReason === 'other' ? otherReason : reasonsMap[deactivationReason];

        if (!finalReason) {
            toast({ title: "Error", description: "Please provide a reason for deactivation.", variant: "destructive" });
            return;
        }
        setIsDeactivating(true);
        const result = await deactivateSeekerAccountAction({
            jobSeekerRegNo: currentUser.JOBSEEKERREGNO,
            reason: finalReason,
        });

        if(result.success) {
            toast({ title: "Account Deactivated", description: "Your account has been deactivated." });
            localStorage.removeItem('user');
            router.push('/login');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsDeactivating(false);
    };

    const handleCountryChange = (countryIsoCode: string) => {
        form.setValue("countryOfResidence", countryIsoCode);
        const countryCities = City.getCitiesOfCountry(countryIsoCode);
        setCities(countryCities || []);
        form.setValue("city", "");
    };
    
    if (!currentUser) {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Keep your personal and professional details up to date.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-medium">Account Status:</span>
                             <Badge variant={currentUser.OM_JOB_SEEKER_INACTIVATE ? "destructive" : "default"}>
                                {currentUser.OM_JOB_SEEKER_INACTIVATE ? 'Inactive' : 'Active'}
                             </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="middleName" render={({ field }) => (
                                    <FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="lastName" render={({ field }) => (
                                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="dob" render={({ field }) => (
                                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="nationality" render={({ field }) => (
                                    <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="tribe" render={({ field }) => (
                                    <FormItem><FormLabel>Tribe/Cast</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            
                            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormItem>
                                    <FormLabel>Email Address (Read-only)</FormLabel>
                                    <FormControl><Input value={currentUser.EMAILADDRESS} readOnly disabled /></FormControl>
                                </FormItem>
                                <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField
                                    control={form.control}
                                    name="countryOfResidence"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Country of Residence</FormLabel>
                                        <Select onValueChange={(value) => handleCountryChange(value)} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select a country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {countries.map(country => (
                                                    <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select a city" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {cities.map((city, index) => (
                                                    <SelectItem key={`${city.name}-${city.stateCode}-${index}`} value={city.name}>{city.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField control={form.control} name="addressDetails" render={({ field }) => (
                                <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>

                            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Professional Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="specialization" render={({ field }) => (
                                    <FormItem><FormLabel>Specialization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="maxQualification" render={({ field }) => (
                                    <FormItem><FormLabel>Highest Qualification</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="experienceLevel" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Experience Level</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Entry-Level">Entry-Level</SelectItem>
                                            <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                                            <SelectItem value="Senior-Level">Senior-Level</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="lastCompany" render={({ field }) => (
                                    <FormItem><FormLabel>Previous Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="lastCompanyLeftDate" render={({ field }) => (
                                    <FormItem><FormLabel>Date Left</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="reasonOfLeaving" render={({ field }) => (
                                    <FormItem><FormLabel>Reason For Leaving</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>

                            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Identification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="nationalIdNumber" render={({ field }) => (
                                    <FormItem><FormLabel>National ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="passportNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Passport No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="drivingLicenseNo" render={({ field }) => (
                                    <FormItem><FormLabel>Driving License No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            
                            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Documents (Read-only)</h3>
                            <p className="text-sm text-muted-foreground">To update documents, please re-upload them through a new registration process.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentUser.OM_JOB_SEEKER_CV_ATTACHMENT && (
                                <FormItem>
                                    <FormLabel>CV / Resume</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.OM_JOB_SEEKER_CV_ATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.OM_JOB_SEEKER_CV_ATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.PHOTOATTACHMENT && (
                            <FormItem>
                                    <FormLabel>Photo</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.PHOTOATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.PHOTOATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.LICENSEATTACHMENT && (
                                <FormItem>
                                    <FormLabel>Driving License</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.LICENSEATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.LICENSEATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.NATIONAIDATTACHMENT && (
                                <FormItem>
                                    <FormLabel>National ID</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.NATIONAIDATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.NATIONAIDATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.PASSPORTATTACHMENT && (
                                <FormItem>
                                    <FormLabel>Passport</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.PASSPORTATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.PASSPORTATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.RECOMMENDATIONLETTERATTACHMENT && (
                                <FormItem>
                                    <FormLabel>Recommendation Letter</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.RECOMMENDATIONLETTERATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.RECOMMENDATIONLETTERATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            {currentUser.NOCATTACHMENT && (
                                <FormItem>
                                    <FormLabel>No Objection Certificate (NOC)</FormLabel>
                                    <div className="flex items-center gap-2">
                                    <Input value={currentUser.NOCATTACHMENT} readOnly disabled />
                                    <Button asChild variant="outline" size="icon">
                                        <Link href={currentUser.NOCATTACHMENT} target="_blank"><Eye /></Link>
                                    </Button>
                                    </div>
                                </FormItem>
                            )}
                            </div>

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            
            <Card className="border-destructive mt-6">
                <CardHeader>
                    <CardTitle>Deactivate Account</CardTitle>
                    <CardDescription>
                        This action is irreversible. Your profile and application history will be permanently removed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="deactivation-reason">Reason for leaving</Label>
                        <Select onValueChange={setDeactivationReason} value={deactivationReason}>
                            <SelectTrigger id="deactivation-reason">
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="found_careerlink">I found a job through CareerLink</SelectItem>
                                <SelectItem value="found_elsewhere">I found a job elsewhere</SelectItem>
                                <SelectItem value="not_looking">I am no longer looking for a job</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {deactivationReason === 'other' && (
                        <div className="space-y-2">
                            <Label htmlFor="other-reason">Please specify your reason</Label>
                            <Textarea 
                                id="other-reason"
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Please provide details..."
                            />
                        </div>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!deactivationReason || (deactivationReason === 'other' && !otherReason) || isDeactivating}>
                                {isDeactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Deactivate My Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently deactivate your
                                account and remove your data from our servers.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeactivate} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </>
    );
};


const PasswordForm = () => {
    const { toast } = useToast();
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        setIsSubmittingPassword(true);
        console.log("Updating password...");
        // API call to update password would go here
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Success", description: "Password updated successfully!" });
        passwordForm.reset();
        setIsSubmittingPassword(false);
    }
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>To change your password, please enter your current password first.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                                             <Button
                                                type="button" variant="ghost" size="icon"
                                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showNewPassword ? "text" : "password"} {...field} />
                                             <Button
                                                type="button" variant="ghost" size="icon"
                                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                               <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                                             <Button
                                                type="button" variant="ghost" size="icon"
                                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <Button type="submit" disabled={isSubmittingPassword}>
                            {isSubmittingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function ProfilePage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        setRole(userData.role);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(!isLoading && !role){
        console.log("No user role found, finishing loading.");
    }
  }, [isLoading, role])

  if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      );
  }

  const pageTitle = role === 'recruiter' ? "Recruiter Profile" : "Job Seeker Profile";
  const pageDescription = role === 'recruiter' 
    ? "View and manage your company's information."
    : "View and manage your personal and professional information.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      {role === 'recruiter' ? <RecruiterProfileForm /> : <SeekerProfileForm />}

      <Separator />

      <PasswordForm />
    </div>
  );
}

    