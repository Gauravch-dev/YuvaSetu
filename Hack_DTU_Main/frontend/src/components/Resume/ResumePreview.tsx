'use client';

import { useMemo } from 'react';
import type { OnboardingData } from '@/contexts/OnboardingContext';

interface ResumePreviewProps {
    data: OnboardingData;
    className?: string;
}

/**
 * Live HTML Resume Preview
 * - Updates instantly on form change
 * - ATS-friendly single-column layout
 * - ONE PAGE constraint via CSS
 */
export const ResumePreview = ({ data, className = '' }: ResumePreviewProps) => {
    const { personalInfo, education, experience, projects, certifications, skills } = data;

    // Build contact line
    const contactParts = useMemo(() => {
        const parts: string[] = [];
        if (personalInfo.email) parts.push(personalInfo.email);
        if (personalInfo.phone) parts.push(personalInfo.phone);
        if (personalInfo.linkedin) parts.push(personalInfo.linkedin);
        if (personalInfo.github) parts.push(personalInfo.github);
        return parts;
    }, [personalInfo]);

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
            <div
                id="resume-preview"
                className="p-8 text-black text-[10pt] leading-tight mx-auto"
                style={{
                    fontFamily: 'Arial, sans-serif',
                    width: '210mm', // standard A4 width
                    minHeight: '297mm', // standard A4 height
                    boxSizing: 'border-box'
                }}
            >
                {/* Header */}
                <header className="text-center mb-4 border-b border-gray-300 pb-3">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                        {personalInfo.fullName || 'Your Name'}
                    </h1>
                    <p className="text-[9pt] text-gray-600">
                        {contactParts.length > 0 ? contactParts.join(' | ') : 'email@example.com | +1234567890'}
                    </p>
                </header>

                {/* Summary */}
                {personalInfo.bio && (
                    <section className="mb-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            SUMMARY
                        </h2>
                        <p className="text-gray-700 text-[9pt]">
                            {personalInfo.bio.slice(0, 150)}
                            {personalInfo.bio.length > 150 ? '...' : ''}
                        </p>
                    </section>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <section className="mb-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            EDUCATION
                        </h2>
                        {education.slice(0, 2).map((edu, i) => (
                            <div key={i} className="mb-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-[10pt]">{edu.degree || 'Degree'}</span>
                                    <span className="text-gray-600 text-[9pt]">{edu.year}</span>
                                </div>
                                <div className="text-gray-600 text-[9pt]">
                                    {edu.institution}
                                    {edu.score && ` | ${edu.score}`}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                    <section className="mb-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            EXPERIENCE
                        </h2>
                        {experience.slice(0, 3).map((exp, i) => (
                            <div key={i} className="mb-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-[10pt]">{exp.role || 'Role'}</span>
                                    <span className="text-gray-600 text-[9pt]">{exp.duration}</span>
                                </div>
                                <div className="text-gray-600 text-[9pt] mb-1">{exp.company}</div>
                                {exp.description && (
                                    <ul className="list-disc list-inside text-[9pt] text-gray-700 ml-2">
                                        {exp.description.split('\n').slice(0, 3).map((line, j) => (
                                            <li key={j}>{line.trim()}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                    <section className="mb-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            PROJECTS
                        </h2>
                        {projects.slice(0, 2).map((proj, i) => (
                            <div key={i} className="mb-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-[10pt]">{proj.title}</span>
                                    {proj.technologies && (
                                        <span className="text-gray-600 text-[9pt]">{proj.technologies}</span>
                                    )}
                                </div>
                                {proj.description && (
                                    <ul className="list-disc list-inside text-[9pt] text-gray-700 ml-2">
                                        {proj.description.split('\n').slice(0, 2).map((line, j) => (
                                            <li key={j}>{line.trim()}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                    <section className="mb-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            CERTIFICATIONS & ACHIEVEMENTS
                        </h2>
                        <ul className="list-disc list-inside text-[9pt] text-gray-700">
                            {certifications.slice(0, 4).map((cert, i) => (
                                <li key={i}>
                                    {cert.title}
                                    {cert.issuer && ` - ${cert.issuer}`}
                                    {cert.year && ` (${cert.year})`}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <section>
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            SKILLS
                        </h2>
                        <p className="text-[9pt] text-gray-700">
                            {skills.join(' • ')}
                        </p>
                    </section>
                )}

                {/* Languages */}
                {personalInfo.languages && (
                    <section className="mt-3">
                        <h2 className="text-[11pt] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
                            LANGUAGES
                        </h2>
                        <p className="text-[9pt] text-gray-700">
                            {personalInfo.languages}
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
};

export default ResumePreview;
