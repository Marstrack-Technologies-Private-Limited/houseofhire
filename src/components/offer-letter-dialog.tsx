"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/lib/types";
import { generateOfferLetterAction } from "@/actions/generate-offer-letter-action";
import { Loader2, Printer, RefreshCw } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface OfferLetterDialogProps {
  candidate: Candidate;
  onClose: () => void;
}

export function OfferLetterDialog({ candidate, onClose }: OfferLetterDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedHtml, setGeneratedHtml] = React.useState<string | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const [formData, setFormData] = React.useState({
    companyName: "TechCorp",
    startDate: new Date().toISOString().split("T")[0],
    salary: 140000,
    benefits: "Comprehensive health, dental, and vision insurance, 401(k) matching, unlimited PTO, and a professional development stipend.",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedHtml(null);

    const input = {
      candidateName: candidate.name,
      jobTitle: candidate.jobTitle,
      ...formData,
      salary: Number(formData.salary)
    };

    const result = await generateOfferLetterAction(input);

    setIsLoading(false);
    if (result.success && result.data) {
      setGeneratedHtml(result.data.offerLetterHtml);
      toast({
        title: "Offer Letter Generated",
        description: "The offer letter has been successfully created.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write('<html><head><title>Offer Letter</title></head><body>');
    printWindow?.document.write(generatedHtml || '');
    printWindow?.document.write('</body></html>');
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Offer Letter for {candidate.name}</DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a professional offer letter.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={formData.companyName} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="salary">Annual Salary ($)</Label>
                <Input id="salary" type="number" value={formData.salary} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="benefits">Benefits</Label>
                <Textarea id="benefits" value={formData.benefits} onChange={handleInputChange} required rows={5} />
              </div>
               <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : generatedHtml ? (
                  <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate Letter</>
                ) : (
                  "Generate Letter"
                )}
              </Button>
            </form>
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold mb-2">Preview</h3>
            <ScrollArea className="h-[400px] w-full">
              <div ref={printRef} className="prose prose-sm dark:prose-invert max-w-none p-2 rounded-md bg-background">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ): generatedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                ) : (
                  <div className="text-muted-foreground text-center py-16">
                    Generated offer letter will appear here.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} disabled={!generatedHtml || isLoading}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
