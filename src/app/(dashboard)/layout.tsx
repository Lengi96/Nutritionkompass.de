import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { TRPCProvider } from "@/trpc/client";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ensureUserSettings } from "@/server/settings";
import { getUiDensityDataValue } from "@/lib/settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
  const userSettings = await ensureUserSettings(session.user.id);
  const uiDensity = getUiDensityDataValue(userSettings.uiDensity);

  return (
    <SessionProvider>
      <TRPCProvider>
        <div
          id="dashboard-shell"
          data-ui-density={uiDensity}
          className="min-h-screen overflow-x-hidden bg-background"
        >
          <Sidebar user={user} />
          <div className="min-w-0 lg:pl-64">
            <TrialBanner />
            <TopBar user={user} />
            <main className="p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </TRPCProvider>
    </SessionProvider>
  );
}
