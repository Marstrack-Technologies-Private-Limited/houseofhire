
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import axios from "axios";
import { Country, City, ICity, ICountry } from "country-state-city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OtpModal } from "@/components/otp-modal";
import { emailTemplate } from "@/lib/email-template";
import { useRouter } from "next/navigation";


const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_EMAIL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_EMAIL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;


const formSchema = z.object({
    jobSeekerId: z.union([z.string(), z.number()]).refine(val => val !== "", "Job Seeker ID is required"),
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    addressDetails: z.string().min(1, "Address is required"),
    mobileNumber: z.string().min(1, "Mobile number is required"),
    emailAddress: z.string().email("A valid email is required"),
    dob: z.string().min(1, "Date of birth is required"),
    nationality: z.string().min(1, "Nationality is required"),
    city: z.string().min(1, "City is required"),
    countryOfResidence: z.string().min(1, "Country of residence is required"),
    tribe: z.string().min(1, "Tribe/Cast is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    drivingLicenseNo: z.string().min(1, "Driving license number is required"),
    nationalIdNumber: z.string().min(1, "National ID is required"),
    passportNumber: z.string().min(1, "Passport number is required"),
    lastCompany: z.string().min(1, "Last company is required"),
    reasonOfLeaving: z.string().min(1, "Reason for leaving is required"),
    specialization: z.string().min(1, "Specialization is required"),
    maxQualification: z.string().min(1, "Maximum qualification is required"),
    experienceLevel: z.string().min(1, "Experience level is required"),
    lastCompanyLeftDate: z.string().min(1, "Last company left date is required"),
    licenseAttachment: z.any().refine(file => file?.length == 1, "License attachment is required"),
    nationalIdAttachment: z.any().refine(file => file?.length == 1, "National ID attachment is required"),
    passportAttachment: z.any().refine(file => file?.length == 1, "Passport attachment is required"),
    recommendationLetter: z.any().refine(file => file?.length == 1, "Recommendation letter is required"),
    noObjectionCertificate: z.any().refine(file => file?.length == 1, "NOC is required"),
    photoAttachment: z.any().refine(file => file?.length == 1, "Photo is required"),
    cvAttachment: z.any().refine(file => file?.length == 1, "CV attachment is required"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


export default function SeekerRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState<number | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        jobSeekerId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        addressDetails: "",
        mobileNumber: "",
        emailAddress: "",
        dob: "",
        nationality: "Kenyan",
        city: "",
        countryOfResidence: "Kenya",
        tribe: "",
        password: "",
        confirmPassword: "",
        drivingLicenseNo: "",
        nationalIdNumber: "",
        passportNumber: "",
        lastCompany: "",
        reasonOfLeaving: "",
        specialization: "",
        maxQualification: "",
        experienceLevel: "",
        lastCompanyLeftDate: "",
    },
  });

  useEffect(() => {
    setCountries(Country.getAllCountries());

    const getnewJobSeekerregno = () => {
      axios.get(`${BASEURL}/globalViewHandler?viewname=1153`, {
          headers: { "session-token": BASEURL_SESSION_TOKEN },
        })
        .then((res) => {
          form.setValue("jobSeekerId", res?.data[0]?.NEWJOBSEEKER);
        })
        .catch((err) => {
          console.log("Error while fetching /getnewJobSeekerregno", err);
          toast({ title: "Error", description: "Could not fetch Job Seeker ID.", variant: "destructive" });
        });
    };
    
    getnewJobSeekerregno();
  }, [form, toast]);

  useEffect(() => {
      const kenya = Country.getAllCountries().find(c => c.name === "Kenya");
      if(kenya) {
          setCities(City.getCitiesOfCountry(kenya.isoCode) || []);
          form.setValue('countryOfResidence', kenya.isoCode)
      }
  }, [form]);

  const handleCountryChange = (countryIsoCode: string) => {
    const country = countries.find(c => c.isoCode === countryIsoCode);
    if (country) {
        form.setValue("countryOfResidence", country.isoCode);
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setCities(countryCities || []);
        form.setValue("city", "");
    }
  };
  
  async function generateOTP(email: string, firstName: string, jobSeekerId: string | number) {
    const newotp = Math.floor(1000 + Math.random() * 9000); 
    setOtp(newotp);
    setEnteredOtp("");
    
    console.log(newotp);
    triggerEmail(email, firstName, newotp);
    await saveOTP(String(jobSeekerId), newotp);
    setIsOtpModalOpen(true);
  };
  
  function triggerEmail(email: string, firstName: string, newotp: number) {
    const mailData = {
      formatType: "html",
      message: emailTemplate(newotp, firstName),
      subject: "Job Seeker Registration Verification",
      to: email,
    };

    axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
      .then(response => console.log(`Email sent to ${email}:`, response.data))
      .catch(error => {
        console.error(`Error sending email to ${email}:`, error);
        toast({title: "Email Error", description: "Failed to send verification email.", variant: "destructive"});
      });
  }

  async function saveOTP(jobSeekerRegNo: string, OTP: number) {
    try {
      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=1162`,
        { JOBSEEKERREGNO: Number(jobSeekerRegNo), OTP: OTP, SUCCESS_STATUS: "", ERROR_STATUS: "" },
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );
      if (response.status === 201) {
        console.log("OTP Saved Successfully");
      } else {
        throw new Error("Failed to save OTP");
      }
    } catch (err) {
      console.log("Error While Saving The OTP /saveOTP", err);
      toast({title: "OTP Error", description: "Failed to save OTP for verification.", variant: "destructive"});
    }
  }

  const handleOtpSubmit = async () => {
      setIsOtpVerifying(true);
      try {
        const res = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=1154&JOBSEEKERREGNO=${form.getValues("jobSeekerId")}&OTP=${enteredOtp}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );

        if (res.data?.length > 0) {
            const verificationResponse = await axios.post(
                `${BASEURL}/globalSpHandler?spname=1164`,
                { JOBSEEKERREGNO: Number(form.getValues("jobSeekerId")), SUCCESS_STATUS: "", ERROR_STATUS: "" },
                { headers: { "session-token": BASEURL_SESSION_TOKEN } }
            );

            if (verificationResponse?.data?.message === "Document Saved") {
                toast({ title: "Success", description: "OTP Verified. Registration complete." });
                setIsOtpModalOpen(false);
                router.push("/login");
            } else {
                 toast({ title: "Error", description: "Incorrect OTP. Please try again.", variant: "destructive" });
            }
        } else {
            toast({ title: "Error", description: "Incorrect OTP. Please try again.", variant: "destructive" });
        }
    } catch (err) {
        console.error("Error while verifying OTP", err);
        toast({ title: "Error", description: "OTP Verification Failed.", variant: "destructive" });
    } finally {
        setIsOtpVerifying(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("imageValue", file);
        const response = await axios.post(
          "https://api.tech23.net/fileupload/uploadImage",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
      };

      const [
        licenseString,
        nationalIdString,
        passportString,
        recommendationString,
        nocString,
        photoString,
        cvString,
      ] = await Promise.all([
        uploadImage(values.licenseAttachment[0]),
        uploadImage(values.nationalIdAttachment[0]),
        uploadImage(values.passportAttachment[0]),
        uploadImage(values.recommendationLetter[0]),
        uploadImage(values.noObjectionCertificate[0]),
        uploadImage(values.photoAttachment[0]),
        uploadImage(values.cvAttachment[0]),
      ]);
      
      const payload = {
        JOBSEEKERREGNO: Number(values.jobSeekerId),
        JOBSEEKERNAME: values.firstName,
        MIDDLENAME: values.middleName,
        LASTNAME: values.lastName,
        ADDRESSDETAILS: values.addressDetails,
        MOBILENO: values.mobileNumber,
        EMAILADDRESS: values.emailAddress,
        DOB: values.dob,
        NATIONALITY: values.nationality,
        CITY: values.city,
        COUNTRYRESIDENCE: Country.getCountryByCode(values.countryOfResidence)?.name,
        TRIBE: values.tribe,
        LICENSENO: values.drivingLicenseNo,
        NATIONALID: values.nationalIdNumber,
        PASSPORTNO: values.passportNumber,
        SPECIALIZATION: values.specialization,
        MAXQUALIFICATION: values.maxQualification,
        EXPERIENCELEVEL: values.experienceLevel,
        LASTCOMPANYLEFTDATE: values.lastCompanyLeftDate,
        PREVIOUSCOMPANY: values.lastCompany,
        REASONOFLEAVING: values.reasonOfLeaving,
        LICENSEATTACHMENT: licenseString,
        NATIONAIDATTACHMENT: nationalIdString,
        PASSPORTATTACHMENT: passportString,
        RECOMMENDATIONLETTERATTACHMENT: recommendationString,
        NOCATTACHMENT: nocString,
        PHOTOATTACHMENT: photoString,
        PASSWORD: values.password,
        CVATTACHMENT: cvString,
        INACTIVATEACCOUNT: 0,
        INACTIVATEREASON: "",
        INACTIVATEDATETIME: null,
        SUCCESS_STATUS: "",
        ERROR_STATUS: "",
      };

      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=1160`,
        payload,
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );
      
      if (response.status === 201 && response?.data?.message == "Document Saved") {
        toast({ title: "Registration Successful", description: "Please verify your email to complete." });
        await generateOTP(values.emailAddress, values.firstName, values.jobSeekerId);
      } else {
        toast({ title: "Registration Failed", description: response.data.message || "An error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Submission Error", description: "Could not save job seeker details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
    <Card className="w-full max-w-4xl my-8">
      <CardHeader>
        <CardTitle className="text-2xl">Job Seeker Registration</CardTitle>
        <CardDescription>
          Fill in your details to create your CareerLink profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Details */}
            <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                    control={form.control}
                    name="jobSeekerId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Seeker ID</FormLabel>
                        <FormControl>
                            <Input {...field} disabled value={String(field.value)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Middle Name (Optional)</FormLabel>
                        <FormControl><Input placeholder="Fitzgerald" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl><Input placeholder="e.g. Kenyan" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="tribe"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tribe / Cast</FormLabel>
                        <FormControl><Input placeholder="e.g. Kikuyu" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            {/* Contact Information */}
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Contact Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="john.doe@email.com" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input placeholder="+254 712 345 678" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <FormField
                control={form.control}
                name="addressDetails"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Address Details</FormLabel>
                    <FormControl><Textarea placeholder="P.O Box 123, Nairobi" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="countryOfResidence"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Country of Residence</FormLabel>
                        <Select onValueChange={(value) => handleCountryChange(value)} defaultValue={field.value}>
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
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            
            {/* Professional Details */}
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <FormControl><Input placeholder="e.g., Frontend Development" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="maxQualification"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Highest Qualification</FormLabel>
                        <FormControl><Input placeholder="e.g., BSc. Computer Science" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Entry-Level">Entry-Level</SelectItem>
                                <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                                <SelectItem value="Senior-Level">Senior-Level</SelectItem>
                                <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="lastCompany"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Previous Company</FormLabel>
                        <FormControl><Input placeholder="e.g., TechCorp" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="lastCompanyLeftDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date Left Previous Company</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="reasonOfLeaving"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Reason For Leaving</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

            </div>
            
            {/* Identification */}
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="nationalIdNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>National ID Number</FormLabel>
                        <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Passport Number</FormLabel>
                        <FormControl><Input placeholder="A1234567" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="drivingLicenseNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Driving License No.</FormLabel>
                        <FormControl><Input placeholder="DL12345" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             {/* Security */}
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input type={showPassword ? 'text' : 'password'} {...field} />
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                >
                                {showPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Attachments */}
            <h3 className="text-lg font-semibold border-b pb-2 pt-4">Attachments</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="photoAttachment" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Photo</FormLabel>
                        <FormControl><Input type="file" accept="image/*" {...form.register("photoAttachment")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="cvAttachment" render={({ field }) => (
                    <FormItem>
                        <FormLabel>CV / Resume</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,.doc,.docx" {...form.register("cvAttachment")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="licenseAttachment" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Driving License</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,image/*" {...form.register("licenseAttachment")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="nationalIdAttachment" render={({ field }) => (
                    <FormItem>
                        <FormLabel>National ID</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,image/*" {...form.register("nationalIdAttachment")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="passportAttachment" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Passport</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,image/*" {...form.register("passportAttachment")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="recommendationLetter" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Recommendation Letter</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,image/*" {...form.register("recommendationLetter")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="noObjectionCertificate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>No Objection Certificate (NOC)</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,image/*" {...form.register("noObjectionCertificate")} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                ) : (
                  "Create Job Seeker Account"
                )}
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="flex-col items-center">
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
    <OtpModal 
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleOtpSubmit}
        otp={enteredOtp}
        setOtp={setEnteredOtp}
        isLoading={isOtpVerifying}
    />
    </>
  );
}

    

    
