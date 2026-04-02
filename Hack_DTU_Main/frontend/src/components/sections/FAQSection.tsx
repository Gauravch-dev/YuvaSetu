import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const faqs = [
  {
    question: 'What is YuvaSetu?',
    answer: 'YuvaSetu is an AI-powered career platform that eliminates opportunity fatigue by matching you with your top 5 most relevant job opportunities using explainable AI. We provide transparent recommendations so you understand exactly why each job matches your profile.'
  },
  {
    question: 'How does the AI matching work?',
    answer: 'Our matching engine uses lightweight, efficient machine learning models to analyze your skills, experience, and preferences. Unlike heavy language models, we focus on delivering fast, accurate matches with complete transparency - you see exactly why each job was recommended to you.'
  },
  {
    question: 'Is YuvaSetu free for students?',
    answer: 'Yes! YuvaSetu is completely free for students. We believe every student deserves access to quality career opportunities without financial barriers. Our mission is to help you find the right job, not to profit from your job search.'
  },
  {
    question: 'How is this different from other job portals?',
    answer: 'Unlike traditional job portals that overwhelm you with hundreds of listings, YuvaSetu shows you only your top 5 most relevant matches. We use explainable AI to tell you exactly why each job fits you, eliminating guesswork and opportunity fatigue.'
  },
  {
    question: 'What makes YuvaSetu scalable?',
    answer: 'YuvaSetu is built with production-ready technology optimized for scale. By using efficient ML models instead of heavy LLMs, we deliver superior results with lower cost, lower latency, and high scalability - ready to serve millions of users.'
  },
  {
    question: 'How can employers use YuvaSetu?',
    answer: 'Employers can post job opportunities on YuvaSetu and leverage our AI matching to find the best candidates. Our system helps you discover talent that truly fits your requirements, saving time and improving hiring quality.'
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

   const faqs = [
    {
      question: t('faq.question1'),
      answer: t('faq.answer1')
    },
    {
      question: t('faq.question2'),
      answer: t('faq.answer2')
    },
    {
      question: t('faq.question3'),
      answer: t('faq.answer3')
    },
    {
      question: t('faq.question4'),
      answer: t('faq.answer4')
    },
    {
      question: t('faq.question5'),
      answer: t('faq.answer5')
    },
    {
      question: t('faq.question6'),
      answer: t('faq.answer6')
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t('faq.badge')}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {t('faq.title')}<span className="text-primary">{t('faq.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('faq.subtitle')}
          </p>
        </RevealOnScroll>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <RevealOnScroll key={index} delay={index * 50}>
              <div className="glass rounded-2xl overflow-hidden hover:border-primary/50 transition-colors">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 group"
                  aria-expanded={openIndex === index}
                >
                  <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <Plus 
                    className={`w-6 h-6 text-primary transition-transform flex-shrink-0 ${
                      openIndex === index ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'pb-5 max-h-96' : 'max-h-0'
                  }`}
                >
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('faq.stillHaveQuestions')}{' '}
            <a href="mailto:contact@yuvasetu.com" className="text-primary hover:underline font-medium">
              {t('faq.contactUs')}
            </a>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
};
