
"use client";

import * as React from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { Separator } from "./ui/separator";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN =
  process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface CandidateProfileDialogProps {
  jobSeekerRegNo: number;
  onClose: () => void;
}

interface CandidateDetails {
    JOBSEEKERNAME: string;
    MIDDLENAME?: string;
    LASTNAME: string;
    EMAILADDRESS: string;
    MOBILENO: string;
    DOB: string;
    NATIONALITY: string;
    CITY: string;
    COUNTRYRESIDENCE: string;
    ADDRESSDETAILS: string;
    TRIBE: string;
    SPECIALIZATION: string;
    QUALIFICATION: string;
    EXPERIENCELEVEL: string;
    PREVIOUSCOMPANY: string;
    REASONOFLEAVING: string;
    LASTCOMPANYLEFTDATE: string;
    PHOTOATTACHMENT: string;
    LICENSEATTACHMENT: string;
    NATIONAIDATTACHMENT: string;
    PASSPORTATTACHMENT: string;
    RECOMMENDATIONLETTERATTACHMENT: string;
    NOCATTACHMENT: string;
    CVATTACHMENT?: string; // This name comes from the seeker table
    OM_JOB_SEEKER_CV_ATTACHMENT?: string; // This name comes from application data
}

const DetailItem = ({ label, value }: { label: string, value: any }) => (
    value ? <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
    </div> : null
);

const DocumentItem = ({ label, url }: { label: string, url?: string }) => (
    url ? <div className="flex items-center justify-between rounded-lg border p-3">
        <p className="font-medium">{label}</p>
        <Button asChild variant="outline" size="sm">
            <Link href={url} target="_blank"><Eye className="mr-2 h-4 w-4" />View</Link>
        </Button>
    </div> : null
)

export function CandidateProfileDialog({
  jobSeekerRegNo,
  onClose,
}: CandidateProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [candidateData, setCandidateData] =
    React.useState<CandidateDetails | null>(null);

  React.useEffect(() => {
    const fetchCandidateData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/globalViewHandler?viewname=1154&JOBSEEKERREGNO=${jobSeekerRegNo}`,
          { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        if (response.data && response.data.length > 0) {
          setCandidateData(response.data[0]);
        } else {
          toast({
            title: "Not Found",
            description: "Could not find candidate details.",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch candidate details.",
          variant: "destructive",
        });
        console.error("Error fetching candidate details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidateData();
  }, [jobSeekerRegNo, toast, onClose]);
  

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Candidate Profile: {candidateData?.JOBSEEKERNAME} {candidateData?.LASTNAME}
          </DialogTitle>
          <DialogDescription>
            Full details for the selected candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : candidateData ? (
             <ScrollArea className="h-[60vh]">
                <div className="space-y-6 pr-6">
                    
                    <div className="flex items-start gap-6">
                        {candidateData.PHOTOATTACHMENT && (
                             <img src={candidateData.PHOTOATTACHMENT} alt="Candidate photo" className="w-24 h-24 rounded-full object-cover border" />
                        )}
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold">{candidateData.JOBSEEKERNAME} {candidateData.MIDDLENAME} {candidateData.LASTNAME}</h3>
                            <p className="text-muted-foreground">{candidateData.EMAILADDRESS}</p>
                            <p className="text-muted-foreground">{candidateData.MOBILENO}</p>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <h4 className="font-semibold text-lg">Personal Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Date of Birth" value={candidateData.DOB ? format(new Date(candidateData.DOB), 'PPP') : 'N/A'} />
                        <DetailItem label="Nationality" value={candidateData.NATIONALITY} />
                        <DetailItem label="Tribe/Cast" value={candidateData.TRIBE} />
                        <DetailItem label="Country of Residence" value={candidateData.COUNTRYRESIDENCE} />
                        <DetailItem label="City" value={candidateData.CITY} />
                    </div>
                     <DetailItem label="Address" value={candidateData.ADDRESSDETAILS} />

                    <Separator />

                    <h4 className="font-semibold text-lg">Professional Background</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Specialization" value={candidateData.SPECIALIZATION} />
                        <DetailItem label="Highest Qualification" value={candidateData.QUALIFICATION} />
                        <DetailItem label="Experience Level" value={candidateData.EXPERIENCELEVEL} />
                        <DetailItem label="Previous Company" value={candidateData.PREVIOUSCOMPANY} />
                        <DetailItem label="Reason for Leaving" value={candidateData.REASONOFLEAVING} />
                        <DetailItem label="Date Left" value={candidateData.LASTCOMPANYLEFTDATE ? format(new Date(candidateData.LASTCOMPANYLEFTDATE), 'PPP') : 'N/A'} />
                    </div>

                    <Separator />

                    <h4 className="font-semibold text-lg">Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <DocumentItem label="CV / Resume" url={candidateData.CVATTACHMENT || candidateData.OM_JOB_SEEKER_CV_ATTACHMENT} />
                       <DocumentItem label="Driving License" url={candidateData.LICENSEATTACHMENT} />
                       <DocumentItem label="National ID" url={candidateData.NATIONAIDATTACHMENT} />
                       <DocumentItem label="Passport" url={candidateData.PASSPORTATTACHMENT} />
                       <DocumentItem label="Recommendation Letter" url={candidateData.RECOMMENDATIONLETTERATTACHMENT} />
                       <DocumentItem label="NOC" url={candidateData.NOCATTACHMENT} />
                    </div>
                </div>
             </ScrollArea>
          ) : (
            <div className="text-muted-foreground text-center py-16">
              Could not load candidate profile.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
