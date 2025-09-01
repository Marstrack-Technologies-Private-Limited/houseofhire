
import type { User, Job, Application, Candidate } from "./types";

export const mockUser: User = {
  id: "user-1",
  name: "Alex Doe",
  email: "alex.doe@example.com",
  role: "seeker",
  avatarUrl: "https://picsum.photos/seed/alex/100/100",
};

export const mockRecruiter: User = {
  id: "rec-1",
  name: "Jane Smith",
  email: "jane.smith@company.com",
  role: "recruiter",
  avatarUrl: "https://picsum.photos/seed/jane/100/100",
};

export const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    companyName: "TechCorp",
    location: "San Francisco, CA",
    salary: "$120,000 - $160,000",
    description: "...",
    postedAt: "2 days ago",
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    companyName: "Innovate LLC",
    location: "New York, NY (Remote)",
    salary: "$130,000 - $170,000",
    description: "...",
    postedAt: "5 days ago",
  },
  {
    id: "job-3",
    title: "Product Manager",
    companyName: "Solutions Inc.",
    location: "Austin, TX",
    salary: "$110,000 - $150,000",
    description: "...",
    postedAt: "1 week ago",
  },
];

export const mockSeekerApplications: Application[] = [
    {
        id: "app-1",
        jobId: "job-1",
        jobTitle: "Senior Frontend Developer",
        applicantName: 'Alex Doe',
        applicantEmail: 'alex.doe@example.com',
        appliedAt: new Date("2024-07-20T10:00:00Z"),
        status: "Viewed",
    },
    {
        id: "app-2",
        jobId: "job-2",
        jobTitle: "Backend Engineer",
        applicantName: 'Alex Doe',
        applicantEmail: 'alex.doe@example.com',
        appliedAt: new Date("2024-07-18T15:30:00Z"),
        status: "Applied",
    },
];

export const mockCandidates: Candidate[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', jobTitle: 'Senior Frontend Developer', applicationDate: '2024-07-20', status: 'Shortlisted' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', jobTitle: 'Senior Frontend Developer', applicationDate: '2024-07-19', status: 'Applied' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', jobTitle: 'Senior Frontend Developer', applicationDate: '2024-07-18', status: 'Viewed' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', jobTitle: 'Backend Engineer', applicationDate: '2024-07-17', status: 'Rejected' },
];
