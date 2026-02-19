import { TRPCProvider } from "@/trpc/client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen flex items-center justify-center bg-background">
        {children}
      </div>
    </TRPCProvider>
  );
}
