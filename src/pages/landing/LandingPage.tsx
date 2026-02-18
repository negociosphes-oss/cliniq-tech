import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Features } from './components/Features';
import { Arsenal } from './components/Arsenal';
import { Pricing } from './components/Pricing';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <About />
        <Features />
        <Arsenal />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}