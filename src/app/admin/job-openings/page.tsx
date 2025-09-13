
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
import { Loader2, Search, List, LayoutGrid, Eye, FileDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobDetailsDialog } from "@/components/job-details-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Country, City, ICity, ICountry } from "country-state-city";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


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
}

export default function JobOpeningsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const { toast } = useToast();
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


  useEffect(() => {
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

  const handleDownload = (formatType: 'pdf' | 'excel') => {
        const doc = new jsPDF();
        const tableHead = [['Job Title', 'Company', 'Location', 'Deadline']];
        const tableBody = filteredJobs.map(j => [
            j.DESIGNATION,
            j.RECRUITERCOMPANYNAME,
            `${j.CITY}, ${j.COUNTRY}`,
            format(new Date(j.DEADLINEDATE), 'PPP')
        ]);

        if (formatType === 'pdf') {
            const pageTitle = "Job Openings";
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
            doc.save('job-openings.pdf');
        } else {
            const worksheet = XLSX.utils.json_to_sheet(
                filteredJobs.map(j => ({
                    'Job Title': j.DESIGNATION,
                    'Company': j.RECRUITERCOMPANYNAME,
                    'Location': `${j.CITY}, ${j.COUNTRY}`,
                    'Deadline': format(new Date(j.DEADLINEDATE), 'PPP')
                }))
            );
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobOpenings");
            XLSX.writeFile(workbook, 'job-openings.xlsx');
        }
    };

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Job Openings</h1>
        <p className="text-muted-foreground">Browse and review all job openings on the platform.</p>
      </div>

       <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Filter Jobs</CardTitle>
                        <CardDescription>Use the filters below to find specific jobs.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')}>
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                         <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
                            <List className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDownload('pdf')} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
                        <Button onClick={() => handleDownload('excel')} variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> Excel</Button>
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
          <p className="text-muted-foreground mt-2">No jobs match your search criteria.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job, index) => (
            <Card key={`${job.REQUESTNO}-${index}`} className="flex flex-col">
              <CardHeader>
                <CardTitle>{job.DESIGNATION}</CardTitle>
                <CardDescription>{job.RECRUITERCOMPANYNAME} &bull; {job.CITY}, {job.COUNTRY}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                 <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: job.NARRATION }} />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                 <p className="text-xs text-muted-foreground">
                    <strong>Deadline:</strong> {format(new Date(job.DEADLINEDATE), 'PPP')}
                 </p>
                 <Button variant="outline" className="w-full" onClick={() => setViewingJob(job)}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
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
                        {filteredJobs.map((job, index) => (
                            <TableRow key={`${job.REQUESTNO}-${index}`}>
                                <TableCell className="font-medium">{job.DESIGNATION}</TableCell>
                                <TableCell>{job.RECRUITERCOMPANYNAME}</TableCell>
                                <TableCell>{job.CITY}, {job.COUNTRY}</TableCell>
                                <TableCell>{format(new Date(job.DEADLINEDATE), 'PPP')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => setViewingJob(job)}>Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
      {viewingJob && (
        <JobDetailsDialog job={viewingJob} onClose={() => setViewingJob(null)} onApplyNow={() => {setViewingJob(null);}} />
      )}
    </>
  );
}

    
