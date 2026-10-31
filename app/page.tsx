"use client";

import ClosingSection from "./components/home/ClosingSection";
import DataModelSection from "./components/home/DataModelSection";
import FeatureList from "./components/home/FeatureList";
import HeroSection from "./components/home/HeroSection";
import PipelineSection from "./components/home/PipelineSection";
import SemanticModel from "./components/home/SemanticModel";
import ValidationSection from "./components/home/ValidationSection";

export default function Home() {
  return (
    <main className="flex-1 bg-ow-bg font-sans text-ow-text">
      <HeroSection />
      <PipelineSection />
      <FeatureList />
      <SemanticModel />
      <ValidationSection />
      <DataModelSection />
      <ClosingSection />
    </main>
  );
}
