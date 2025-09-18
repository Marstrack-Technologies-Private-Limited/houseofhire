
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Briefcase, Calendar, Clock, DollarSign, Globe, MapPin, Users } from "lucide-react";
import { usePathname } from "next/navigation";

interface Job {
    REQUESTNO: number;
    DESIGNATION: string;
    COUNTRY: string;
    CITY: string;
    DEADLINEDATE: string;
    NARRATION: string;
    RECRUITERID: number;
    RECRUITERCOMPANYNAME?: string;
    REQUESTDATE: string;
    JOBSEEKERCOUNT: number;
    URGENCYLEVEL: string;
    REQUESTSTATUS: string;
    EXPERIENCELEVEL: string;
    TYPEOFCONTRACT: string;
    MINQUALIFICATION: string;
    TERMSANDCONDITIONS: string;
    RECRUITERWEBSITE?: string;
    COMPANYINFORMATION?: string;
}

interface JobDetailsDialogProps {
  job: Job;
  onClose: () => void;
  onApplyNow: () => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
  value ? (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <icon className="h-5 w-5" />
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  ) : null
);

export function JobDetailsDialog({ job, onClose, onApplyNow }: JobDetailsDialogProps) {
    const isExpired = new Date(job.DEADLINEDATE) < new Date();
    const pathname = usePathname();
    const isAdminView = pathname.startsWith('/admin');

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.DESIGNATION}</DialogTitle>
          <DialogDescription>
            {job.RECRUITERCOMPANYNAME} &bull; {job.CITY}, {job.COUNTRY}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[65vh] pr-6">
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <DetailItem icon={MapPin} label="Location" value={`${job.CITY}, ${job.COUNTRY}`} />
                    <DetailItem icon={Briefcase} label="Contract Type" value={job.TYPEOFCONTRACT} />
                    <DetailItem icon={Users} label="Openings" value={job.JOBSEEKERCOUNT} />
                    <DetailItem icon={Calendar} label="Posted On" value={format(new Date(job.REQUESTDATE), 'PPP')} />
                    <DetailItem icon={Clock} label="Deadline" value={format(new Date(job.DEADLINEDATE), 'PPP')} />
                    <DetailItem icon={Globe} label="Experience Level" value={job.EXPERIENCELEVEL} />
                </div>
                 
                 <DetailItem 
                    label="Minimum Qualifications"
                    icon={Users}
                    value={<div className="flex flex-wrap gap-2">{job.MINQUALIFICATION?.split(',').map(q => <Badge key={q} variant="secondary">{q.trim()}</Badge>)}</div>}
                 />

                <Separator />
                
                <div>
                    <h3 className="font-semibold text-lg mb-2">Job Description</h3>
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: job.NARRATION }} 
                    />
                </div>
                
                {job.TERMSANDCONDITIONS && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Terms and Conditions</h3>
                             <div 
                                className="prose prose-sm dark:prose-invert max-w-none" 
                                dangerouslySetInnerHTML={{ __html: job.TERMSANDCONDITIONS }} 
                            />
                        </div>
                    </>
                )}

            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isAdminView && (
              <Button onClick={onApplyNow} disabled={isExpired}>
                {isExpired ? "Deadline Passed" : "Apply Now"}
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    