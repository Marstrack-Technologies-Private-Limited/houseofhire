export type UserRole = "seeker" | "recruiter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary: string;
  description: string;
  postedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  appliedAt: Date;
  status: "Applied" | "Viewed" | "Shortlisted" | "Rejected" | "Offered";
}

export type Candidate = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  applicationDate: string;
  status: "Applied" | "Viewed" | "Shortlisted" | "Rejected" | "Offered";
}
