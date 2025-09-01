
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
import { useToast } from "@/hooks/use-toast";
import { trackApplicationAction } from "@/actions/apply-job-action";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

interface TrackApplicationDialogProps {
  requestNo: number;
  jobSeekerRegNo: number;
  onClose: () => void;
}

interface TrackData {
    STATUS: string;
    APPLICATIONDATE: string;
}

export function TrackApplicationDialog({ requestNo, jobSeekerRegNo, onClose }: TrackApplicationDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [trackData, setTrackData] = React.useState<TrackData | null>(null);

  React.useEffect(() => {
    const fetchTrackingData = async () => {
        setIsLoading(true);
        const result = await trackApplicationAction({ requestNo, jobSeekerRegNo });
        if (result.success && result.data?.length > 0) {
            setTrackData(result.data[0]);
        } else if (result.success) {
             setTrackData(null); // Not applied yet
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsLoading(false);
    };
    fetchTrackingData();
  }, [requestNo, jobSeekerRegNo, toast]);
  

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Track Application Status</DialogTitle>
          <DialogDescription>
            View the current status of your job application.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trackData ? (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={trackData.STATUS === "APPROVED" ? "default" : "secondary"}>
                        {trackData.STATUS || "Pending"}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Applied On:</span>
                    <span className="font-medium">{format(new Date(trackData.APPLICATIONDATE), 'PPP')}</span>
                </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8">
              You have not applied for this job yet.
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

