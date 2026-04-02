import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { Helmet } from "react-helmet-async";
import { Linkedin, Github, Mail } from "lucide-react";

const founders = [
  {
    name: "JOY B",
    role: "Co-Founder & CEO",
    bio: "Passionate about solving career discovery challenges with AI-driven solutions. Leading the vision and strategy for YuvaSetu.",
    image: "/placeholder-founder-1.jpg",
    linkedin: "#",
    github: "#",
    email: "joy@yuvasetu.com",
  },
  {
    name: "Shubham K",
    role: "Co-Founder & CTO",
    bio: "Full-stack developer with expertise in building scalable platforms. Architecting YuvaSetu's technical infrastructure.",
    image: "/placeholder-founder-2.jpg",
    linkedin: "#",
    github: "#",
    email: "shubham@yuvasetu.com",
  },
  {
    name: "Atharva C",
    role: "Co-Founder & CPO",
    bio: "Product strategist focused on creating seamless user experiences. Driving product innovation at YuvaSetu.",
    image: "/placeholder-founder-3.jpg",
    linkedin: "#",
    github: "#",
    email: "atharva@yuvasetu.com",
  },
  {
    name: "Arjun V",
    role: "Co-Founder & CMO",
    bio: "Marketing expert dedicated to connecting job seekers with opportunities. Leading growth and marketing initiatives.",
    image: "/placeholder-founder-4.jpg",
    linkedin: "#",
    github: "#",
    email: "arjun@yuvasetu.com",
  },
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Meet the YuvaSetu Founders | Team Havoc</title>
        <meta
          name="description"
          content="Meet the founders of YuvaSetu - Joy B, Shubham K, Atharva C, and Arjun V. Learn about our mission to revolutionize career discovery with AI."
        />
        <meta
          name="keywords"
          content="YuvaSetu founders, Team Havoc, about us, career platform team"
        />
      </Helmet>

      <main className="bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

          <div className="container mx-auto px-4 relative z-10">
            <RevealOnScroll className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Team Havoc
              </span>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                Meet the <span className="text-primary">Founders</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                We're a team of passionate innovators on a mission to transform
                the way students discover career opportunities through
                AI-powered matching and transparent recommendations.
              </p>
            </RevealOnScroll>
          </div>
        </section>

        {/* Founders Grid */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {founders.map((founder, index) => (
                <RevealOnScroll key={founder.name} delay={index * 100}>
                  <div className="glass rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar - Illustrated Style */}
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-1 mb-6 group-hover:scale-110 transition-transform shadow-xl">
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-5xl
                          ${index === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : ''}
                          ${index === 1 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : ''}
                          ${index === 2 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : ''}
                          ${index === 3 ? 'bg-gradient-to-br from-orange-500 to-amber-600' : ''}
                        `}>
                          {index === 0 && '🎯'}
                          {index === 1 && '💻'}
                          {index === 2 && '🎨'}
                          {index === 3 && '📈'}
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-display text-2xl font-bold mb-2">
                        {founder.name}
                      </h3>
                      <p className="text-primary font-medium mb-4">
                        {founder.role}
                      </p>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {founder.bio}
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center gap-4">
                        <a
                          href={founder.linkedin}
                          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-5 h-5 text-primary" />
                        </a>
                        <a
                          href={founder.github}
                          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                          aria-label="GitHub"
                        >
                          <Github className="w-5 h-5 text-primary" />
                        </a>
                        <a
                          href={`mailto:${founder.email}`}
                          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                          aria-label="Email"
                        >
                          <Mail className="w-5 h-5 text-primary" />
                        </a>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

          <div className="container mx-auto px-4 relative z-10">
            <RevealOnScroll className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Our <span className="text-primary">Mission</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                At YuvaSetu, we believe that every student deserves access to
                opportunities that truly match their potential. We're
                eliminating opportunity fatigue by using explainable AI to show
                you only the most relevant jobs - with complete transparency on
                why each match matters.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <span className="text-2xl">🚀</span>
                <span className="font-display font-bold">
                  Building the future of career discovery
                </span>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default About;
