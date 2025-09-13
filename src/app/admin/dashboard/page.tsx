
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, UserCheck, History, Loader2, Activity } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/date-range-picker";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface ApiData {
  seekers: any[];
  recruiters: any[];
  jobs: any[];
  interviews: any[];
}

const AnalyticsSection = () => {
    const [data, setData] = React.useState<ApiData | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = React.useState(true);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });

    React.useEffect(() => {
        const fetchData = async () => {
            setIsAnalyticsLoading(true);
            try {
                const [seekersRes, recruitersRes, jobsRes, interviewsRes] = await Promise.all([
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=521`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1177`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                ]);
                setData({
                    seekers: seekersRes.data,
                    recruiters: recruitersRes.data,
                    jobs: jobsRes.data,
                    interviews: interviewsRes.data,
                });
            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setIsAnalyticsLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = React.useMemo(() => {
        if (!data || !dateRange?.from || !dateRange?.to) return [];

        const interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        
        return interval.map(day => {
            const formattedDate = format(day, "MMM dd");
            const dateStr = format(day, "yyyy-MM-dd");

            const dailySeekers = data.seekers.filter(s => s.CREATEDDATE?.startsWith(dateStr)).length;
            const dailyRecruiters = data.recruiters.filter(r => r.CREATEDDATE?.startsWith(dateStr)).length;
            const dailyJobs = data.jobs.filter(j => j.REQUESTDATE?.startsWith(dateStr)).length;
            const dailyInterviews = data.interviews.filter(i => i.INTERVIEWDATE?.startsWith(dateStr)).length;

            return {
                date: formattedDate,
                "Seeker Registrations": dailySeekers,
                "Recruiter Registrations": dailyRecruiters,
                "Jobs Posted": dailyJobs,
                "Interviews Conducted": dailyInterviews,
            };
        });
    }, [data, dateRange]);
    
     const handlePresetChange = (value: string) => {
        const now = new Date();
        if (value === 'this_month') {
            setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        } else if (value === 'last_30_days') {
            setDateRange({ from: addDays(now, -30), to: now });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                             <Activity /> Platform Analytics
                        </CardTitle>
                        <CardDescription>An overview of platform activity.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <Select onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a preset" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isAnalyticsLoading ? (
                    <div className="flex justify-center items-center h-80">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Legend />
                            <Bar dataKey="Seeker Registrations" stackId="a" fill="#8884d8" name="Seeker Registrations" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Recruiter Registrations" stackId="a" fill="#e5a140" name="Recruiter Registrations" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Jobs Posted" fill="#82ca9d" name="Jobs Posted" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Interviews Conducted" fill="#ffc658" name="Interviews" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};


export default function AdminDashboardPage() {
    const [user, setUser] = useState<any | null>(null);
    const [stats, setStats] = useState<ApiData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const [recruitersRes, seekersRes, jobsRes, interviewsRes] = await Promise.all([
                    axios.get(`${BASEURL}/globalViewHandler?viewname=521`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                    axios.get(`${BASEURL}/globalViewHandler?viewname=1177`, { headers: { "session-token": BASEURL_SESSION_TOKEN } }),
                ]);

                setStats({
                    recruiters: recruitersRes.data,
                    seekers: seekersRes.data,
                    jobs: jobsRes.data,
                    interviews: interviewsRes.data,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                toast({ title: "Error", description: "Could not load platform statistics.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [toast]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.userName || 'Admin'}!
                    </p>
                </div>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Platform Statistics</CardTitle>
                    <CardDescription>An at-a-glance overview of all platform activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Recruiters</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.recruiters?.length || 0}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Job Seekers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.seekers?.length || 0}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.jobs?.length || 0}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Interviews Conducted</CardTitle>
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.interviews?.length || 0}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <AnalyticsSection />
        </div>
    );
}
