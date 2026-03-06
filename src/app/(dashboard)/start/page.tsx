import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserLandingPageHref } from "@/server/settings";

export default async function StartPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const href = await getUserLandingPageHref(session.user.id);
  redirect(href);
}
