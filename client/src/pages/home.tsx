import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import Vision from "@/components/sections/vision";
import HowItWorks from "@/components/sections/how-it-works";
import CoreOperations from "@/components/sections/core-operations";
import Product from "@/components/sections/product";
import BusinessPlan from "@/components/sections/business-plan";
import Roadmap from "@/components/sections/roadmap";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Vision />
        <HowItWorks />
        <CoreOperations />
        <Product />
        <BusinessPlan />
        <Roadmap />
      </main>
      <Footer />
    </div>
  );
}
