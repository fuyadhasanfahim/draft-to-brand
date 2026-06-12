import { Hero } from "@/components/home/hero";
import { LogoMarquee } from "@/components/home/logo-marquee";
import { ServicesPreview } from "@/components/home/services-preview";
import { WorkPreview } from "@/components/home/work-preview";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { HomeCta } from "@/components/home/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <ServicesPreview />
      <WorkPreview />
      <Process />
      <Testimonials />
      <HomeCta />
    </>
  );
}
