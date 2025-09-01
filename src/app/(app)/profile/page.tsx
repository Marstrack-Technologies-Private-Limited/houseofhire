
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
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
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
import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import Link from "next/link";


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
            });
        }
    }, [form]);

    async function onSubmit(values: z.infer<typeof recruiterFormSchema>) {
        setIsSubmitting(true);
        console.log("Updating recruiter profile with:", values);
        // In a real app, you would make an API call here.
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Success", description: "Profile updated successfully!" });
        setIsSubmitting(false);
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
                        <FormLabel>City</FormLabel>
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
                    <FormField control={form.control} name="businessLine" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Business Line</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                </div>
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const form = useForm<z.infer<typeof seekerFormSchema>>({
        resolver: zodResolver(seekerFormSchema),
        defaultValues: {},
    });

     useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
            form.reset({
                firstName: userData.JOBSEEKERNAME,
                middleName: userData.MIDDLENAME,
                lastName: userData.LASTNAME,
                addressDetails: userData.ADDRESSDETAILS,
                mobileNumber: userData.MOBILENO,
                dob: userData.DOB ? format(new Date(userData.DOB), 'yyyy-MM-dd') : '',
                nationality: userData.NATIONALITY,
                city: userData.CITY,
                countryOfResidence: userData.COUNTRYRESIDENCE,
                tribe: userData.TRIBE,
                drivingLicenseNo: userData.LICENSENO,
                nationalIdNumber: userData.NATIONALID,
                passportNumber: userData.PASSPORTNO,
                lastCompany: userData.PREVIOUSCOMPANY,
                reasonOfLeaving: userData.REASONOFLEAVING,
                specialization: userData.SPECIALIZATION,
                maxQualification: userData.QUALIFICATION,
                experienceLevel: userData.EXPERIENCELEVEL,
                lastCompanyLeftDate: userData.LASTCOMPANYLEFTDATE ? format(new Date(userData.LASTCOMPANYLEFTDATE), 'yyyy-MM-dd') : '',
            });
        }
    }, [form]);
    
    async function onSubmit(values: z.infer<typeof seekerFormSchema>) {
        setIsSubmitting(true);
        console.log("Updating seeker profile with:", values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Success", description: "Profile updated successfully!" });
        setIsSubmitting(false);
    }
    
    if (!currentUser) return <div>Loading profile...</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Keep your personal and professional details up to date.</CardDescription>
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
                             <FormField control={form.control} name="countryOfResidence" render={({ field }) => (
                                <FormItem><FormLabel>Country of Residence</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        
                        <h3 className="text-lg font-semibold border-b pb-2 pt-4">Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    );
};


const PasswordForm = () => {
    const { toast } = useToast();
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    
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
                                <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <Button type="submit" disabled={isSubmittingPassword}>
                            {isSubmittingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        setRole(userData.role);
    }
  }, []);

  if (role === null) {
      return <div>Loading...</div>; // Or a proper loading skeleton
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

    