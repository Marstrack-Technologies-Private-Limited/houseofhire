
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
    recruiterId: z.union([z.string(), z.number()]).refine(val => val !== "", "Please provide Recruiter Id"),
    companyName: z.string().min(1, "Please provide Company Name"),
    country: z.string().min(1, "Please Provide Country"),
    city: z.string().min(1, "Please Provide City"),
    physicalAddress: z.string().min(1, "Please provide Address Details"),
    emailAddress: z.string().email("Please provide a valid Email Address"),
    mobileNumber: z.string().min(1, "Please provide Mobile Number"),
    officeNumber: z.string().min(1, "Please provide Office Number"),
    contactName: z.string().min(1, "Please provide Contact Details"),
    kraPinNo: z.string().min(1, "Please provide Kra PinNo"),
    businessLine: z.string().min(1, "Please Provide Buisness Line"),
    specificRequirement: z.string().min(1, "Please provide Specific Requirement"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    pinAttachment: z.any().refine(file => file?.length == 1, "Please Attach the Kra Pin"),
    taxCertificateAttachment: z.any().refine(file => file?.length == 1, "Please Attach the Tax Certification"),
    geoCoordinates: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


export default function RecruiterRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [locationError, setLocationError] = useState("");

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState<number | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recruiterId: "",
      companyName: "",
      country: "Kenya",
      city: "",
      physicalAddress: "",
      emailAddress: "",
      mobileNumber: "",
      officeNumber: "",
      contactName: "",
      kraPinNo: "",
      businessLine: "",
      specificRequirement: "",
      password: "",
      confirmPassword: "",
      geoCoordinates: ""
    },
  });

  useEffect(() => {
    setCountries(Country.getAllCountries());

    const getRecruiterRegNo = () => {
      axios
        .get(`${BASEURL}/globalViewHandler?viewname=473`, {
          headers: { "session-token": BASEURL_SESSION_TOKEN },
        })
        .then((res) => {
          form.setValue("recruiterId", res?.data[0]?.NEWRECRUITERID);
        })
        .catch((err) => {
          console.log("Error while fetching /getRecruiterRegNo", err);
          toast({ title: "Error", description: "Could not fetch Recruiter ID.", variant: "destructive" });
        });
    };
    
    getRecruiterRegNo();
  }, [form, toast]);

  useEffect(() => {
      const kenya = Country.getAllCountries().find(c => c.name === "Kenya");
      if(kenya) {
          setCities(City.getCitiesOfCountry(kenya.isoCode) || []);
          form.setValue('country', kenya.isoCode)
      }
  }, [form]);


  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("geoCoordinates", `${latitude}, ${longitude}`);
        setLocationError("");
      },
      (error) => {
        let message = "An unknown error occurred.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "User denied the request for geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        }
        setLocationError(message);
        toast({ title: "Geolocation Error", description: message, variant: "destructive"});
      }
    );
  };

  const handleCountryChange = (countryIsoCode: string) => {
    const country = countries.find(c => c.isoCode === countryIsoCode);
    if (country) {
        form.setValue("country", country.isoCode);
        const countryCities = City.getCitiesOfCountry(country.isoCode);
        setCities(countryCities || []);
        form.setValue("city", "");
    }
  };
  
  async function generateOTP(email: string, companyName: string, recruiterId: string | number) {
    const newotp = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit OTP
    setOtp(newotp);
    setEnteredOtp(""); // Clear any previously entered OTP
    
    console.log(newotp);
    triggerEmail(email, companyName, newotp);
    await saveOTP(String(recruiterId), newotp);
    setIsOtpModalOpen(true);
  };
  
  function triggerEmail(email: string, firstName: string, newotp: number) {
    console.log(email, firstName);
    const mailData = {
      formatType: "html",
      message: emailTemplate(newotp, firstName),
      subject: "Recruiter Registartion Verification",
      to: email,
    };

    axios.post(`${BASEURL_EMAIL}/mail/triggerMail`, mailData)
      .then(response => {
        console.log(`Email sent to ${email}:`, response.data);
      })
      .catch(error => {
        console.error(`Error sending email to ${email}:`, error);
        toast({title: "Email Error", description: "Failed to send verification email.", variant: "destructive"});
      });
  }

  async function saveOTP(recruiterId: string, OTP: number) {
    try {
      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=258`,
        {
          RECRUITERREGNO: Number(recruiterId),
          OTP: OTP,
          SUCCESS_STATUS: "",
          ERROR_STATUS: "",
        },
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );
      if (response.status === 201) {
        console.log("OTP Saved Successfully");
      } else {
        console.log(response.data.message);
        throw new Error("Failed to save OTP");
      }
    } catch (err) {
      console.log("error While Saving The OTP /SaveDriverOTP", err);
      toast({title: "OTP Error", description: "Failed to save OTP for verification.", variant: "destructive"});
    }
  }

  const handleOtpSubmit = async () => {
      setIsOtpVerifying(true);
      try {
        const res = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=521&RECRUITERID=${form.getValues("recruiterId")}&OTP=${enteredOtp}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );

        if (res.data?.length > 0) {
            const verificationResponse = await axios.post(
                `${BASEURL}/globalSpHandler?spname=263`,
                { RECRUITERREGNO: Number(form.getValues("recruiterId")), SUCCESS_STATUS: "", ERROR_STATUS: "" },
                { headers: { "session-token": BASEURL_SESSION_TOKEN } }
            );

            if (verificationResponse?.data?.message === "Document Saved") {
                toast({ title: "Success", description: "OTP Verified Successfully. Registration complete." });
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

      const kraPinString = await uploadImage(values.pinAttachment[0]);
      const taxCertificateString = await uploadImage(values.taxCertificateAttachment[0]);

      const payload = {
          RECRUITERID: Number(values.recruiterId),
          RECRUITERCOMPANYNAME: values.companyName,
          RECRUITERCOUNTRY: Country.getCountryByCode(values.country)?.name,
          RECRUITERCITY: values.city,
          RECRUITERPHYSICALADDRESS: values.physicalAddress,
          RECRUITERPHYSICALGEOCOORDINATES: values.geoCoordinates || "",
          RECRUITEREMAILADDRESS: values.emailAddress,
          RECRUITERMOBILENUMBER: values.mobileNumber,
          RECRUITEROFFICENUMBER: values.officeNumber,
          RECRUITERPOINTOFCONTACT: values.contactName,
          RECRUITERKRAPIN: values.kraPinNo,
          RECRUITERBUSINESSLINE: values.businessLine,
          RECRUITERSPECIFICREQUIREMENT: values.specificRequirement,
          COMPANYKRAPINATTACHMENT: kraPinString,
          COMPANYTAXCOMPLIANCEATTACHMENT: taxCertificateString,
          RECRUITERPASSWORD: values.password,
          SUCCESS_STATUS: "",
          ERROR_STATUS: "",
      };

      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=197`,
        payload,
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );
      
      if (response.status === 201 && response?.data?.message == "Document Saved") {
        toast({ title: "Recruiter Registered", description: "Please verify your email to complete registration." });
        await generateOTP(values.emailAddress, values.companyName, values.recruiterId);
      } else {
        toast({ title: "Registration Failed", description: response.data.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Submission Error", description: "Error Saving the Recruiter Details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
    <Card className="w-full max-w-3xl my-8">
      <CardHeader>
        <CardTitle className="text-2xl">Recruiter Registration</CardTitle>
        <CardDescription>
          Please fill out the form below to create a recruiter account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="recruiterId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Recruiter ID</FormLabel>
                        <FormControl>
                            <Input placeholder="REC-001" {...field} disabled value={String(field.value)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                            <Input placeholder="TechCorp Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Country</FormLabel>
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
                <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Point of Contact Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
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
                        <FormControl>
                            <Input placeholder="+254 712 345 678" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="officeNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Office Number</FormLabel>
                        <FormControl>
                            <Input placeholder="020 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="kraPinNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>KRA PIN Number</FormLabel>
                        <FormControl>
                            <Input placeholder="A001234567B" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="businessLine"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Business Line</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Software Development" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                    control={form.control}
                    name="physicalAddress"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl>
                            <Textarea placeholder="123 Tech Avenue, Silicon Valley" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
            />
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                 <FormField
                    control={form.control}
                    name="geoCoordinates"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>Geo-Coordinates (Latitude, Longitude)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. -1.2921, 36.8219" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="button" onClick={getGeolocation} variant="outline" className="mt-8">
                  Get Current Location
                </Button>
              </div>
               {locationError && <p className="text-sm font-medium text-destructive">{locationError}</p>}
            </div>
            <FormField
                    control={form.control}
                    name="specificRequirement"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Specific Requirements</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any other specific requirements..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="pinAttachment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>KRA PIN Attachment (PDF/Image)</FormLabel>
                        <FormControl>
                            <Input type="file" accept=".pdf,image/*" {...form.register("pinAttachment")} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taxCertificateAttachment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tax Compliance Certificate (PDF/Image)</FormLabel>
                        <FormControl>
                            <Input type="file" accept=".pdf,image/*" {...form.register("taxCertificateAttachment")} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Create Recruiter Account"
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
