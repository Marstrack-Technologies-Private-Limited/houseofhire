
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
import { Loader2, PlusCircle, Edit, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Job {
    REQUESTNO: number;
    RECRUITERID: number;
    DESIGNATION: string;
    COUNTRY: string;
    CITY: string;
    DEADLINEDATE: string;
    REQUESTSTATUS: string;
    NARRATION: string;
}


export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    if (currentUser?.RECRUITERID) {
      const fetchJobs = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${BASEURL}/globalViewHandler?viewname=1155&RECRUITERID=${currentUser.RECRUITERID}`,
            { headers: { "session-token": BASEURL_SESSION_TOKEN } }
          );
          setJobs(response.data);
        } catch (error) {
          console.error("Error fetching jobs:", error);
          toast({
            title: "Error",
            description: "Could not fetch your job postings.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchJobs();
    }
  }, [currentUser, toast]);
  
  const filteredJobs = useMemo(() => {
      return jobs.filter(job => {
          const searchLower = search.toLowerCase();
          return searchLower === "" ||
              job.DESIGNATION.toLowerCase().includes(searchLower) ||
              job.REQUESTSTATUS.toLowerCase().includes(searchLower);
      })
  }, [jobs, search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Your Job Postings</h1>
          <p className="text-muted-foreground">
            Manage your company's open positions.
          </p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post a New Job
          </Link>
        </Button>
      </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search by job title or status..."
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
            <p className="text-muted-foreground mt-2">No jobs match your search. Try posting one!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, index) => (
            <Card key={`${job.REQUESTNO}-${index}`} className="flex flex-col">
              <CardHeader>
                <CardTitle>{job.DESIGNATION}</CardTitle>
                <CardDescription>
                  {job.CITY}, {job.COUNTRY}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                <p><strong>Status:</strong> {job.REQUESTSTATUS}</p>
                <p><strong>Deadline:</strong> {format(new Date(job.DEADLINEDATE), 'PPP')}</p>
                 <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: job.NARRATION }} />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild className="w-full">
                  <Link href={`/applications?jobId=${job.REQUESTNO}`}>View Applications</Link>
                </Button>
                 <Button asChild variant="secondary">
                  <Link href={`/jobs/edit/${job.REQUESTNO}`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
