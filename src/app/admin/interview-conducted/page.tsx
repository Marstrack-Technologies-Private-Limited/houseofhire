
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Loader2, Search, List, LayoutGrid, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Interview {
    INTERVIEWID: number;
    JOBNO: number;
    JOBSEEKERID: number;
    JOBSEEKERNAME: string;
    INTERVIEWDATE: string;
    INTERVIEWTIME: string;
    CONDUCTEDBY: string;
    ROUNDOFINTERVIEW: number;
    INTERVIEWSTATUS: string;
    CLOSURENARRATION: string;
    JOB_DESIGNATION?: string; 
}

interface Assessment {
    ASSESSMENTNAME: string;
    NARRATION: string;
    SCORE: number;
}

const AssessmentDialog = ({ isOpen, onClose, interviewId }: { isOpen: boolean; onClose: () => void; interviewId: number | null }) => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!interviewId) return;

        const fetchAssessments = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1181&INTERVIEWID=${interviewId}`, {
                    headers: { "session-token": BASEURL_SESSION_TOKEN }
                });
                setAssessments(response.data);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch assessments.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessments();
    }, [interviewId, toast]);

    const renderStars = (score: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < score ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Interview Assessments</DialogTitle>
                    <DialogDescription>Review the assessments for this interview.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] py-4 pr-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : assessments.length > 0 ? (
                        <div className="space-y-4">
                            {assessments.map((item, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">{item.ASSESSMENTNAME}</CardTitle>
                                            <div className="flex items-center gap-1">{renderStars(item.SCORE)}</div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{item.NARRATION}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No assessments found for this interview.</p>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function InterviewConductedPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewingAssessmentsId, setViewingAssessmentsId] = useState<number | null>(null);

    const fetchInterviews = useCallback(async () => {
        setIsLoading(true);
        try {
            const [interviewsRes, jobsRes] = await Promise.all([
                axios.get(`${BASEURL}/globalViewHandler?viewname=1177`, {
                    headers: { "session-token": BASEURL_SESSION_TOKEN }
                }),
                axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, {
                    headers: { "session-token": BASEURL_SESSION_TOKEN }
                })
            ]);

            const jobsMap = new Map(jobsRes.data.map((j: any) => [j.REQUESTNO, j.DESIGNATION]));
            const enrichedInterviews = interviewsRes.data.map((iv: Interview) => ({
                ...iv,
                JOB_DESIGNATION: jobsMap.get(iv.JOBNO) || "Unknown Job"
            }));
            
            setInterviews(enrichedInterviews);
        } catch (error) {
            console.error("Error fetching interviews:", error);
            toast({ title: "Error", description: "Could not fetch conducted interviews.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const handleProceed = (interview: Interview) => {
        router.push(`/admin/new-interview?jobNo=${interview.JOBNO}&seekerId=${interview.JOBSEEKERID}&round=${interview.ROUNDOFINTERVIEW + 1}`);
    };
    
    const filteredInterviews = useMemo(() => {
        return interviews.filter(iv => {
            const searchLower = search.toLowerCase();
            const textMatch = searchLower === "" ||
                iv.JOBSEEKERNAME.toLowerCase().includes(searchLower) ||
                iv.JOB_DESIGNATION?.toLowerCase().includes(searchLower) ||
                iv.CONDUCTEDBY.toLowerCase().includes(searchLower);

            const statusMatch = statusFilter === 'all' || iv.INTERVIEWSTATUS === statusFilter;

            return textMatch && statusMatch;
        });
    }, [interviews, search, statusFilter]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                       <div>
                            <CardTitle>Conducted Interviews</CardTitle>
                            <CardDescription>Review past interviews and their outcomes.</CardDescription>
                       </div>
                        <div className="flex items-center gap-2">
                            <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')}>
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by candidate, job, interviewer..."
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
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="REJECTED">REJECTED</SelectItem>
                                <SelectItem value="PROCEED TO ROUND 2">PROCEED TO ROUND 2</SelectItem>
                                <SelectItem value="PROCEED TO SHARE WITH RECRUITER">PROCEED TO SHARE WITH RECRUITER</SelectItem>
                                <SelectItem value="ACCEPTED BY RECRUITER">ACCEPTED BY RECRUITER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : viewMode === 'card' ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredInterviews.map((interview) => (
                                <Card key={interview.INTERVIEWID}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{interview.JOBSEEKERNAME}</CardTitle>
                                        <CardDescription>{interview.JOB_DESIGNATION}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <p><strong>Date:</strong> {format(parseISO(interview.INTERVIEWDATE), 'PPP')} at {format(parseISO(interview.INTERVIEWTIME), 'p')}</p>
                                        <p><strong>Round:</strong> {interview.ROUNDOFINTERVIEW}</p>
                                        <p><strong>Interviewer:</strong> {interview.CONDUCTEDBY}</p>
                                        <p><strong>Status:</strong> <Badge>{interview.INTERVIEWSTATUS}</Badge></p>
                                    </CardContent>
                                    <CardFooter className="flex flex-col items-stretch gap-2">
                                        <Button variant="secondary" onClick={() => setViewingAssessmentsId(interview.INTERVIEWID)}>View Assessments</Button>
                                        <Button onClick={() => handleProceed(interview)} disabled={interview.INTERVIEWSTATUS === 'REJECTED'}>Proceed to Next Round</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Job</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Round</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInterviews.map((interview) => (
                                    <TableRow key={interview.INTERVIEWID}>
                                        <TableCell>{interview.JOBSEEKERNAME}</TableCell>
                                        <TableCell>{interview.JOB_DESIGNATION}</TableCell>
                                        <TableCell>{format(parseISO(interview.INTERVIEWDATE), 'PPP')} {format(parseISO(interview.INTERVIEWTIME), 'p')}</TableCell>
                                        <TableCell>{interview.ROUNDOFINTERVIEW}</TableCell>
                                        <TableCell><Badge>{interview.INTERVIEWSTATUS}</Badge></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => setViewingAssessmentsId(interview.INTERVIEWID)}>Assessments</Button>
                                            <Button size="sm" onClick={() => handleProceed(interview)} disabled={interview.INTERVIEWSTATUS === 'REJECTED'}>Proceed</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {filteredInterviews.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No conducted interviews found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>
            <AssessmentDialog 
                isOpen={viewingAssessmentsId !== null} 
                onClose={() => setViewingAssessmentsId(null)} 
                interviewId={viewingAssessmentsId}
            />
        </>
    );
}
