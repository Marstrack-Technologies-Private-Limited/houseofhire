
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";


const BASEURL_ADMIN = "https://devapi.tech23.net/global/login";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      const response = await axios.post(BASEURL_ADMIN, {
        email: email,
        password: password,
        MODULENAME: "RECRUITMENT",
      });

      if (response.data.message) {
        setServerError(response.data.message);
        toast({ title: "Login Failed", description: response.data.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Admin logged in successfully!" });
        const { user, authenticationToken, sclientSecret } = response.data;
        
        localStorage.setItem('user', JSON.stringify({
            ...user,
            name: user.userName,
            email: user.emailId,
            role: 'admin'
        }));
        localStorage.setItem('auth-token', authenticationToken);
        localStorage.setItem('session-token', sclientSecret);

        router.push("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred during login. Please try again later.";
      setServerError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="admin@example.com" 
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
      </CardFooter>
    </Card>
  );
}
