import { Bestsellers } from "@/components/home/Bestsellers";
import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { Receipt } from "@/components/home/Receipt";
import { StoryMenuCards } from "@/components/home/StoryMenuCards";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Receipt />
      <Bestsellers />
      <StoryMenuCards />
    </>
  );
}
