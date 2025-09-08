
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    
    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Job Title Master</CardTitle>
                            <CardDescription>Manage job titles for job postings.</CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Title
                        </Button>
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
                            {jobTitles.map((jobTitle) => (
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
                     {jobTitles.length === 0 && !isLoading && (
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
