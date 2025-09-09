
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
import { Loader2, Eye, Badge } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { Separator } from "./ui/separator";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN =
  process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface RecruiterProfileDialogProps {
  recruiterId: number;
  onClose: () => void;
}

interface RecruiterDetails {
    RECRUITERID: number;
    RECRUITERCOMPANYNAME: string;
    COUNTRY: string;
    CITY: string;
    PHYSICALADDRESS: string;
    GEOCOORDINATES: string;
    EMAILADDRESS: string;
    MOBILENUMBER: string;
    OFFICENUMBER: string;
    POINTOFCONTACT: string;
    KRAPINNO: string;
    BUSINESSLINE: string;
    SPECIFICREQUIREMENT: string;
    KRAPIN: string;
    COMPLIANCECERTIFICATE: string;
    SELFHIRING: boolean | null;
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

export function RecruiterProfileDialog({
  recruiterId,
  onClose,
}: RecruiterProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [recruiterData, setRecruiterData] =
    React.useState<RecruiterDetails | null>(null);

  React.useEffect(() => {
    const fetchRecruiterData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/globalViewHandler?viewname=521&RECRUITERID=${recruiterId}`,
          { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        if (response.data && response.data.length > 0) {
          setRecruiterData(response.data[0]);
        } else {
          toast({
            title: "Not Found",
            description: "Could not find recruiter details.",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch recruiter details.",
          variant: "destructive",
        });
        console.error("Error fetching recruiter details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecruiterData();
  }, [recruiterId, toast, onClose]);
  

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Recruiter Profile: {recruiterData?.RECRUITERCOMPANYNAME}
          </DialogTitle>
          <DialogDescription>
            Full details for the selected recruiter.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recruiterData ? (
             <ScrollArea className="h-[60vh]">
                <div className="space-y-6 pr-6">
                    
                    <h3 className="text-2xl font-bold">{recruiterData.RECRUITERCOMPANYNAME}</h3>

                    <Separator />
                    
                    <h4 className="font-semibold text-lg">Company Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Business Line" value={recruiterData.BUSINESSLINE} />
                        <DetailItem label="KRA PIN" value={recruiterData.KRAPINNO} />
                        <DetailItem label="Contact Person" value={recruiterData.POINTOFCONTACT} />
                        <DetailItem label="Email Address" value={recruiterData.EMAILADDRESS} />
                        <DetailItem label="Mobile Number" value={recruiterData.MOBILENUMBER} />
                        <DetailItem label="Office Number" value={recruiterData.OFFICENUMBER} />
                        <DetailItem label="Country" value={recruiterData.COUNTRY} />
                        <DetailItem label="City" value={recruiterData.CITY} />
                        <DetailItem label="Geo-Coordinates" value={recruiterData.GEOCOORDINATES} />
                    </div>
                     <DetailItem label="Physical Address" value={recruiterData.PHYSICALADDRESS} />
                     <DetailItem label="Specific Requirements" value={recruiterData.SPECIFICREQUIREMENT} />
                     <DetailItem label="Self-Hiring Model" value={<Badge variant={recruiterData.SELFHIRING ? "default" : "secondary"}>{recruiterData.SELFHIRING ? 'Enabled' : 'Disabled'}</Badge>} />

                    <Separator />

                    <h4 className="font-semibold text-lg">Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <DocumentItem label="KRA PIN Certificate" url={recruiterData.KRAPIN} />
                       <DocumentItem label="Tax Compliance Certificate" url={recruiterData.COMPLIANCECERTIFICATE} />
                    </div>
                </div>
             </ScrollArea>
          ) : (
            <div className="text-muted-foreground text-center py-16">
              Could not load recruiter profile.
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
