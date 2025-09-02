
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Briefcase, FileText, Users, DollarSign, Loader2 } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Application {
  APPLICATIONNO: number;
  REQUESTNO: number;
  JOBSEEKERREGNO: number;
  DATEOFAPPLICATION: string;
  STATUSOFAPPLICATION: string;
  DESIGNATION?: string;
  RECRUITERCOMPANYNAME?: string;
  JOBSEEKERNAME?: string;
}

const RecruiterDashboard = ({ currentUser }: { currentUser: any }) => {
    const [stats, setStats] = useState({ jobs: 0, applications: 0, shortlisted: 0, offered: 0 });
    const [recentApplications, setRecentApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.RECRUITERID) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [jobsResponse, appsResponse, seekersResponse] = await Promise.all([
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1155&RECRUITERID=${currentUser.RECRUITERID}`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1157&RECRUITERID=${currentUser.RECRUITERID}`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, { headers: { "session-token": BASEURL_SESSION_TOKEN } })
                ]);
                
                const jobsData = jobsResponse.data || [];
                const appsData = appsResponse.data || [];
                const seekersMap = new Map(seekersResponse.data.map((s: any) => [s.JOBSEEKERREGNO, s.JOBSEEKERNAME]));
                const jobsMap = new Map(jobsData.map((j: any) => [j.REQUESTNO, j.DESIGNATION]));

                const newStats = {
                    jobs: jobsData.length,
                    applications: appsData.length,
                    shortlisted: appsData.filter((a: any) => a.STATUSOFAPPLICATION === 'IN PROGRESS').length,
                    offered: appsData.filter((a: any) => a.STATUSOFAPPLICATION === 'ACCEPTED').length,
                };
                setStats(newStats);

                const enrichedApplications = appsData.map((app: any) => ({
                    ...app,
                    JOBSEEKERNAME: seekersMap.get(app.JOBSEEKERREGNO) || 'N/A',
                    DESIGNATION: jobsMap.get(app.REQUESTNO) || 'N/A',
                })).sort((a:any, b:any) => new Date(b.DATEOFAPPLICATION).getTime() - new Date(a.DATEOFAPPLICATION).getTime());

                setRecentApplications(enrichedApplications.slice(0, 5));

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);
    
    return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats.jobs}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats.applications}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats.shortlisted}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offered / Accepted</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats.offered}</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Newest candidates that applied to your jobs.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/applications">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentApplications.map((app, index) => (
                  <TableRow key={`${app.APPLICATIONNO}-${index}`}>
                      <TableCell className="font-medium">{app.JOBSEEKERNAME}</TableCell>
                      <TableCell>{app.DESIGNATION}</TableCell>
                      <TableCell><Badge variant="secondary">{app.STATUSOFAPPLICATION}</Badge></TableCell>
                      <TableCell className="text-right">{format(new Date(app.DATEOFAPPLICATION), 'PPP')}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
            )}
        </CardContent>
      </Card>
    </>
    )
}

const SeekerDashboard = ({ currentUser }: { currentUser: any }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.JOBSEEKERREGNO) return;

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

                const jobsMap = new Map(jobsResponse.data.map((j: any) => [j.REQUESTNO, { designation: j.DESIGNATION, recruiterId: j.RECRUITERID }]));
                const recruitersMap = new Map(recruitersResponse.data.map((r: any) => [r.RECRUITERID, r.RECRUITERCOMPANYNAME]));

                const enrichedApplications = appsResponse.data.map((app: Application) => {
                    const job = jobsMap.get(app.REQUESTNO);
                    const companyName = job ? recruitersMap.get(job.recruiterId) : "Unknown Company";
                    return {
                        ...app,
                        DESIGNATION: job?.designation || "Unknown Job",
                        RECRUITERCOMPANYNAME: companyName,
                    };
                });
                
                // Sort by date and take the last 5
                const sortedApps = enrichedApplications.sort((a, b) => new Date(b.DATEOFAPPLICATION).getTime() - new Date(a.DATEOFAPPLICATION).getTime());
                setApplications(sortedApps.slice(0, 5));

            } catch (error) {
                console.error("Error fetching recent applications:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchApplications();

    }, [currentUser]);


    const positiveReplies = applications.filter(a => ['IN PROGRESS', 'HOLD', 'ACCEPTED'].includes(a.STATUSOFAPPLICATION)).length;

    return (
    <>
      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Welcome Back, {currentUser?.JOBSEEKERNAME || 'User'}!</CardTitle>
            <CardDescription>Here&apos;s a summary of your job search activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
             <div className="flex items-center space-x-4 rounded-md border p-4">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Applications Sent</p>
                    <p className="text-2xl font-bold">{applications.length}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
                <Users className="h-8 w-8 text-green-500" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Positive Replies</p>
                    <p className="text-2xl font-bold">{positiveReplies}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Recommended Jobs</p>
                    <p className="text-2xl font-bold">12</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Recent Application Status</CardTitle>
                <CardDescription>Updates on your recent job applications.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/my-applications">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applied On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app, index) => (
                <TableRow key={`${app.APPLICATIONNO}-${index}`}>
                  <TableCell className="font-medium">{app.DESIGNATION}</TableCell>
                  <TableCell>{app.RECRUITERCOMPANYNAME}</TableCell>
                  <TableCell><Badge variant={app.STATUSOFAPPLICATION === "ACCEPTED" ? "default" : "secondary"}>{app.STATUSOFAPPLICATION || 'APPLIED'}</Badge></TableCell>
                  <TableCell className="text-right">{app.DATEOFAPPLICATION ? format(new Date(app.DATEOFAPPLICATION), 'PPP') : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </>
    )
}

export default function DashboardPage() {
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
        }
        setIsLoading(false);
    }, []);


    if (isLoading || !currentUser) {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
             </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome to your {currentUser.role} dashboard.
                    </p>
                </div>
            </div>
            
            {currentUser.role === 'recruiter' ? <RecruiterDashboard currentUser={currentUser} /> : <SeekerDashboard currentUser={currentUser} />}
        </div>
    );
}
