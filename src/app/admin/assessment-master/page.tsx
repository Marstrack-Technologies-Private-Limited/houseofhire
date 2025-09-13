
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

interface Assessment {
    ASSESSMENTID: number;
    ASSESSMENTNAME: string;
}

const AssessmentDialog = ({
    isOpen,
    onClose,
    onSave,
    assessment,
    isLoading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, name: string) => void;
    assessment: Assessment | { ASSESSMENTID: number | null, ASSESSMENTNAME: string };
    isLoading: boolean;
}) => {
    const [name, setName] = useState(assessment?.ASSESSMENTNAME || "");

    useEffect(() => {
        setName(assessment?.ASSESSMENTNAME || "");
    }, [assessment]);

    const handleSave = () => {
        if (assessment.ASSESSMENTID !== null) {
            onSave(assessment.ASSESSMENTID, name);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{assessment.ASSESSMENTID ? 'Edit' : 'Create'} Assessment</DialogTitle>
                    <DialogDescription>
                        {assessment.ASSESSMENTID ? 'Update the name of the assessment.' : 'Enter a name for the new assessment.'}
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


export default function AssessmentMasterPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | { ASSESSMENTID: number | null, ASSESSMENTNAME: string } | null>(null);
    const { toast } = useToast();
    const [search, setSearch] = useState("");

    const fetchAssessments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1174`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            setAssessments(response.data);
        } catch (error) {
            console.error("Error fetching assessments:", error);
            toast({ title: "Error", description: "Could not fetch assessments.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    const handleCreate = async () => {
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1175`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            const newId = response.data[0]?.NEWASSESSMENTID;
            if (newId) {
                setSelectedAssessment({ ASSESSMENTID: newId, ASSESSMENTNAME: "" });
                setIsDialogOpen(true);
            } else {
                 toast({ title: "Error", description: "Could not get a new Assessment ID.", variant: "destructive" });
            }
        } catch (error) {
             console.error("Error fetching new assessment ID:", error);
            toast({ title: "Error", description: "Failed to prepare new assessment.", variant: "destructive" });
        }
    };
    
    const handleEdit = (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        setIsDialogOpen(true);
    };

    const handleSave = async (id: number, name: string) => {
        setIsSaving(true);
        try {
            const payload = {
                ASSESSMENTID: id,
                ASSESSMENTNAME: name,
                SUCCESS_STATUS: "",
                ERROR_STATUS: ""
            };
            const response = await axios.post(`${BASEURL}/globalSpHandler?spname=1176`, payload, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });

            if (response.data?.message === "Document Saved") {
                toast({ title: "Success", description: "Assessment saved successfully." });
                setIsDialogOpen(false);
                setSelectedAssessment(null);
                fetchAssessments();
            } else {
                toast({ title: "Error", description: response.data.message || "Failed to save assessment.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error saving assessment:", error);
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredAssessments = useMemo(() => {
        return assessments.filter(assessment => 
            assessment.ASSESSMENTNAME.toLowerCase().includes(search.toLowerCase())
        );
    }, [assessments, search]);

    const handleDownload = (format: 'pdf' | 'excel') => {
        const doc = new jsPDF();
        const tableHead = [['ID', 'Assessment Name']];
        const tableBody = filteredAssessments.map(a => [a.ASSESSMENTID, a.ASSESSMENTNAME]);

        if (format === 'pdf') {
            const pageTitle = "Assessment Master";
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
            doc.save('assessment-master.pdf');
        } else {
            const worksheet = XLSX.utils.json_to_sheet(
                filteredAssessments.map(a => ({ ID: a.ASSESSMENTID, Name: a.ASSESSMENTNAME }))
            );
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Assessments");
            XLSX.writeFile(workbook, 'assessment-master.xlsx');
        }
    };
    
    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <CardTitle>Assessment Master</CardTitle>
                            <CardDescription>Manage assessment types for job applications.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleCreate}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create New Assessment
                            </Button>
                            <Button onClick={() => handleDownload('pdf')} variant="outline" size="sm"><FileDown className="mr-2" /> PDF</Button>
                            <Button onClick={() => handleDownload('excel')} variant="outline" size="sm"><FileDown className="mr-2" /> Excel</Button>
                        </div>
                    </div>
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by assessment name..."
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
                                <TableHead>Assessment Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssessments.map((assessment) => (
                                <TableRow key={assessment.ASSESSMENTID}>
                                    <TableCell>{assessment.ASSESSMENTID}</TableCell>
                                    <TableCell className="font-medium">{assessment.ASSESSMENTNAME}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(assessment)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                     {filteredAssessments.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No assessments found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedAssessment && (
                 <AssessmentDialog 
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                    assessment={selectedAssessment}
                    isLoading={isSaving}
                 />
            )}
        </div>
    );
}

    