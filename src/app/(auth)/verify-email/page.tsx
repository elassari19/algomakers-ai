"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const token = searchParams.get("token");

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token) {
      setLoading(true);
      fetch("/api/auth/verify-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            toast.success("Email verified!", { description: data.message });
            setSubmitted(true);
            setTimeout(() => router.push("/signin"), 2000);
          } else {
            setErrorMsg(data.error || data.message || "Verification failed");
          }
        })
        .catch(() => {
          setErrorMsg("Something went wrong");
        })
        .finally(() => setLoading(false));
    }
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification email sent!", { description: data.message });
      } else {
        setErrorMsg(data.error || data.message || "Failed to resend verification email");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" richColors />
      {/* Left side - Illuminated image */}
      <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
        <Image
          src="/illuminated.png"
          alt="Markets illuminated"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Verify email form */}
      <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto h-12 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Algo markers"
                width={24}
                height={24}
                className="h-20 w-60 object-contain"
              />
            </div>
          </div>

          {/* Verify Email Card */}
          <div className="bg-slate-900 p-8 rounded-lg shadow-lg w-full space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Verify Your Email</h2>
            {submitted ? (
              <p className="text-green-400 text-center">Your email has been verified! Redirecting to sign in...</p>
            ) : (!token || (token && !loading && errorMsg)) ? (
              <>
                {errorMsg && <p className="text-red-400 mb-4 text-center">{errorMsg}</p>}
                <form onSubmit={handleResend} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email to resend verification"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-slate-400 mb-4 text-center">Verifying your email...</p>
            )}
          </div>

          <div className="text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
