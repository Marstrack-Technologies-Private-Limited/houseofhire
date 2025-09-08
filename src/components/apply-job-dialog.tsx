
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { applyForJobAction, uploadFileAction } from "@/actions/apply-job-action";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";


interface Job {
    REQUESTNO: number;
    DESIGNATION: string;
}

interface ApplyJobDialogProps {
  job: Job;
  jobSeekerRegNo: number;
  onClose: () => void;
  onApplySuccess: () => void;
}

const formSchema = z.object({
  cvAttached: z.any().refine(file => file?.length == 1, "Please upload your CV."),
  coverLetter: z.any().optional(),
  reasonFitForApplication: z.string().min(20, "Please provide a more detailed reason (at least 20 characters)."),
});


export function ApplyJobDialog({ job, jobSeekerRegNo, onClose, onApplySuccess }: ApplyJobDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        cvAttached: undefined,
        coverLetter: undefined,
        reasonFitForApplication: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    // 1. Upload CV (mandatory)
    const cvFormData = new FormData();
    cvFormData.append("imageValue", values.cvAttached[0]);
    const cvUploadResult = await uploadFileAction(cvFormData);

    if (!cvUploadResult.success || !cvUploadResult.url) {
      toast({ title: "CV Upload Failed", description: cvUploadResult.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // 2. Upload Cover Letter (optional)
    let coverLetterUrl: string | undefined = undefined;
    if (values.coverLetter && values.coverLetter.length > 0) {
        const coverLetterFormData = new FormData();
        coverLetterFormData.append("imageValue", values.coverLetter[0]);
        const coverLetterUploadResult = await uploadFileAction(coverLetterFormData);
        if (!coverLetterUploadResult.success || !coverLetterUploadResult.url) {
            toast({ title: "Cover Letter Upload Failed", description: coverLetterUploadResult.message, variant: "destructive" });
            setIsLoading(false);
            return;
        }
        coverLetterUrl = coverLetterUploadResult.url;
    }


    // 3. Submit Application
    const applicationInput = {
      requestNo: job.REQUESTNO,
      jobSeekerRegNo: jobSeekerRegNo,
      cvAttached: cvUploadResult.url,
      coverLetter: coverLetterUrl,
      reasonFitForApplication: values.reasonFitForApplication,
      gbsPosted: 0,
    };

    const result = await applyForJobAction(applicationInput);

    if (result.success) {
      onApplySuccess();
    } else {
      toast({ title: "Application Failed", description: result.message, variant: "destructive" });
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply for {job.DESIGNATION}</DialogTitle>
          <DialogDescription>
            Please provide the required information below to complete your application.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                 <FormField
                    control={form.control}
                    name="reasonFitForApplication"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Why are you a good fit for this role?</FormLabel>
                        <FormControl>
                           <Textarea rows={5} placeholder="Explain why your skills and experience make you the ideal candidate..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                        "Submit Application"
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
