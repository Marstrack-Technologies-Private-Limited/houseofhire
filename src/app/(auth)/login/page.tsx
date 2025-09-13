
"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";


const BASEURL_GLOBAL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASEURL_GLOBAL;
const BASEURL_SESSION_TOKEN = process.env.NEXT_PUBLIC_VITE_REACT_APP_BASE_SESSION_TOKEN;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loginAs, setLoginAs] = useState<"seeker" | "recruiter">("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Error", description: "Please enter your password.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setServerError("");
    
    try {
      let response;
      if (loginAs === "recruiter") {
        response = await axios.get(
          `${BASEURL_GLOBAL}/globalViewHandler?viewname=521&EMAILADDRESS=${email}&RECRUITERPASSWORD=${password}`, // &VERIFIED=true
          { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
      } else {
        // Default to Job Seeker
        response = await axios.get(
          `${BASEURL_GLOBAL}/globalViewHandler?viewname=1154&EMAILADDRESS=${email}&PASSWORD=${password}`, // &VERIFIED=true
          { headers: { "session-token": BASEURL_SESSION_TOKEN } }
        );
      }

      if (response.data.length === 0) {
        setServerError("Invalid email or password. Please try again.");
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Logged in successfully!" });
        const userData = response.data[0];
        
        // Store user info in local storage
        if (loginAs === 'recruiter') {
            localStorage.setItem('user', JSON.stringify({
                ...userData,
                name: userData.RECRUITERCOMPANYNAME,
                email: userData.EMAILADDRESS,
                role: 'recruiter'
            }));
        } else {
            localStorage.setItem('user', JSON.stringify({
                ...userData,
                name: userData.JOBSEEKERNAME,
                email: userData.EMAILADDRESS,
                role: 'seeker'
            }));
        }

        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "An error occurred during login. Please try again later.";
      setServerError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <RadioGroup defaultValue="seeker" onValueChange={(value: "seeker" | "recruiter") => setLoginAs(value)}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seeker" id="seeker" />
              <Label htmlFor="seeker">Job Seeker</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recruiter" id="recruiter" />
              <Label htmlFor="recruiter">Recruiter</Label>
            </div>
          </div>
        </RadioGroup>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
               <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
          </div>
        </div>
         {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
           {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              "Sign in"
            )}
        </Button>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
