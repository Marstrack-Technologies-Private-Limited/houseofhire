
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
import { RecruiterProfileDialog } from '@/components/recruiter-profile-dialog';
import { approveRejectRecruiterAction } from '@/actions/admin-actions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Country, City, ICity, ICountry } from "country-state-city";
import { format, parseISO, isValid } from 'date-fns';

const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Recruiter {
    RECRUITERID: number;
    RECRUITERCOMPANYNAME: string;
    EMAILADDRESS: string;
    BUSINESSLINE: string;
    COUNTRY: string;
    CITY: string;
    POINTOFCONTACT: string;
    APPROVED: boolean | null;
    CANCELLED: boolean | null;
    SELFHIRING: boolean | null;
    VERIFIEDDATETIME: string | null;
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
                            ? "Are you sure you want to approve this recruiter? Narration is optional."
                            : "Please provide a reason for rejecting this recruiter. Narration is required."}
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


export default function ApproveRecruitersPage() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null);
    const [viewingRecruiterId, setViewingRecruiterId] = useState<number | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [adminUser, setAdminUser] = useState<any>(null);

    // Filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selfHiringFilter, setSelfHiringFilter] = useState("all");
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [countryFilter, setCountryFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if(storedUser) {
            setAdminUser(JSON.parse(storedUser));
        }
        setCountries(Country.getAllCountries());
    }, [])

    const fetchRecruiters = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASEURL}/globalViewHandler?viewname=521`, {
                headers: { "session-token": BASEURL_SESSION_TOKEN }
            });
            setRecruiters(response.data);
        } catch (error) {
            console.error("Error fetching recruiters:", error);
            toast({ title: "Error", description: "Could not fetch recruiters.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRecruiters();
    }, [fetchRecruiters]);
    
    const handleCountryChange = (countryIsoCode: string) => {
        setCountryFilter(countryIsoCode);
        setCityFilter("all");
        if (countryIsoCode === "all") {
            setCities([]);
        } else {
            setCities(City.getCitiesOfCountry(countryIsoCode) || []);
        }
    };

    const handleOpenApprovalModal = (recruiter: Recruiter, action: 'approve' | 'reject') => {
        setSelectedRecruiter(recruiter);
        setActionType(action);
        setIsApprovalModalOpen(true);
    };

    const handleApproveReject = async (narration: string) => {
        if (!selectedRecruiter || !adminUser?.userCode) {
            toast({ title: "Error", description: "Selected recruiter or admin user not found.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const result = await approveRejectRecruiterAction({
            recruiterRegNo: selectedRecruiter.RECRUITERID,
            action: actionType,
            reason: narration,
            adminUserCode: adminUser.userCode
        });

        if (result.success) {
            toast({ title: "Success", description: `Recruiter has been ${actionType}d.` });
            setIsApprovalModalOpen(false);
            setSelectedRecruiter(null);
            fetchRecruiters();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const getStatus = (recruiter: Recruiter) => {
        if (recruiter.APPROVED) {
            return <Badge variant="default">Approved</Badge>;
        }
        if (recruiter.CANCELLED) {
            return <Badge variant="destructive">Rejected</Badge>;
        }
        return <Badge variant="secondary">Pending</Badge>;
    };

    const getStatusCode = (recruiter: Recruiter) => {
        if (recruiter.APPROVED) return 'approved';
        if (recruiter.CANCELLED) return 'rejected';
        return 'pending';
    }
    
    const filteredRecruiters = useMemo(() => {
        return recruiters.filter(rec => {
            const searchLower = search.toLowerCase();
            const textMatch = searchLower === "" ||
                rec.RECRUITERCOMPANYNAME.toLowerCase().includes(searchLower) ||
                rec.EMAILADDRESS.toLowerCase().includes(searchLower) ||
                rec.BUSINESSLINE.toLowerCase().includes(searchLower) ||
                rec.COUNTRY.toLowerCase().includes(searchLower);

            const statusMatch = statusFilter === 'all' || getStatusCode(rec) === statusFilter;

            const selfHiringMatch = selfHiringFilter === 'all' ||
                (selfHiringFilter === 'true' && rec.SELFHIRING) ||
                (selfHiringFilter === 'false' && !rec.SELFHIRING);

            const countryData = Country.getAllCountries().find(c => c.name === rec.COUNTRY);
            const countryMatch = countryFilter === "all" || (countryData && countryData.isoCode === countryFilter);

            const cityMatch = cityFilter === 'all' || rec.CITY === cityFilter;
            
            const itemDate = rec.VERIFIEDDATETIME ? parseISO(rec.VERIFIEDDATETIME) : null;
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

            return textMatch && statusMatch && selfHiringMatch && countryMatch && cityMatch && dateMatch;
        });
    }, [recruiters, search, statusFilter, selfHiringFilter, countryFilter, cityFilter, startDate, endDate]);
    
    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setSelfHiringFilter("all");
        setCountryFilter("all");
        setCityFilter("all");
        setStartDate("");
        setEndDate("");
        setCities([]);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Approve Recruiters</CardTitle>
                    <CardDescription>Review and manage new recruiter registrations.</CardDescription>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <div className="relative lg:col-span-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by company, email, country..."
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
                                    <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
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
                        <Select value={selfHiringFilter} onValueChange={setSelfHiringFilter}>
                            <SelectTrigger><SelectValue placeholder="Self-Hiring Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Hiring Models</SelectItem>
                                <SelectItem value="true">Self-Hiring Enabled</SelectItem>
                                <SelectItem value="false">Self-Hiring Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                         <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Verified Start Date" />
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Verified End Date" />
                        </div>
                        <div className='lg:col-span-2 flex justify-end'>
                           <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
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
                                <TableHead>Company</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Self-Hiring</TableHead>
                                <TableHead>Verified On</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecruiters.map((recruiter) => (
                                <TableRow key={recruiter.RECRUITERID}>
                                    <TableCell className="font-medium">
                                        <div>{recruiter.RECRUITERCOMPANYNAME}</div>
                                        <div className="text-sm text-muted-foreground">{recruiter.EMAILADDRESS}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{recruiter.CITY}</div>
                                        <div className="text-sm text-muted-foreground">{recruiter.COUNTRY}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={recruiter.SELFHIRING ? "default" : "secondary"}>{recruiter.SELFHIRING ? 'Yes' : 'No'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {recruiter.VERIFIEDDATETIME ? format(new Date(recruiter.VERIFIEDDATETIME), 'PPP') : 'N/A'}
                                    </TableCell>
                                    <TableCell>{getStatus(recruiter)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => setViewingRecruiterId(recruiter.RECRUITERID)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {!(recruiter.APPROVED || recruiter.CANCELLED) && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenApprovalModal(recruiter, 'approve')}>
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleOpenApprovalModal(recruiter, 'reject')}>
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
                     {filteredRecruiters.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No recruiters found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>

            {isApprovalModalOpen && selectedRecruiter && (
                <ApprovalDialog
                    isOpen={isApprovalModalOpen}
                    onClose={() => setIsApprovalModalOpen(false)}
                    onConfirm={handleApproveReject}
                    actionType={actionType}
                    isLoading={isSubmitting}
                />
            )}

            {viewingRecruiterId && (
                <RecruiterProfileDialog
                    recruiterId={viewingRecruiterId}
                    onClose={() => setViewingRecruiterId(null)}
                />
            )}
        </>
    );
}
