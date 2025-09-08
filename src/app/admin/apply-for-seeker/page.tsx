
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
}

const formSchema = z.object({
  jobSeekerRegNo: z.string().min(1, "Please select a job seeker."),
  requestNo: z.string().min(1, "Please select a job."),
  cvAttached: z.any().refine((file) => file?.length == 1, "Please upload the CV."),
  coverLetter: z.any().optional(),
  reasonFitForApplication: z.string().min(20, "Please provide a detailed reason."),
});

export default function ApplyForSeekerPage() {
  const [jobSeekers, setJobSeekers] = React.useState<JobSeeker[]>([]);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobSeekerRegNo: "",
      requestNo: "",
      reasonFitForApplication: "",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const [seekersResponse, jobsResponse] = await Promise.all([
          axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, {
            headers: { "session-token": BASEURL_SESSION_TOKEN },
          }),
          axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, {
            headers: { "session-token": BASEURL_SESSION_TOKEN },
          }),
        ]);
        setJobSeekers(seekersResponse.data || []);
        setJobs(jobsResponse.data.filter((j: any) => j.REQUESTSTATUS === 'Open') || []);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast({
          title: "Error",
          description: "Could not fetch job seekers or job openings.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [toast]);

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

    const applicationInput = {
      requestNo: Number(values.requestNo),
      jobSeekerRegNo: Number(values.jobSeekerRegNo),
      cvAttached: cvUploadResult.url,
      coverLetter: coverLetterUrl,
      reasonFitForApplication: values.reasonFitForApplication,
      gbsPosted: 1, // Admin is posting
    };

    const result = await applyForJobAction(applicationInput);

    if (result.success) {
      toast({ title: "Success", description: "Application submitted successfully on behalf of the job seeker." });
      form.reset();
    } else {
      toast({ title: "Application Failed", description: result.message, variant: "destructive" });
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
        <CardTitle>Apply for Job on Behalf of a Seeker</CardTitle>
        <CardDescription>
          Use this form to submit a job application for a registered job seeker.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
