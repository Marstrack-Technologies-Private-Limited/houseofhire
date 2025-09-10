
"use client";

import * as React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { uploadFileAction, applyForJobAction } from "@/actions/apply-job-action";
import { useSearchParams } from "next/navigation";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface JobSeeker {
  JOBSEEKERREGNO: number;
  JOBSEEKERNAME: string;
  EMAILADDRESS: string;
}

interface Job {
  REQUESTNO: number;
  DESIGNATION: string;
  RECRUITERID: number;
  REQUESTSTATUS: string;
}

const formSchema = z.object({
  applicationNo: z.number().optional(),
  jobSeekerRegNo: z.string().min(1, "Please select a job seeker."),
  requestNo: z.string().min(1, "Please select a job."),
  cvAttached: z.any().refine((files) => files?.length > 0, "CV is required."),
  coverLetter: z.any().optional(),
  reasonFitForApplication: z.string().min(20, "Please provide a detailed reason."),
});

export default function ApplyForSeekerPage() {
  const [jobSeekers, setJobSeekers] = React.useState<JobSeeker[]>([]);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.has("applicationNo");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reasonFitForApplication: "",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const [seekersResponse, jobsResponse] = await Promise.all([
          axios.get(`${BASEURL}/globalViewHandler?viewname=1154&GBSREGISTERED=true&APPROVED=true`, {
            headers: { "session-token": BASEURL_SESSION_TOKEN },
          }),
          axios.get(`${BASEURL}/globalViewHandler?viewname=1155&SELFHIRING=false`, {
            headers: { "session-token": BASEURL_SESSION_TOKEN },
          }),
        ]);
        
        const openJobs = jobsResponse.data.filter((j: Job) => j.REQUESTSTATUS === 'Open');
        setJobSeekers(seekersResponse.data || []);
        setJobs(openJobs || []);
        
        // Pre-fill form if in edit mode
        if (isEditMode) {
            const applicationNo = searchParams.get("applicationNo");
            const appDetailsResponse = await axios.get(
                `${BASEURL}/globalViewHandler?viewname=1157&APPLICATIONNO=${applicationNo}`,
                { headers: { "session-token": BASEURL_SESSION_TOKEN } }
            );
            if (appDetailsResponse.data && appDetailsResponse.data.length > 0) {
                const appData = appDetailsResponse.data[0];
                form.reset({
                    applicationNo: appData.APPLICATIONNO,
                    jobSeekerRegNo: String(appData.JOBSEEKERREGNO),
                    requestNo: String(appData.REQUESTNO),
                    reasonFitForApplication: appData.REASONFITFORAPPLICATION,
                    // Note: CV and cover letter cannot be pre-filled for security reasons.
                });
            }
        } else {
             // Fetch new application number for create mode
            const appNoResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=1158`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN },
            });
            const newApplicationNo = appNoResponse.data[0]?.NEWAPPLICATIONNO;
            form.setValue("applicationNo", newApplicationNo);
        }

      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast({
          title: "Error",
          description: "Could not fetch necessary data.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [toast, form, isEditMode, searchParams]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const cvFormData = new FormData();
    cvFormData.append("imageValue", values.cvAttached[0]);
    const cvUploadResult = await uploadFileAction(cvFormData);

    if (!cvUploadResult.success || !cvUploadResult.url) {
      toast({ title: "CV Upload Failed", description: cvUploadResult.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    let coverLetterUrl: string | undefined = undefined;
    if (values.coverLetter && values.coverLetter.length > 0) {
      const coverLetterFormData = new FormData();
      coverLetterFormData.append("imageValue", values.coverLetter[0]);
      const coverLetterUploadResult = await uploadFileAction(coverLetterFormData);
      if (!coverLetterUploadResult.success || !coverLetterUploadResult.url) {
        toast({ title: "Cover Letter Upload Failed", description: coverLetterUploadResult.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      coverLetterUrl = coverLetterUploadResult.url;
    }
    
    const applicationNo = values.applicationNo;
    if (!applicationNo) {
        toast({ title: "Error", description: "Application number is missing.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const payload = {
        APPLICATIONNO: Number(applicationNo),
        REQUESTNO: Number(values.requestNo),
        JOBSEEKERREGNO: Number(values.jobSeekerRegNo),
        COVERLETTER: coverLetterUrl || "",
        CVATTACHED: cvUploadResult.url,
        REASONFITFORAPPLICATION: values.reasonFitForApplication,
        GBSPOSTED: 1,
        SUCCESS_STATUS: "",
        ERROR_STATUS: "",
    };

    const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=160`,
        payload,
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
    );

    if (response.data?.message === "Document Saved") {
        toast({ title: "Success", description: `Application ${isEditMode ? 'updated' : 'submitted'} successfully!` });
        if(!isEditMode) form.reset();
    } else {
        toast({ title: "Application Failed", description: response.data?.message || "Failed to submit application.", variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Application" : "Apply for Job on Behalf of a Seeker"}</CardTitle>
        <CardDescription>
          {isEditMode ? "Update the details for this application." : "Use this form to submit a job application for a registered job seeker."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobSeekerRegNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Seeker</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job seeker..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobSeekers.map((seeker) => (
                          <SelectItem key={seeker.JOBSEEKERREGNO} value={String(seeker.JOBSEEKERREGNO)}>
                            {seeker.JOBSEEKERNAME} ({seeker.EMAILADDRESS})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Opening</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.REQUESTNO} value={String(job.REQUESTNO)}>
                            {job.DESIGNATION} (ID: {job.REQUESTNO})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="cvAttached"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Upload CV (Required)</FormLabel>
                        <FormControl>
                           <Input type="file" accept=".pdf,.doc,.docx,image/*" {...form.register("cvAttached")} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="coverLetter"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Upload Cover Letter (Optional)</FormLabel>
                        <FormControl>
                           <Input type="file" accept=".pdf,.doc,.docx,image/*" {...form.register("coverLetter")} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="reasonFitForApplication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Application</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Explain why this candidate is a good fit for the role..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  isEditMode ? "Save Changes" : "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
