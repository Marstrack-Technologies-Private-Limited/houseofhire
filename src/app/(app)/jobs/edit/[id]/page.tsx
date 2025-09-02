
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
import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { Country, City, ICity, ICountry } from "country-state-city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { format, parseISO, isValid } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

const qualifications = [
    { id: "Diploma", label: "Diploma" },
    { id: "Bachelors Degree", label: "Bachelors Degree" },
    { id: "Masters", label: "Masters" },
    { id: "PHD", label: "PHD" },
    { id: "Doctrate", label: "Doctrate" },
]

const formSchema = z.object({
  requestId: z.union([z.string(), z.number()]),
  recruiterId: z.string().min(1, "Please select a recruiter"),
  companyName: z.string(),
  jobSeekerCount: z.number().min(1, "Please specify the number of employees"),
  narration: z.string().min(1, "Please provide a job description/narration"),
  urgencyLevel: z.string().min(1, "Please select an urgency level"),
  designation: z.string().min(1, "Please provide a designation"),
  requestStatus: z.string().min(1, "Please select a request status"),
  experienceLevel: z.string().min(1, "Please specify the experience level"),
  deadlineDate: z.string().min(1, "Please provide a deadline"),
  country: z.string().min(1, "Please select a country"),
  city: z.string().min(1, "Please select a city"),
  typeOfContract: z.string().min(1, "Please select the type of contract"),
  minQualification: z.array(z.string()).refine(value => value.some(item => item), {
      message: "You have to select at least one qualification.",
  }),
  termsAndConditions: z.string().min(1, "Please provide terms and conditions"),
});


export default function EditJobPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        minQualification: [],
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    }
    setCountries(Country.getAllCountries());
  }, []);

  const fetchJobDetails = useCallback(async (id: string) => {
    setIsFetching(true);
    try {
        const response = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=1155&REQUESTNO=${id}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        if (response.data && response.data.length > 0) {
            const jobData = response.data[0];
            const allCountries = Country.getAllCountries();
            const countryData = allCountries.find(c => c.name === jobData.COUNTRY);
            
            const deadlineDate = jobData.DEADLINEDATE ? parseISO(jobData.DEADLINEDATE) : null;
            
            form.reset({
                requestId: jobData.REQUESTNO,
                recruiterId: String(jobData.RECRUITERID),
                companyName: currentUser?.RECRUITERCOMPANYNAME || "",
                jobSeekerCount: jobData.JOBSEEKERCOUNT,
                narration: jobData.NARRATION,
                urgencyLevel: jobData.URGENCYLEVEL,
                designation: jobData.DESIGNATION,
                requestStatus: jobData.REQUESTSTATUS,
                experienceLevel: jobData.EXPERIENCELEVEL,
                deadlineDate: deadlineDate && isValid(deadlineDate) ? format(deadlineDate, 'yyyy-MM-dd') : '',
                country: countryData?.isoCode,
                city: jobData.CITY,
                typeOfContract: jobData.TYPEOFCONTRACT || "",
                minQualification: jobData.MINQUALIFICATION ? jobData.MINQUALIFICATION.split(',').map((s:string) => s.trim()) : [],
                termsAndConditions: jobData.TERMSANDCONDITIONS || "",
            });

            if(countryData) {
                setCities(City.getCitiesOfCountry(countryData.isoCode) || []);
                form.setValue('city', jobData.CITY);
            }
        } else {
             toast({ title: "Error", description: "Job not found.", variant: "destructive" });
             router.push("/jobs");
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to fetch job details.", variant: "destructive" });
    } finally {
        setIsFetching(false);
    }
  }, [form, router, toast, currentUser]);


  useEffect(() => {
      if(jobId && currentUser) {
          fetchJobDetails(jobId as string);
      }
  }, [jobId, currentUser, fetchJobDetails]);


  const handleCountryChange = (countryIsoCode: string) => {
    form.setValue("country", countryIsoCode);
    const countryCities = City.getCitiesOfCountry(countryIsoCode);
    setCities(countryCities || []);
    form.setValue("city", "");
  };

  const joditConfig = useMemo(() => ({
    readonly: false,
    height: 300,
  }), []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        REQUESTID: Number(values.requestId),
        RECRUITERID: Number(values.recruiterId),
        NOOFJOBSEEKERS: Number(values.jobSeekerCount),
        NARRATION: values.narration,
        URGENCYLEVEL: values.urgencyLevel,
        DESIGNATION: values.designation,
        REQUESTSTATUS: values.requestStatus,
        EXPERIENCELEVEL: values.experienceLevel,
        DEADLINEDATE: values.deadlineDate,
        COUNTRY: Country.getCountryByCode(values.country)?.name,
        CITY: values.city,
        TYPEOFCONTRACT: values.typeOfContract,
        MINQUALIFICATION: values.minQualification.join(', '),
        TERMSANDCONDITIONS: values.termsAndConditions,
        SUCCESS_STATUS: "",
        ERROR_STATUS: "",
      };

      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=1161`,
        payload,
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );
      
      if (response.status === 201 && response?.data?.message == "Document Saved") {
        toast({ title: "Job Updated", description: "Your job has been updated successfully." });
        router.push("/jobs");
      } else {
        toast({ title: "Update Failed", description: response.data.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Submission Error", description: "Error saving the job details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold">Edit Job Post</h1>
            <p className="text-muted-foreground">Update the details for this job opening.</p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="requestId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Request ID</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled value={String(field.value)} />
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
                                <FormLabel>Company</FormLabel>
                                 <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="jobSeekerCount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Number of Employees</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="designation"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Job Title / Designation</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                </FormControl>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select experience level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="No experience">No experience</SelectItem>
                                        <SelectItem value="Internship and Graduate">Internship and Graduate</SelectItem>
                                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                                        <SelectItem value="Mid Level">Mid Level</SelectItem>
                                        <SelectItem value="Senior and Executive level">Senior and Executive level</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="urgencyLevel"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Urgency Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select urgency level" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
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
                         <FormField
                            control={form.control}
                            name="deadlineDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Application Deadline</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="typeOfContract"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Type of Contract</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select contract type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Permanent">Permanent</SelectItem>
                                        <SelectItem value="Long Term Contract">Long Term Contract</SelectItem>
                                        <SelectItem value="Labour">Labour</SelectItem>
                                        <SelectItem value="Temporary Contract">Temporary Contract</SelectItem>
                                        <SelectItem value="Consultancy">Consultancy</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="minQualification"
                        render={() => (
                            <FormItem>
                                <FormLabel>Minimum Qualifications</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {qualifications.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="minQualification"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...field.value, item.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {item.label}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="narration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Job Description</FormLabel>
                            <FormControl>
                                <JoditEditor
                                    value={field.value}
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
                        name="termsAndConditions"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Terms and Conditions</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter terms and conditions..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.push('/jobs')}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Job...</>
                            ) : (
                            "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
