
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Check, X, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { CandidateProfileDialog } from '@/components/candidate-profile-dialog';
import { approveRejectSeekerAction } from '@/actions/admin-actions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Country, City, ICity, ICountry } from "country-state-city";

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
    CANCELLED: boolean | null;
    COUNTRYRESIDENCE: string;
    CITY: string;
}

const ApprovalDialog = ({
    isOpen,
    onClose,
    onConfirm,
    actionType,
    isLoading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (narration: string) => void;
    actionType: 'approve' | 'reject';
    isLoading: boolean;
}) => {
    const [narration, setNarration] = useState("");

    const handleConfirm = () => {
        if (actionType === 'reject' && !narration.trim()) {
            alert("Please provide a narration for rejection.");
            return;
        }
        onConfirm(narration);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}</DialogTitle>
                    <DialogDescription>
                        {actionType === 'approve'
                            ? "Are you sure you want to approve this job seeker? Narration is optional."
                            : "Please provide a reason for rejecting this job seeker. Narration is required."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="narration">Narration / Reason</Label>
                    <Textarea
                        id="narration"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder={actionType === 'reject' ? "Reason for rejection..." : "Optional comments..."}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isLoading} variant={actionType === 'reject' ? 'destructive' : 'default'}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function ApproveSeekersPage() {
    const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [selectedSeeker, setSelectedSeeker] = useState<JobSeeker | null>(null);
    const [viewingSeekerId, setViewingSeekerId] = useState<number | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [adminUser, setAdminUser] = useState<any>(null);

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [countryFilter, setCountryFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if(storedUser) {
            setAdminUser(JSON.parse(storedUser));
        }
         setCountries(Country.getAllCountries());
    }, [])

    const fetchJobSeekers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=1154`, {
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

    const handleOpenApprovalModal = (seeker: JobSeeker, action: 'approve' | 'reject') => {
        setSelectedSeeker(seeker);
        setActionType(action);
        setIsApprovalModalOpen(true);
    };
    
    const handleCountryChange = (countryName: string) => {
        setCountryFilter(countryName);
        setCityFilter("all");
        if (countryName === "all") {
            setCities([]);
        } else {
            const countryData = countries.find(c => c.name === countryName);
            if(countryData) {
                setCities(City.getCitiesOfCountry(countryData.isoCode) || []);
            }
        }
    };

    const handleApproveReject = async (narration: string) => {
        if (!selectedSeeker || !adminUser?.userCode) {
            toast({ title: "Error", description: "Selected seeker or admin user not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const result = await approveRejectSeekerAction({
            jobSeekerRegNo: selectedSeeker.JOBSEEKERREGNO,
            action: actionType,
            reason: narration,
            adminUserCode: adminUser.userCode
        });

        if (result.success) {
            toast({ title: "Success", description: `Job seeker has been ${actionType}d.` });
            setIsApprovalModalOpen(false);
            setSelectedSeeker(null);
            fetchJobSeekers();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const getStatus = (seeker: JobSeeker) => {
        if (seeker.APPROVED) {
            return <Badge variant="default">Approved</Badge>;
        }
        if (seeker.CANCELLED) {
            return <Badge variant="destructive">Rejected</Badge>;
        }
        return <Badge variant="secondary">Pending</Badge>;
    };

     const getStatusCode = (seeker: JobSeeker) => {
        if (seeker.APPROVED) return 'approved';
        if (seeker.CANCELLED) return 'rejected';
        return 'pending';
    }
    
    const filteredSeekers = useMemo(() => {
        return jobSeekers.filter(seeker => {
            const searchLower = search.toLowerCase();
            const textMatch = searchLower === "" ||
                seeker.JOBSEEKERNAME.toLowerCase().includes(searchLower) ||
                seeker.EMAILADDRESS.toLowerCase().includes(searchLower) ||
                (seeker.SPECIALIZATION && seeker.SPECIALIZATION.toLowerCase().includes(searchLower));

            const statusMatch = statusFilter === 'all' || getStatusCode(seeker) === statusFilter;

            const itemDate = seeker.CREATEDDATE ? parseISO(seeker.CREATEDDATE) : null;
            let dateMatch = true;
            if (itemDate && isValid(itemDate)) {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if(start) start.setHours(0,0,0,0);
                if(end) end.setHours(23,59,59,999);
                dateMatch = (!start || itemDate >= start) && (!end || itemDate <= end);
            } else if (startDate || endDate) {
                dateMatch = false;
            }

            const countryMatch = countryFilter === "all" || seeker.COUNTRYRESIDENCE === countryFilter;
            const cityMatch = cityFilter === "all" || seeker.CITY === cityFilter;


            return textMatch && statusMatch && dateMatch && countryMatch && cityMatch;
        });
    }, [jobSeekers, search, statusFilter, startDate, endDate, countryFilter, cityFilter]);

    const clearFilters = () => {
        setSearch(""); 
        setStatusFilter("all"); 
        setStartDate(""); 
        setEndDate("");
        setCountryFilter("all");
        setCityFilter("all");
        setCities([]);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Approve Job Seekers</CardTitle>
                    <CardDescription>Review and manage new job seeker registrations.</CardDescription>
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={countryFilter} onValueChange={handleCountryChange}>
                            <SelectTrigger><SelectValue placeholder="Filter by country" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Countries</SelectItem>
                                {countries.map(country => (
                                    <SelectItem key={country.isoCode} value={country.name}>{country.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={cityFilter} onValueChange={setCityFilter} disabled={!cities.length}>
                            <SelectTrigger><SelectValue placeholder="Filter by city" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {cities.map((city, index) => (
                                    <SelectItem key={`${city.name}-${city.stateCode}-${index}`} value={city.name}>{city.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                         <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                                <TableHead>Location</TableHead>
                                <TableHead>Applied Date</TableHead>
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
                                    <TableCell>
                                        <div>{seeker.CITY}</div>
                                        <div className="text-sm text-muted-foreground">{seeker.COUNTRYRESIDENCE}</div>
                                    </TableCell>
                                    <TableCell>{seeker.CREATEDDATE ? format(new Date(seeker.CREATEDDATE), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>{getStatus(seeker)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => setViewingSeekerId(seeker.JOBSEEKERREGNO)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {!(seeker.APPROVED || seeker.CANCELLED) && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenApprovalModal(seeker, 'approve')}>
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleOpenApprovalModal(seeker, 'reject')}>
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                     {filteredSeekers.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No job seekers found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>

            {isApprovalModalOpen && (
                <ApprovalDialog
                    isOpen={isApprovalModalOpen}
                    onClose={() => setIsApprovalModalOpen(false)}
                    onConfirm={handleApproveReject}
                    actionType={actionType}
                    isLoading={isSubmitting}
                />
            )}

            {viewingSeekerId && (
                <CandidateProfileDialog
                    jobSeekerRegNo={viewingSeekerId}
                    onClose={() => setViewingSeekerId(null)}
                />
            )}
        </>
    );
}
