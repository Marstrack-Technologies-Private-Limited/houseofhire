
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { applyForJobAction } from "@/actions/apply-job-action";
import { TrackApplicationDialog } from "@/components/track-application-dialog";
import { Input } from "@/components/ui/input";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Job {
    REQUESTNO: number;
    DESIGNATION: string;
    COUNTRY: string;
    CITY: string;
    DEADLINEDATE: string;
    NARRATION: string;
    RECRUITERID: number;
    RECRUITERCOMPANYNAME?: string;
}

export default function FindJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<number | null>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const jobsResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } });
        const recruitersResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=521`, { headers: { "session-token": BASEURL_SESSION_TOKEN } });
        
        const recruitersMap = new Map(recruitersResponse.data.map((r: any) => [r.RECRUITERID, r.RECRUITERCOMPANYNAME]));

        const jobsWithCompany = jobsResponse.data.map((job: Job) => ({
          ...job,
          RECRUITERCOMPANYNAME: recruitersMap.get(job.RECRUITERID) || "Unknown Company"
        }));

        setJobs(jobsWithCompany);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({ title: "Error", description: "Could not fetch jobs.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [toast]);
  
  const handleApply = async (requestNo: number) => {
      if (!currentUser?.JOBSEEKERREGNO) {
          toast({ title: "Error", description: "You must be logged in to apply.", variant: "destructive" });
          return;
      }
      setIsApplying(requestNo);
      const result = await applyForJobAction({ requestNo, jobSeekerRegNo: currentUser.JOBSEEKERREGNO });
       if (result.success) {
           toast({ title: "Success", description: result.message });
       } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
       }
      setIsApplying(null);
  }
  
  const filteredJobs = useMemo(() => {
      return jobs.filter(job => {
          const searchLower = search.toLowerCase();
          return searchLower === "" ||
              job.DESIGNATION.toLowerCase().includes(searchLower) ||
              job.RECRUITERCOMPANYNAME?.toLowerCase().includes(searchLower) ||
              job.CITY.toLowerCase().includes(searchLower) ||
              job.COUNTRY.toLowerCase().includes(searchLower);
      });
  }, [jobs, search]);

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Your Next Job</h1>
        <p className="text-muted-foreground">Browse through the available job openings.</p>
      </div>

       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search by job title, company, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-sm"
          />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <h3 className="text-xl font-semibold">No Jobs Found</h3>
          <p className="text-muted-foreground mt-2">No jobs match your search criteria. Please check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, index) => (
            <Card key={`${job.REQUESTNO}-${index}`} className="flex flex-col">
              <CardHeader>
                <CardTitle>{job.DESIGNATION}</CardTitle>
                <CardDescription>{job.RECRUITERCOMPANYNAME} - {job.CITY}, {job.COUNTRY}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                 <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: job.NARRATION }} />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                 <p className="text-xs text-muted-foreground"><strong>Application Deadline:</strong> {format(new Date(job.DEADLINEDATE), 'PPP')}</p>
                 <div className="flex w-full gap-2">
                    <Button className="w-full" onClick={() => handleApply(job.REQUESTNO)} disabled={isApplying === job.REQUESTNO}>
                        {isApplying === job.REQUESTNO ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</> : "Apply Now"}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => setIsTracking(job.REQUESTNO)}>
                        Track Application
                    </Button>
                 </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
    {isTracking !== null && currentUser?.JOBSEEKERREGNO && (
        <TrackApplicationDialog
            requestNo={isTracking}
            jobSeekerRegNo={currentUser.JOBSEEKERREGNO}
            onClose={() => setIsTracking(null)}
        />
    )}
    </>
  );
}
