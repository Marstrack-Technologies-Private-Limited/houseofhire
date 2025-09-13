
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Loader2, PlusCircle, Search, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface JobTitle {
    JOBTITLEID: number;
    JOBTITLENAME: string;
}

const JobTitleDialog = ({
    isOpen,
    onClose,
    onSave,
    jobTitle,
    isLoading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, name: string) => void;
    jobTitle: JobTitle | { JOBTITLEID: number | null, JOBTITLENAME: string };
    isLoading: boolean;
}) => {
    const [name, setName] = useState(jobTitle?.JOBTITLENAME || "");

    useEffect(() => {
        setName(jobTitle?.JOBTITLENAME || "");
    }, [jobTitle]);

    const handleSave = () => {
        if (jobTitle.JOBTITLEID !== null) {
            onSave(jobTitle.JOBTITLEID, name);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{jobTitle.JOBTITLEID ? 'Edit' : 'Create'} Job Title</DialogTitle>
                    <DialogDescription>
                        {jobTitle.JOBTITLEID ? 'Update the name of the job title.' : 'Enter a name for the new job title.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || !name}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function CreateJobTypesPage() {
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | { JOBTITLEID: number | null, JOBTITLENAME: string } | null>(null);
    const { toast } = useToast();
    const [search, setSearch] = useState("");

    const fetchJobTitles = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1171`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            setJobTitles(response.data);
        } catch (error) {
            console.error("Error fetching job titles:", error);
            toast({ title: "Error", description: "Could not fetch job titles.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchJobTitles();
    }, [fetchJobTitles]);

    const handleCreate = async () => {
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1172`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            const newId = response.data[0]?.NEWJOBTITLEID;
            if (newId) {
                setSelectedJobTitle({ JOBTITLEID: newId, JOBTITLENAME: "" });
                setIsDialogOpen(true);
            } else {
                 toast({ title: "Error", description: "Could not get a new Job Title ID.", variant: "destructive" });
            }
        } catch (error) {
             console.error("Error fetching new job title ID:", error);
            toast({ title: "Error", description: "Failed to prepare new job title.", variant: "destructive" });
        }
    };
    
    const handleEdit = (jobTitle: JobTitle) => {
        setSelectedJobTitle(jobTitle);
        setIsDialogOpen(true);
    };

    const handleSave = async (id: number, name: string) => {
        setIsSaving(true);
        try {
            const payload = {
                TITLEID: id,
                TITLENAME: name,
                SUCCESS_STATUS: "",
                ERROR_STATUS: ""
            };
            const response = await axios.post(`${BASEURL}/globalSpHandler?spname=1173`, payload, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });

            if (response.data?.message === "Document Saved") {
                toast({ title: "Success", description: "Job title saved successfully." });
                setIsDialogOpen(false);
                setSelectedJobTitle(null);
                fetchJobTitles();
            } else {
                toast({ title: "Error", description: response.data.message || "Failed to save job title.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error saving job title:", error);
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredJobTitles = useMemo(() => {
        return jobTitles.filter(jobTitle => 
            jobTitle.JOBTITLENAME.toLowerCase().includes(search.toLowerCase())
        );
    }, [jobTitles, search]);

    const handleDownload = (format: 'pdf' | 'excel') => {
        const doc = new jsPDF();
        const tableHead = [['ID', 'Job Title Name']];
        const tableBody = filteredJobTitles.map(jt => [jt.JOBTITLEID, jt.JOBTITLENAME]);

        if (format === 'pdf') {
            const pageTitle = "Job Title Master";
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
            doc.save('job-title-master.pdf');
        } else {
            const worksheet = XLSX.utils.json_to_sheet(
                filteredJobTitles.map(jt => ({ ID: jt.JOBTITLEID, 'Job Title': jt.JOBTITLENAME }))
            );
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobTitles");
            XLSX.writeFile(workbook, 'job-title-master.xlsx');
        }
    };
    
    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <CardTitle>Job Title Master</CardTitle>
                            <CardDescription>Manage job titles for job postings.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleCreate}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Title
                            </Button>
                            <Button onClick={() => handleDownload('pdf')} variant="outline" size="sm"><FileDown className="mr-2" /> PDF</Button>
                            <Button onClick={() => handleDownload('excel')} variant="outline" size="sm"><FileDown className="mr-2" /> Excel</Button>
                        </div>
                    </div>
                     <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by job title name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-sm"
                        />
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
                                <TableHead>ID</TableHead>
                                <TableHead>Job Title Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobTitles.map((jobTitle) => (
                                <TableRow key={jobTitle.JOBTITLEID}>
                                    <TableCell>{jobTitle.JOBTITLEID}</TableCell>
                                    <TableCell className="font-medium">{jobTitle.JOBTITLENAME}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(jobTitle)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                     {filteredJobTitles.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No job titles found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedJobTitle && (
                 <JobTitleDialog 
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                    jobTitle={selectedJobTitle}
                    isLoading={isSaving}
                 />
            )}
        </div>
    );
}

    