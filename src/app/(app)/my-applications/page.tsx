
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN =
  process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Application {
  APPLICATIONNO: number;
  REQUESTNO: number;
  JOBSEEKERREGNO: number;
  DATEOFAPPLICATION: string;
  STATUSOFAPPLICATION: string;
  DESIGNATION?: string; // To be joined
  RECRUITERCOMPANYNAME?: string; // To be joined
}

const steps = ["APPLIED", "IN PROGRESS", "HOLD", "ACCEPTED", "REJECTED" ];


const TrackStatusDialog = ({ application, onClose }: { application: Application | null; onClose: () => void; }) => {
    if (!application) return null;
    
    const currentStatusIndex = steps.indexOf(application.STATUSOFAPPLICATION);


    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Application #{application.APPLICATIONNO} Status</DialogTitle>
                    <DialogDescription>Track the progress of your application for {application.DESIGNATION}.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex flex-col gap-4">
                    {steps.map((step, i) => {
                        const isCompleted = currentStatusIndex >= i;
                        const isActive = currentStatusIndex === i;

                        return (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg border 
                            ${ isCompleted ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700" : "border-border"}
                            `}
                        >
                            <div
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs
                                ${isCompleted ? "bg-green-600" : "bg-muted-foreground"}
                            `}
                            >
                            {i + 1}
                            </div>
                            <span className={`font-medium ${isActive ? "text-green-600 dark:text-green-400" : ""}`} >
                            {step}
                            </span>
                        </div>
                        );
                    })}
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Application | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.JOBSEEKERREGNO) {
      return;
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const [appsResponse, jobsResponse, recruitersResponse] =
          await Promise.all([
            axios.get(
              `${BASEURL}/globalViewHandler?viewname=1157&JOBSEEKERREGNO=${currentUser.JOBSEEKERREGNO}`,
              { headers: { "session-token": BASEURL_SESSION_TOKEN } }
            ),
            axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, {
              headers: { "session-token": BASEURL_SESSION_TOKEN },
            }),
            axios.get(`${BASEURL}/globalViewHandler?viewname=521`, {
              headers: { "session-token": BASEURL_SESSION_TOKEN },
            }),
          ]);

        const jobsMap = new Map(
          jobsResponse.data.map((j: any) => [
            j.REQUESTNO,
            { designation: j.DESIGNATION, recruiterId: j.RECRUITERID },
          ])
        );
        const recruitersMap = new Map(
          recruitersResponse.data.map((r: any) => [
            r.RECRUITERID,
            r.RECRUITERCOMPANYNAME,
          ])
        );

        const enrichedApplications = appsResponse.data.map(
          (app: any) => { // Use any here temporarily
            const job = jobsMap.get(app.REQUESTNO);
            const companyName = job
              ? recruitersMap.get(job.recruiterId)
              : "Unknown Company";
            return {
              ...app,
              DESIGNATION: job?.designation || "Unknown Job",
              RECRUITERCOMPANYNAME: companyName,
              // Make sure the property names match the new component
              DATEOFAPPLICATION: app.DATEOFAPPLICATION,
              STATUSOFAPPLICATION: app.STATUSOFAPPLICATION,
            };
          }
        );

        setApplications(enrichedApplications);
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast({
          title: "Error",
          description: "Could not fetch your applications.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser, toast]);


  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
        const searchData = search.toLowerCase().trim();
        const textMatch = !searchData || [
            item.DESIGNATION,
            item.RECRUITERCOMPANYNAME,
            item.STATUSOFAPPLICATION,
            String(item.APPLICATIONNO),
        ].some(val => val?.toLowerCase().includes(searchData));

        const itemDate = item.DATEOFAPPLICATION ? new Date(item.DATEOFAPPLICATION) : null;
        let dateMatch = true;
        if (itemDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            dateMatch = (!start || itemDate >= start) && (!end || itemDate <= end);
        } else if (startDate || endDate) {
            dateMatch = false;
        }

        return textMatch && dateMatch;
    });
  }, [applications, search, startDate, endDate]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of all your job applications.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application History</CardTitle>
            <CardDescription>
              A complete log of your job submissions. Use the filters to narrow your search.
            </CardDescription>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                 <Button variant="outline" onClick={() => {setSearch(""); setStartDate(""); setEndDate("");}}>Clear Filters</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-10">
                 <h3 className="text-xl font-semibold">No Applications Found</h3>
                <p className="text-muted-foreground mt-2">
                  You haven't applied to any jobs yet or no results match your filters.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app, index) => (
                    <TableRow key={`${app.APPLICATIONNO}-${index}`}>
                      <TableCell className="font-medium">
                        {app.DESIGNATION}
                      </TableCell>
                      <TableCell>{app.RECRUITERCOMPANYNAME}</TableCell>
                      <TableCell>
                        {app.DATEOFAPPLICATION
                          ? format(new Date(app.DATEOFAPPLICATION), "PPP")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{app.STATUSOFAPPLICATION || 'APPLIED'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                          <Button variant="secondary" onClick={() => setSelectedTrack(app)}>Track</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <TrackStatusDialog application={selectedTrack} onClose={() => setSelectedTrack(null)} />
    </>
  );
}
