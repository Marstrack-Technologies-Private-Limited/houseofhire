
"use client";

import * as React from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Eye, Search, File } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { CandidateProfileDialog } from "@/components/candidate-profile-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { sendStatusUpdateEmailAction } from "@/actions/email-actions";


const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Application {
    APPLICATIONNO: number;
    JOBSEEKERREGNO: number;
    JOBSEEKERNAME: string;
    EMAILADDRESS: string;
    DESIGNATION: string;
    APPLIEDDATE: string;
    STATUS: string;
    REQUESTNO: number;
    CVATTACHED?: string;
}

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewingCandidateId, setViewingCandidateId] = React.useState<number | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

   React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
    }
  }, []);


  const fetchApplications = React.useCallback(async () => {
    if (!currentUser?.RECRUITERID) return;
    setIsLoading(true);
    try {
        const [appsResponse, jobsResponse, seekersResponse] = await Promise.all([
             axios.get(`${BASEURL}/globalViewHandler?viewname=1157&RECRUITERID=${currentUser.RECRUITERID}`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
             axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
             axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, { headers: { "session-token": BASEURL_SESSION_TOKEN } })
        ]);

      const jobsMap = new Map(jobsResponse.data.map((j: any) => [j.REQUESTNO, j.DESIGNATION]));
      const seekersMap = new Map(seekersResponse.data.map((s: any) => [s.JOBSEEKERREGNO, { name: s.JOBSEEKERNAME, email: s.EMAILADDRESS }]));

      let fetchedApplications = appsResponse.data.map((app: any) => {
          const seeker = seekersMap.get(app.JOBSEEKERREGNO);
          return {
              APPLICATIONNO: app.APPLICATIONNO,
              JOBSEEKERREGNO: app.JOBSEEKERREGNO,
              JOBSEEKERNAME: seeker?.name || 'N/A',
              EMAILADDRESS: seeker?.email || 'N/A',
              DESIGNATION: jobsMap.get(app.REQUESTNO) || 'N/A',
              APPLIEDDATE: app.DATEOFAPPLICATION,
              STATUS: app.STATUSOFAPPLICATION,
              REQUESTNO: app.REQUESTNO,
              CVATTACHED: app.CVATTACHED,
          }
      });
      
      if (jobId) {
          fetchedApplications = fetchedApplications.filter((app: Application) => String(app.REQUESTNO) === jobId);
      }
      setApplications(fetchedApplications);

    } catch (error) {
        console.error("Error fetching applications:", error);
        toast({ title: "Error", description: "Could not fetch applications.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, toast, jobId]);

  React.useEffect(() => {
    if (currentUser) {
      fetchApplications();
    }
  }, [currentUser, fetchApplications]);

  const handleUpdateStatus = async (application: Application, status: string) => {
     try {
      const response = await axios.post(
        `${BASEURL}/globalSpHandler?spname=253`,
        {
          APPLICATIONNO: Number(application.APPLICATIONNO),
          STATUSOFAPPLICATION: status,
          STATUSNARRATION: `Status updated to ${status} by recruiter.`,
          UPDATEDBY: currentUser.RECRUITERID,
          SUCCESS_STATUS: "",
          ERROR_STATUS: "",
        },
        { headers: { "session-token": BASEURL_SESSION_TOKEN } }
      );

      if (response?.data?.message?.includes("Saved")) {
        toast({ title: "Success", description: `Status updated to ${status}` });
        fetchApplications(); 
        
        // Asynchronously send email notification. We don't block the UI for this.
        sendStatusUpdateEmailAction({
            candidateName: application.JOBSEEKERNAME,
            candidateEmail: application.EMAILADDRESS,
            companyName: currentUser.RECRUITERCOMPANYNAME,
            jobTitle: application.DESIGNATION,
            status: status,
            applicationNo: application.APPLICATIONNO,
        }).then(emailResult => {
            if(emailResult.success) {
                toast({ title: "Email Sent", description: "Candidate has been notified via email.", variant: "default" });
            } else {
                console.error("Failed to send status update email:", emailResult.message);
                // Optionally show a non-blocking toast for email failure
                toast({ title: "Email Notice", description: "Could not send status update email to candidate.", variant: "destructive" });
            }
        });

      } else {
         toast({ title: "Error", description: response?.data?.message || "Failed to update status", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An error occurred while updating the status.", variant: "destructive" });
      console.error(err);
    }
  }

  const filteredApplications = React.useMemo(() => {
      return applications.filter(app => {
          const searchLower = search.toLowerCase();
          const matchesSearch = searchLower === "" ||
              app.JOBSEEKERNAME.toLowerCase().includes(searchLower) ||
              app.EMAILADDRESS.toLowerCase().includes(searchLower) ||
              app.DESIGNATION.toLowerCase().includes(searchLower);
          
          const matchesStatus = statusFilter === 'All' || app.STATUS === statusFilter;

          return matchesSearch && matchesStatus;
      });
  }, [applications, search, statusFilter]);

  const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    ACCEPTED: "default",
    APPLIED: "secondary",
    REJECTED: "destructive",
    HOLD: "outline",
    "IN PROGRESS": "outline",
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Review and manage candidates for your job postings.
          </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Filter Applications</CardTitle>
                <CardDescription>Narrow down applications by search or status.</CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                   <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, job..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="IN PROGRESS">In Progress</SelectItem>
                            <SelectItem value="HOLD">Hold</SelectItem>
                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("All"); }}>Clear Filters</Button>
                </div>
            </CardHeader>
            <CardContent>
           {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">No Applications Found</h3>
                    <p className="text-muted-foreground mt-2">No candidates match your current filters.</p>
                </div>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>CV</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app, index) => (
                <TableRow key={`${app.APPLICATIONNO}-${app.JOBSEEKERREGNO}-${app.JOBSEEKERNAME}-${index}`}>
                  <TableCell className="font-medium">
                    <div>{app.JOBSEEKERNAME}</div>
                    <div className="text-sm text-muted-foreground">{app.EMAILADDRESS}</div>
                  </TableCell>
                  <TableCell>{app.DESIGNATION}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[app.STATUS] || "secondary"}>
                      {app.STATUS || 'Applied'}
                    </Badge>
                  </TableCell>
                  <TableCell>{app.APPLIEDDATE ? format(new Date(app.APPLIEDDATE), "PPP") : 'N/A'}</TableCell>
                  <TableCell>
                    {app.CVATTACHED ? (
                      <Button asChild variant="ghost" size="icon">
                        <Link href={app.CVATTACHED} target="_blank">
                          <File className="h-4 w-4" />
                          <span className="sr-only">View CV</span>
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setViewingCandidateId(app.JOBSEEKERREGNO)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Profile</span>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingCandidateId(app.JOBSEEKERREGNO)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app, 'IN PROGRESS')}>Mark as In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app, 'HOLD')}>Put on Hold</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app, 'ACCEPTED')} className="text-green-600">Accept</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app, 'REJECTED')} className="text-destructive">Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          </CardContent>
        </Card>
      </div>
       {viewingCandidateId && (
        <CandidateProfileDialog
          jobSeekerRegNo={viewingCandidateId}
          onClose={() => setViewingCandidateId(null)}
        />
      )}
    </>
  );
}
