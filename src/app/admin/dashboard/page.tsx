
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, UserCheck, History, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Stats {
    recruiters: number;
    seekers: number;
    jobs: number;
    interviews: number;
}

export default function AdminDashboardPage() {
    const [user, setUser] = useState<any | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
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
                    recruiters: recruitersRes.data?.length || 0,
                    seekers: seekersRes.data?.length || 0,
                    jobs: jobsRes.data?.length || 0,
                    interviews: interviewsRes.data?.length || 0,
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
                    <CardDescription>An overview of all platform activity.</CardDescription>
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
                                    <div className="text-2xl font-bold">{stats?.recruiters}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Job Seekers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.seekers}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.jobs}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Interviews Conducted</CardTitle>
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.interviews}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                    <CardDescription>Additional key metrics for the HouseOfHire platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>More detailed platform analytics and charts can be added here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
