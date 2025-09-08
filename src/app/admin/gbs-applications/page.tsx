
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
import { Loader2, File } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface GbsApplication {
    APPLICATIONNO: number;
    JOBSEEKERREGNO: number;
    JOBSEEKERNAME?: string; // Will be enriched
    RECRUITERID: number;
    RECRUITERCOMPANYNAME: string;
    DESIGNATION?: string; // Will be enriched
    DATEOFAPPLICATION: string;
    STATUSOFAPPLICATION: string;
    REQUESTNO: number;
    CVATTACHED?: string;
}

export default function GbsApplicationsPage() {
  const [applications, setApplications] = React.useState<GbsApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchApplications = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [appsResponse, jobsResponse, seekersResponse] = await Promise.all([
             axios.get(`${BASEURL}/globalViewHandler?viewname=1157&GBSPOSTED=true`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
             axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
             axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, { headers: { "session-token": BASEURL_SESSION_TOKEN } })
        ]);

      const jobsMap = new Map(jobsResponse.data.map((j: any) => [j.REQUESTNO, j.DESIGNATION]));
      const seekersMap = new Map(seekersResponse.data.map((s: any) => [s.JOBSEEKERREGNO, s.JOBSEEKERNAME]));

      const fetchedApplications = appsResponse.data.map((app: any) => ({
          ...app,
          JOBSEEKERNAME: seekersMap.get(app.JOBSEEKERREGNO) || 'N/A',
          DESIGNATION: jobsMap.get(app.REQUESTNO) || 'N/A',
      }));
      
      setApplications(fetchedApplications);

    } catch (error) {
        console.error("Error fetching GBS applications:", error);
        toast({ title: "Error", description: "Could not fetch GBS applications.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
        <Card>
            <CardHeader>
                <CardTitle>GBS-Submitted Applications</CardTitle>
                <CardDescription>Applications submitted by GBS administrators on behalf of job seekers.</CardDescription>
            </CardHeader>
            <CardContent>
           {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">No GBS Applications Found</h3>
                    <p className="text-muted-foreground mt-2">No applications have been submitted by admins yet.</p>
                </div>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">CV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app, index) => (
                <TableRow key={`${app.APPLICATIONNO}-${index}`}>
                   <TableCell className="font-mono text-xs">{app.APPLICATIONNO}</TableCell>
                  <TableCell className="font-medium">
                    {app.JOBSEEKERNAME}
                  </TableCell>
                  <TableCell>{app.DESIGNATION}</TableCell>
                  <TableCell>{app.RECRUITERCOMPANYNAME}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[app.STATUSOFAPPLICATION] || "secondary"}>
                      {app.STATUSOFAPPLICATION || 'Applied'}
                    </Badge>
                  </TableCell>
                  <TableCell>{app.DATEOFAPPLICATION ? format(new Date(app.DATEOFAPPLICATION), "PPP") : 'N/A'}</TableCell>
                  <TableCell className="text-right">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
