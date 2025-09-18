
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search, List, LayoutGrid, Eye, Building } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, subDays, startOfWeek, startOfMonth } from "date-fns";
import { TrackApplicationDialog } from "@/components/track-application-dialog";
import { Input } from "@/components/ui/input";
import { ApplyJobDialog } from "@/components/apply-job-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobDetailsDialog } from "@/components/job-details-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Country, City, ICity, ICountry } from "country-state-city";
import { RecruiterInfoDialog } from "@/components/recruiter-info-dialog";


const BASEURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

interface Job {
    REQUESTNO: number;
    DESIGNATION: string;
    COUNTRY: string;
    CITY: string;
    DEADLINEDATE: string;
    NARRATION: string;
    RECRUITERID: number;
    RECRUITERCOMPANYNAME?: string;
    REQUESTDATE: string;
    JOBSEEKERCOUNT: number;
    URGENCYLEVEL: string;
    REQUESTSTATUS: string;
    EXPERIENCELEVEL: string;
    TYPEOFCONTRACT: string;
    MINQUALIFICATION: string;
    TERMSANDCONDITIONS: string;
    RECRUITERWEBSITE?: string;
    COMPANYINFORMATION?: string;
}

export default function FindJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [isTracking, setIsTracking] = useState<number | null>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [countryFilter, setCountryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [viewingRecruiterId, setViewingRecruiterId] = useState<number | null>(null);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    }
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const jobsResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=1155`, { headers: { "session-token": BASEURL_SESSION_TOKEN } });
        const recruitersResponse = await axios.get(`${BASEURL}/globalViewHandler?viewname=521`, { headers: { "session-token": BASEURL_SESSION_TOKEN } });
        
        const recruitersMap = new Map(recruitersResponse.data.map((r: any) => [r.RECRUITERID, r.RECRUITERCOMPANYNAME]));

        const jobsWithCompany = jobsResponse.data.map((job: Job) => ({
          ...job,
          RECRUITERCOMPANYNAME: recruitersMap.get(job.RECRUITERID) || "Unknown Company"
        }));

        setJobs(jobsWithCompany);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({ title: "Error", description: "Could not fetch jobs.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [toast]);

  const handleApplySuccess = () => {
    toast({ title: "Success", description: "Job application submitted successfully!" });
    setSelectedJob(null);
  }
  
  const handleCountryChange = (countryIsoCode: string) => {
    setCountryFilter(countryIsoCode);
    setCities(City.getCitiesOfCountry(countryIsoCode) || []);
    setCityFilter("all"); 
  };

  const filteredJobs = useMemo(() => {
      return jobs.filter(job => {
          const searchLower = search.toLowerCase();
          const textMatch = searchLower === "" ||
              job.DESIGNATION.toLowerCase().includes(searchLower) ||
              job.RECRUITERCOMPANYNAME?.toLowerCase().includes(searchLower) ||
              job.CITY.toLowerCase().includes(searchLower) ||
              job.COUNTRY.toLowerCase().includes(searchLower);

          if (!textMatch) return false;

          const countryData = Country.getAllCountries().find(c => c.name === job.COUNTRY);
          const countryMatch = countryFilter === "all" || (countryData && countryData.isoCode === countryFilter);
          if (!countryMatch) return false;

          const cityMatch = cityFilter === "all" || job.CITY === cityFilter;
          if (!cityMatch) return false;


          const now = new Date();
          const jobDate = new Date(job.REQUESTDATE);
          const deadline = new Date(job.DEADLINEDATE);
          const isExpired = deadline < now;

          let statusMatch = true;
          if(statusFilter === 'active') {
              statusMatch = !isExpired;
          } else if (statusFilter === 'expired') {
              statusMatch = isExpired;
          }

          if (!statusMatch) return false;
          
          let dateMatch = true;
          switch (dateFilter) {
            case "24h":
                dateMatch = isAfter(jobDate, subDays(now, 1));
                break;
            case "week":
                dateMatch = isAfter(jobDate, startOfWeek(now));
                break;
            case "month":
                dateMatch = isAfter(jobDate, startOfMonth(now));
                break;
            case "custom":
                const start = customStartDate ? new Date(customStartDate) : null;
                const end = customEndDate ? new Date(customEndDate) : null;
                if(start) start.setHours(0,0,0,0);
                if(end) end.setHours(23,59,59,999);
                dateMatch = (!start || jobDate >= start) && (!end || jobDate <= end);
                break;
            default: // "all"
                dateMatch = true;
          }

          return dateMatch;
      });
  }, [jobs, search, dateFilter, statusFilter, customStartDate, customEndDate, countryFilter, cityFilter]);

  const clearFilters = () => {
      setSearch("");
      setDateFilter("all");
      setStatusFilter("active");
      setCustomStartDate("");
      setCustomEndDate("");
      setCountryFilter("all");
      setCityFilter("all");
      setCities([]);
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Your Next Job</h1>
        <p className="text-muted-foreground">Browse through the available job openings.</p>
      </div>

       <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Filter Jobs</CardTitle>
                        <CardDescription>Use the filters below to find your perfect job.</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <div className="relative lg:col-span-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by job title, company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <Select value={countryFilter} onValueChange={handleCountryChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                             {countries.map(country => (
                                <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={cityFilter} onValueChange={setCityFilter} disabled={countryFilter === 'all'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by city" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {cities.map((city, index) => (
                                <SelectItem key={`${city.name}-${city.stateCode}-${index}`} value={city.name}>{city.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active Jobs</SelectItem>
                            <SelectItem value="expired">Deadline Passed</SelectItem>
                            <SelectItem value="all">All Jobs</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by date posted" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="24h">Past 24 hours</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                   
                </div>
                 {dateFilter === "custom" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                        <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                    </div>
                )}
                 <div className="pt-4">
                     <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
                 </div>
            </CardHeader>
       </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <h3 className="text-xl font-semibold">No Jobs Found</h3>
          <p className="text-muted-foreground mt-2">No jobs match your search criteria. Please check back later.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, index) => {
            const isExpired = new Date(job.DEADLINEDATE) < new Date();
            return (
            <Card key={`${job.REQUESTNO}-${index}`} className="flex flex-col">
              <CardHeader>
                <CardTitle>{job.DESIGNATION}</CardTitle>
                <CardDescription>{job.RECRUITERCOMPANYNAME} - {job.CITY}, {job.COUNTRY}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                 <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: job.NARRATION }} />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                 <p className="text-xs text-muted-foreground">
                    <strong>Deadline:</strong> {format(new Date(job.DEADLINEDATE), 'PPP')}
                 </p>
                 <div className="flex w-full gap-2 items-center">
                    <Button variant="outline" className="w-full" onClick={() => setViewingJob(job)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setViewingRecruiterId(job.RECRUITERID)}>
                        <Building className="mr-2 h-4 w-4" /> Company Info
                    </Button>
                 </div>
                 <div className="flex w-full gap-2 items-center mt-2">
                    <Button variant="secondary" className="w-full" onClick={() => setIsTracking(job.REQUESTNO)}>
                        Track Application
                    </Button>
                    <Button className="w-full" onClick={() => setSelectedJob(job)} disabled={isExpired}>
                        {isExpired ? "Deadline Passed" : "Apply Now"}
                    </Button>
                 </div>
              </CardFooter>
            </Card>
            )
          })}
        </div>
      ) : (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredJobs.map((job, index) => {
                            const isExpired = new Date(job.DEADLINEDATE) < new Date();
                            return(
                            <TableRow key={`${job.REQUESTNO}-${index}`}>
                                <TableCell className="font-medium">{job.DESIGNATION}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span>{job.RECRUITERCOMPANYNAME}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingRecruiterId(job.RECRUITERID)}>
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>{job.CITY}, {job.COUNTRY}</TableCell>
                                <TableCell>{format(new Date(job.DEADLINEDATE), 'PPP')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => setViewingJob(job)}>Details</Button>
                                    <Button size="sm" variant="secondary" onClick={() => setIsTracking(job.REQUESTNO)}>Track</Button>
                                    <Button size="sm" onClick={() => setSelectedJob(job)} disabled={isExpired}>Apply</Button>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
    {isTracking !== null && currentUser?.JOBSEEKERREGNO && (
        <TrackApplicationDialog
            requestNo={isTracking}
            jobSeekerRegNo={currentUser.JOBSEEKERREGNO}
            onClose={() => setIsTracking(null)}
        />
    )}
     {selectedJob && currentUser?.JOBSEEKERREGNO && (
        <ApplyJobDialog
          job={selectedJob}
          jobSeekerRegNo={currentUser.JOBSEEKERREGNO}
          onClose={() => setSelectedJob(null)}
          onApplySuccess={handleApplySuccess}
        />
      )}
      {viewingJob && (
        <JobDetailsDialog job={viewingJob} onClose={() => setViewingJob(null)} onApplyNow={() => {setViewingJob(null); setSelectedJob(viewingJob)}} />
      )}
       {viewingRecruiterId && (
        <RecruiterInfoDialog
          recruiterId={viewingRecruiterId}
          onClose={() => setViewingRecruiterId(null)}
        />
      )}
    </>
  );
}

    