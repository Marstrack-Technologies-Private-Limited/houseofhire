
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Trash2, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { sendInterviewStatusEmailAction } from '@/actions/admin-email-actions';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

const assessmentSchema = z.object({
  assessmentId: z.string().min(1, "Please select an assessment"),
  assessmentName: z.string(),
  narration: z.string().min(1, "Narration is required"),
  score: z.number().min(0, "Score must be at least 0").max(5, "Score cannot exceed 5"),
});

const formSchema = z.object({
  interviewId: z.number(),
  jobNo: z.string().min(1, "Please select a job"),
  jobSeekerId: z.string().min(1, "Please select a job seeker"),
  headerNarration: z.string().min(1, "Header narration is required"),
  interviewDate: z.string().min(1, "Interview date is required"),
  interviewTime: z.string().min(1, "Interview time is required"),
  conductedBy: z.string().min(1, "Interviewer name is required"),
  interviewRound: z.number().min(1, "Interview round is required"),
  interviewStatus: z.string().min(1, "Please select a status"),
  closureNarration: z.string().optional(),
  assessments: z.array(assessmentSchema),
});

interface Job {
    REQUESTNO: number;
    DESIGNATION: string;
}
interface Application {
    JOBSEEKERREGNO: number;
    JOBSEEKERNAME: string;
    EMAILADDRESS: string;
}
interface AssessmentMaster {
    ASSESSMENTID: number;
    ASSESSMENTNAME: string;
}

export default function NewInterviewPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applicants, setApplicants] = useState<Application[]>([]);
    const [assessmentMasters, setAssessmentMasters] = useState<AssessmentMaster[]>([]);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            headerNarration: "",
            interviewRound: 1,
            interviewStatus: "",
            closureNarration: "",
            assessments: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "assessments",
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsFetching(true);
            try {
                const [jobsRes, interviewIdRes, assessmentsRes, seekersRes] = await Promise.all([
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1155&SELFHIRING=false&REQUESTSTATUS=Open`, {
                        headers: { "session-token": BASEURL_SESSION_TOKEN }
                    }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1178`, {
                        headers: { "session-token": BASEURL_SESSION_TOKEN }
                    }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1174`, {
                        headers: { "session-token": BASEURL_SESSION_TOKEN }
                    }),
                     axios.get(`${BASEURL}/globalViewHandler?viewname=1154&GBSREGISTERED=true&APPROVED=true`, {
                        headers: { "session-token": BASEURL_SESSION_TOKEN }
                    }),
                ]);
                setJobs(jobsRes.data || []);
                setAssessmentMasters(assessmentsRes.data || []);
                setApplicants(seekersRes.data || []);

                if (interviewIdRes.data[0]?.INTERVIEWID) {
                    form.setValue('interviewId', interviewIdRes.data[0].INTERVIEWID);
                } else {
                    toast({ title: "Error", description: "Could not fetch a new Interview ID.", variant: "destructive"});
                }
                
                const jobNo = searchParams.get('jobNo');
                const seekerId = searchParams.get('seekerId');
                const round = searchParams.get('round');

                if(jobNo) form.setValue('jobNo', jobNo);
                if(seekerId) form.setValue('jobSeekerId', seekerId);
                if(round) form.setValue('interviewRound', parseInt(round));


            } catch (err) {
                toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive"});
                console.error(err);
            } finally {
                setIsFetching(false);
            }
        }
        fetchInitialData();
    }, [form, toast, searchParams]);
    
    const joditConfig = useMemo(() => ({
        readonly: false,
        height: 200,
    }), []);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const selectedSeeker = applicants.find(a => String(a.JOBSEEKERREGNO) === values.jobSeekerId);
            const selectedJob = jobs.find(j => String(j.REQUESTNO) === values.jobNo);
            
            const interviewPayload = {
                INTERVIEWID: values.interviewId,
                JOBNO: Number(values.jobNo),
                HEADERNARRATION: values.headerNarration,
                JOBSEEKERID: Number(values.jobSeekerId),
                JOBSEEKERNAME: selectedSeeker?.JOBSEEKERNAME || "",
                INTERVIEWDATE: values.interviewDate,
                INTERVIEWTIME: values.interviewTime,
                INTERVIEWCONDUCTEDBY: values.conductedBy,
                INTERVIEWROUND: values.interviewRound,
                INTERVIEWSTATUS: values.interviewStatus,
                INTERVIEWCLOSURENARRATION: values.closureNarration || "",
                SUCCESS_STATUS: "",
                ERROR_STATUS: ""
            };
            
            const interviewResponse = await axios.post(`${BASEURL}/globalSpHandler?spname=1179`, interviewPayload, {
                 headers: { "session-token": BASEURL_SESSION_TOKEN }
            });

            if(interviewResponse.data?.message !== "Document Saved") {
                 toast({ title: "Error", description: interviewResponse.data.message || "Failed to save interview details.", variant: "destructive" });
                 setIsLoading(false);
                 return;
            }

            for (const assessment of values.assessments) {
                const assessmentPayload = {
                    INTERVIEWID: values.interviewId,
                    ASSESSMENTID: Number(assessment.assessmentId),
                    ASSESSMENTNARRATION: assessment.narration,
                    ASSESSMENTSCORE: assessment.score,
                    SUCCESS_STATUS: "",
                    ERROR_STATUS: ""
                };
                 await axios.post(`${BASEURL}/globalSpHandler?spname=1180`, assessmentPayload, {
                     headers: { "session-token": BASEURL_SESSION_TOKEN }
                });
            }

             toast({ title: "Success", description: "Interview and assessments saved successfully." });
             
             if(selectedSeeker && selectedJob) {
                sendInterviewStatusEmailAction({
                    candidateName: selectedSeeker.JOBSEEKERNAME,
                    candidateEmail: selectedSeeker.EMAILADDRESS,
                    jobTitle: selectedJob.DESIGNATION,
                    interviewRound: values.interviewRound,
                    status: values.interviewStatus
                });
             }
             
             router.push('/admin/interview-conducted');

        } catch (err) {
            toast({ title: "Error", description: "An unexpected error occurred during save.", variant: "destructive" });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>New Interview</CardTitle>
                    <CardDescription>Schedule and conduct a new interview for a candidate.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                           <h3 className="text-lg font-semibold border-b pb-2">Interview Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="interviewId"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interview ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="jobNo"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Job</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a job..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {jobs.map(job => (
                                                    <SelectItem key={job.REQUESTNO} value={String(job.REQUESTNO)}>{job.DESIGNATION}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="jobSeekerId"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Applicant</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!applicants.length}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an applicant..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                 {applicants.map(app => (
                                                    <SelectItem key={app.JOBSEEKERREGNO} value={String(app.JOBSEEKERREGNO)}>{app.JOBSEEKERNAME}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="interviewDate"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interview Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="interviewTime"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interview Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="conductedBy"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interview Conducted By</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g., John Doe" />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="interviewRound"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interview Round</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="interviewStatus"
                                    render={({ field }) => (
                                        <FormItem className="lg:col-span-2">
                                        <FormLabel>Interview Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a status..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                 <SelectItem value="REJECTED">REJECTED</SelectItem>
                                                 <SelectItem value="PROCEED TO ROUND 2">PROCEED TO ROUND 2</SelectItem>
                                                 <SelectItem value="PROCEED TO SHARE WITH RECRUITER">PROCEED TO SHARE WITH RECRUITER</SelectItem>
                                                 <SelectItem value="ACCEPTED BY RECRUITER">ACCEPTED BY RECRUITER</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                             <FormField
                                control={form.control}
                                name="headerNarration"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Header Narration</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Initial notes or summary for the interview..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator className="my-8" />
                            <h3 className="text-lg font-semibold border-b pb-2">Interview Assessments</h3>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-muted/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold">{form.watch(`assessments.${index}.assessmentName`)}</h4>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`assessments.${index}.narration`}
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Assessment Narration</FormLabel>
                                                <FormControl><Textarea {...field} /></FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name={`assessments.${index}.score`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Score</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={cn(
                                                                        "h-6 w-6 cursor-pointer",
                                                                        field.value >= star
                                                                        ? "text-yellow-400 fill-yellow-400"
                                                                        : "text-muted-foreground"
                                                                    )}
                                                                    onClick={() => field.onChange(star)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </Card>
                                ))}
                            </div>

                            <Select onValueChange={(value) => {
                                const selectedMaster = assessmentMasters.find(m => String(m.ASSESSMENTID) === value);
                                if (selectedMaster && !fields.some(f => f.assessmentId === value)) {
                                    append({ 
                                        assessmentId: value, 
                                        assessmentName: selectedMaster.ASSESSMENTNAME,
                                        narration: '', 
                                        score: 0 
                                    });
                                } else {
                                    toast({ title: "Already Added", description: "This assessment has already been added.", variant: "default" });
                                }
                            }}>
                                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                                    <SelectValue placeholder="Click to add an assessment..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {assessmentMasters.map(master => (
                                        <SelectItem key={master.ASSESSMENTID} value={String(master.ASSESSMENTID)}>
                                            {master.ASSESSMENTNAME}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                             <Separator className="my-8" />

                             <FormField
                                control={form.control}
                                name="closureNarration"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Interview Closure Narration</FormLabel>
                                    <FormControl>
                                        <JoditEditor
                                            value={field.value || ""}
                                            config={joditConfig}
                                            onBlur={newContent => field.onChange(newContent)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Interview...</>
                                    ) : (
                                    "Save Interview"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
