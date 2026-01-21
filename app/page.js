import { redirect } from "next/navigation";
import { checkUser } from "@/lib/checkUser";
import LandingClient from "@/components/landing-client";

export default async function LandingPage() {
  const user = await checkUser();

  if (user) {
    if (user.role === 'admin') {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return <LandingClient />;
}
