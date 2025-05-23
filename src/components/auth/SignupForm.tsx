// Component: SignupForm
// Description: Provides a dialog-based sign-up form.
// Initially generated by AI based on user prompt.

"use client";

import { Button } from "@/components/ui/button";
// Checkbox is not used in the signup form demo, removing import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Assuming cn is needed, adding just in case
import { useId } from "react";

// Note: This component renders a DialogTrigger and the DialogContent.
// It's designed to be placed where you want the "Sign up" button to appear.
function SignupForm() {
  const id = useId();
  return (
    <Dialog>
      <DialogTrigger asChild>
         {/* Consider customizing this button's appearance/text */}
        <Button variant="outline">Sign up</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]"> {/* Explicit width from demo */}
        <div className="flex flex-col items-center gap-2">
           {/* Replaced placeholder SVG with App Logo */}
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
            aria-hidden="true"
          >
             {/* Ensure duitr-logo.svg is in the public folder */}
            <img src="/pwa-icons/new/192.png" alt="Duitr Logo" className="h-8 w-8" />
          </div>
          <DialogHeader>
            {/* Adjusted Title from demo */}
            <DialogTitle className="text-center sm:text-center">Create your Duitr Account</DialogTitle> {/* Centered */}
            <DialogDescription className="text-center sm:text-center">
              We just need a few details to get you started.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Consider wrapping with <Form> from react-hook-form for validation */}
        <form className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Full name</Label>
              <Input id={`${id}-name`} placeholder="Matt Welsh" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input id={`${id}-email`} placeholder="hi@yourcompany.com" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                placeholder="Enter your password"
                type="password"
                required
              />
            </div>
          </div>
           {/* Add onSubmit handler to the form and change type="submit" */}
          <Button type="button" className="w-full">
            Sign up
          </Button>
        </form>

        <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          <span className="text-xs text-muted-foreground">Or</span>
        </div>

        {/* Add onClick handler for Google signup */}
        <Button variant="outline" className="w-full"> {/* Added w-full */} 
          Continue with Google
        </Button>

        <p className="px-6 text-center text-xs text-muted-foreground"> {/* Added px-6 for potential centering */}
          By signing up you agree to our{" "}
          {/* Replace # with actual link to Terms */}
          <a href="#" className="underline hover:no-underline text-primary"> {/* Added text-primary */}
            Terms
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Exporting as named export
export { SignupForm }; 