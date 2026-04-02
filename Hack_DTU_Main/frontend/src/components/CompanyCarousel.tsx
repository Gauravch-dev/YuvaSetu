import { useState } from 'react';

// Company data - add logo files to /public/companies/ folder
const companies = [
  { name: 'Google', initials: 'G', gradient: 'from-blue-500 to-red-500', logo: '/companies/google.png' },
  { name: 'Microsoft', initials: 'MS', gradient: 'from-blue-600 to-cyan-400', logo: '/companies/microsoft.jpeg' },
  { name: 'Amazon', initials: 'A', gradient: 'from-orange-500 to-yellow-400', logo: '/companies/amazon.png' },
  { name: 'Apple', initials: 'A', gradient: 'from-gray-700 to-gray-900', logo: '/companies/apple.png' },
  { name: 'Meta', initials: 'M', gradient: 'from-blue-500 to-purple-600', logo: '/companies/meta.png' },
  { name: 'Netflix', initials: 'N', gradient: 'from-red-600 to-red-800', logo: '/companies/netflix.png' },
  { name: 'Tesla', initials: 'T', gradient: 'from-red-500 to-gray-800', logo: '/companies/tesla.png' },
  { name: 'Spotify', initials: 'S', gradient: 'from-green-500 to-green-700', logo: '/companies/spotify.png' },
  { name: 'Adobe', initials: 'Ae', gradient: 'from-red-600 to-pink-600', logo: '/companies/adobe.png' },
  { name: 'Salesforce', initials: 'SF', gradient: 'from-blue-400 to-cyan-500', logo: '/companies/salesforce.png' },
  { name: 'Oracle', initials: 'O', gradient: 'from-red-600 to-orange-600', logo: '/companies/oracle.png' },
  { name: 'IBM', initials: 'IBM', gradient: 'from-blue-600 to-blue-800', logo: '/companies/ibm.png' },
  { name: 'Intel', initials: 'I', gradient: 'from-blue-500 to-blue-700', logo: '/companies/intel.png' },
  { name: 'Nvidia', initials: 'N', gradient: 'from-green-500 to-emerald-600', logo: '/companies/nvidia.png' },
  { name: 'PayPal', initials: 'PP', gradient: 'from-blue-500 to-blue-600', logo: '/companies/paypal.png' },
];

// Duplicate for infinite scroll
const duplicatedCompanies = [...companies, ...companies];

export const CompanyCarousel = () => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (companyName: string) => {
    setFailedImages(prev => new Set(prev).add(companyName));
  };

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background to-muted/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Trusted Partners
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Top Companies <span className="text-primary">Hiring</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of job seekers who found their dream roles through partnerships with leading organizations
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling Track */}
          <div className="overflow-hidden group py-12">
            <div
              className="flex gap-12 animate-scroll-infinite group-hover:[animation-play-state:paused]"
              style={{
                width: 'fit-content',
              }}
            >
              {duplicatedCompanies.map((company, index) => {
                const showFallback = failedImages.has(company.name);
                
                return (
                  <div
                    key={`${company.name}-${index}`}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-40 h-32 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 hover:border-primary hover:shadow-glow hover:scale-110">
                      {!showFallback ? (
                        /* Try to load image first */
                        <img
                          src={company.logo}
                          alt={`${company.name} logo`}
                          className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300 dark:bg-white dark:rounded-xl dark:p-2"
                          onError={() => handleImageError(company.name)}
                        />
                      ) : (
                        /* Fallback to gradient circle with initials */
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${company.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-white font-bold text-lg">
                            {company.initials}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center">
                        {company.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats below carousel */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">500+</div>
            <p className="text-sm text-muted-foreground">Companies</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">10k+</div>
            <p className="text-sm text-muted-foreground">Active Jobs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">95%</div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
};
