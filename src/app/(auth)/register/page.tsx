import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Create a new CareerLink account. Are you a job seeker or a recruiter?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Button asChild className="w-full">
            <Link href="/register/seeker">I&apos;m a Job Seeker</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
            <Link href="/register/recruiter">I&apos;m a Recruiter</Link>
        </Button>
      </CardContent>
      <CardFooter className="flex-col">
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
