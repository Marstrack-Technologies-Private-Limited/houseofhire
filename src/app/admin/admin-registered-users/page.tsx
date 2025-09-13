
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Edit, Loader2, Search, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { CandidateProfileDialog } from '@/components/candidate-profile-dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface JobSeeker {
    JOBSEEKERREGNO: number;
    JOBSEEKERNAME: string;
    EMAILADDRESS: string;
    SPECIALIZATION: string;
    QUALIFICATION: string;
    EXPERIENCELEVEL: string;
    CREATEDDATE: string;
    APPROVED: boolean | null;
}

export default function AdminRegisteredUsersPage() {
    const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    
    const [viewingSeekerId, setViewingSeekerId] = useState<number | null>(null);

    // Filter States
    const [search, setSearch] = useState("");

    const fetchJobSeekers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1154&GBSREGISTERED=true`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            setJobSeekers(response.data);
        } catch (error) {
            console.error("Error fetching job seekers:", error);
            toast({ title: "Error", description: "Could not fetch job seekers.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchJobSeekers();
    }, [fetchJobSeekers]);

    const handleEdit = (seeker: JobSeeker) => {
        router.push(`/admin/register-seekers?id=${seeker.JOBSEEKERREGNO}`);
    };
    
    const filteredSeekers = useMemo(() => {
        return jobSeekers.filter(seeker => {
            const searchLower = search.toLowerCase();
            return searchLower === "" ||
                seeker.JOBSEEKERNAME.toLowerCase().includes(searchLower) ||
                seeker.EMAILADDRESS.toLowerCase().includes(searchLower) ||
                (seeker.SPECIALIZATION && seeker.SPECIALIZATION.toLowerCase().includes(searchLower));
        });
    }, [jobSeekers, search]);

    const handleDownload = (formatType: 'pdf' | 'excel') => {
        const doc = new jsPDF();
        const tableHead = [['Name', 'Email', 'Specialization', 'Qualification', 'Experience', 'Registered Date', 'Status']];
        const tableBody = filteredSeekers.map(s => [
            s.JOBSEEKERNAME,
            s.EMAILADDRESS,
            s.SPECIALIZATION,
            s.QUALIFICATION,
            s.EXPERIENCELEVEL,
            s.CREATEDDATE ? format(new Date(s.CREATEDDATE), 'PPP') : 'N/A',
            s.APPROVED ? "Approved" : "Pending"
        ]);

        if (formatType === 'pdf') {
             const pageTitle = "Admin Registered Users";
             const companyName = "House of Hire";
             doc.setFontSize(16);
             doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
             doc.setFontSize(12);
             doc.text(pageTitle, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

            autoTable(doc, {
                head: tableHead,
                body: tableBody,
                startY: 30,
            });
            doc.save('admin-registered-users.pdf');
        } else {
            const worksheet = XLSX.utils.json_to_sheet(
                filteredSeekers.map(s => ({
                    Name: s.JOBSEEKERNAME,
                    Email: s.EMAILADDRESS,
                    Specialization: s.SPECIALIZATION,
                    Qualification: s.QUALIFICATION,
                    Experience: s.EXPERIENCELEVEL,
                    'Registered Date': s.CREATEDDATE ? format(new Date(s.CREATEDDATE), 'PPP') : 'N/A',
                    Status: s.APPROVED ? "Approved" : "Pending"
                }))
            );
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Users");
            XLSX.writeFile(workbook, 'admin-registered-users.xlsx');
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Admin Registered Users</CardTitle>
                            <CardDescription>View and manage users registered by GBS administrators.</CardDescription>
                        </div>
                         <div className="flex gap-2">
                             <Button onClick={() => handleDownload('pdf')} variant="outline" size="sm"><FileDown className="mr-2" /> PDF</Button>
                             <Button onClick={() => handleDownload('excel')} variant="outline" size="sm"><FileDown className="mr-2" /> Excel</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <div className="relative lg:col-span-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, specialization..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Registered Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSeekers.map((seeker) => (
                                <TableRow key={seeker.JOBSEEKERREGNO}>
                                    <TableCell className="font-medium">
                                        <div>{seeker.JOBSEEKERNAME}</div>
                                        <div className="text-sm text-muted-foreground">{seeker.EMAILADDRESS}</div>
                                    </TableCell>
                                    <TableCell>{seeker.SPECIALIZATION}</TableCell>
                                    <TableCell>{seeker.CREATEDDATE ? format(new Date(seeker.CREATEDDATE), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={seeker.APPROVED ? "default" : "secondary"}>
                                            {seeker.APPROVED ? "Approved" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => setViewingSeekerId(seeker.JOBSEEKERREGNO)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(seeker)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                     {filteredSeekers.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No GBS registered users found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {viewingSeekerId && (
                <CandidateProfileDialog
                    jobSeekerRegNo={viewingSeekerId}
                    onClose={() => setViewingSeekerId(null)}
                />
            )}
        </>
    );
}
