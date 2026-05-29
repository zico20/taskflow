import { LandingPage } from "@/components/landing/landing-page";

// Public landing page — the front door. Visitors can read about the product
// and try the demo without an account. (Logged-in users who navigate here still
// see the landing; the "Log in" / "Start" CTAs take them where they need to go.)
export default function Home() {
  return <LandingPage />;
}
