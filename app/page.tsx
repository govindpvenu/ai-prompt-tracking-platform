import Features from "@/components/features-4";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";

export default function Home() {
  return (
    <>
      <HeroHeader />
      <main>
        <HeroSection />
        <Features />
      </main>
      <FooterSection />
    </>
  );
}
