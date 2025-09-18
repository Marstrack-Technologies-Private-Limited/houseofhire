
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
import { Loader2, Globe, Building, MapPin } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN =
  process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface RecruiterInfoDialogProps {
  recruiterId: number;
  onClose: () => void;
}

interface RecruiterInfo {
    RECRUITERCOMPANYNAME: string;
    COUNTRY: string;
    CITY: string;
    OM_RECRUITER_WEBSITE?: string;
    OM_RECRUITER_COMPANY_INFORMATION?: string;
}

const DetailItem = ({ icon, label, value }: { icon: React.ElementType, label: string, value: any }) => (
    value ? <div>
        <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <icon className="h-4 w-4" /> {label}
        </p>
        <p className="font-semibold ml-6">{value}</p>
    </div> : null
);

export function RecruiterInfoDialog({
  recruiterId,
  onClose,
}: RecruiterInfoDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [recruiterInfo, setRecruiterInfo] =
    React.useState<RecruiterInfo | null>(null);

  React.useEffect(() => {
    if (!recruiterId) return;

    const fetchRecruiterInfo = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BASEURL}/globalViewHandler?viewname=521&RECRUITERID=${recruiterId}`,
          { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
        if (response.data && response.data.length > 0) {
          setRecruiterInfo(response.data[0]);
        } else {
          toast({
            title: "Not Found",
            description: "Could not find company details.",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch company details.",
          variant: "destructive",
        });
        console.error("Error fetching company details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecruiterInfo();
  }, [recruiterId, toast, onClose]);
  

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            About {recruiterInfo?.RECRUITERCOMPANYNAME}
          </DialogTitle>
          <DialogDescription>
            Learn more about the company.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recruiterInfo ? (
             <ScrollArea className="h-[60vh]">
                <div className="space-y-6 pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem icon={Building} label="Company Name" value={recruiterInfo.RECRUITERCOMPANYNAME} />
                        <DetailItem icon={MapPin} label="Head Office" value={`${recruiterInfo.CITY}, ${recruiterInfo.COUNTRY}`} />
                    </div>
                     {recruiterInfo.OM_RECRUITER_WEBSITE && (
                        <DetailItem icon={Globe} label="Website" value={<Link href={recruiterInfo.OM_RECRUITER_WEBSITE} target="_blank" className="text-primary hover:underline">{recruiterInfo.OM_RECRUITER_WEBSITE}</Link>} />
                    )}

                    {recruiterInfo.OM_RECRUITER_COMPANY_INFORMATION && (
                         <div>
                            <h4 className="font-semibold text-lg mb-2">Company Information</h4>
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none" 
                                dangerouslySetInnerHTML={{ __html: recruiterInfo.OM_RECRUITER_COMPANY_INFORMATION }} 
                            />
                        </div>
                    )}
                </div>
             </ScrollArea>
          ) : (
            <div className="text-muted-foreground text-center py-16">
              Could not load company information.
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

    