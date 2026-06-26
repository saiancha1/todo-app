"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      router.replace("/tasks");
    } catch (err) {
      // Inputs are preserved — we only set an error message.
      setError(err instanceof ApiError ? err.message : "Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isRegister ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription>
            {isRegister ? "Sign up to start tracking tasks." : "Sign in to your tasks."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 8 characters" : "Your password"}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-4">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Please wait…" : isRegister ? "Sign up" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? "Already have an account? " : "Need an account? "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {isRegister ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
