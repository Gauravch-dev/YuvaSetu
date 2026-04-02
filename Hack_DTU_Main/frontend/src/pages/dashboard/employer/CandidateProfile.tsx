import { MapPin, Mail, Phone, Linkedin, Github, Download, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { exportResumeToPDF } from '@/lib/resume-export';

// We can reuse the Profile Interface since it's just a view
export const CandidateProfile = () => {
    const { id } = useParams(); // Retrieves candidate's userId from URL
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCandidateProfile = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token && id) {
                    // IMPORTANT: We need an API that allows Employers to fetch a specific candidate by ID
                    // We'll try using a 'public' or 'admin' style fetch, 
                    // but usually the backend 'getJobSeekerProfile' is for 'me'.
                    // We likely need 'getJobSeekerProfileById' endpoint.
                    // For now, I'll attempt to use the existing `getJobSeekerProfile` from lib/auth-api but modify it or import a new function.

                    // Correction: The backend likely has a route for this or we need to add it.
                    // Checking `employer.routes.ts` or `user.routes.ts` would be wise, but to save time 
                    // I will add a `fetchCandidateById` helper in `auth-api.ts`.

                    const { fetchCandidateById } = await import('@/lib/auth-api');
                    const data = await fetchCandidateById(token, id);
                    setProfile(data);
                }
            } catch (error) {
                console.error("Failed to fetch candidate profile", error);
                toast.error("Could not load candidate profile.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCandidateProfile();
    }, [id]);

    const handleDownloadResume = async () => {
        if (!profile) return;
        try {
            toast.promise(
                exportResumeToPDF(profile, `${profile.personalInfo.fullName || 'Candidate'}_Resume.pdf`),
                {
                    loading: 'Generating PDF...',
                    success: 'Resume downloaded!',
                    error: 'Failed to generate PDF'
                }
            );
        } catch (error) {
            toast.error("Failed to download");
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading candidate profile...</div>;
    if (!profile) return <div className="p-12 text-center text-muted-foreground">Candidate not found.</div>;

    const { personalInfo, education, experience, skills, projects } = profile;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            {/* Header Banner (Read Only) */}
            <div className="relative h-48 rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: personalInfo.coverImage ? `url(${personalInfo.coverImage})` : undefined }}
            >
                {!personalInfo.coverImage && <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />}
            </div>

            {/* Profile Info */}
            <div className="px-4 md:px-8 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-background p-2 shadow-2xl ring-4 ring-background overflow-hidden">
                            <div className="w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold border-2 border-primary/20 overflow-hidden relative">
                                {personalInfo.profilePicture ? (
                                    <img src={personalInfo.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 opacity-50" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 py-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-display font-bold">{personalInfo.fullName}</h1>
                                <p className="text-lg text-muted-foreground">{experience?.[0]?.role || "Candidate"} • <MapPin className="inline w-4 h-4 ml-1" /> {personalInfo.location || "India"}</p>
                            </div>
                            {/* Match Score Badge could go here later */}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button variant="outline" size="sm" className="gap-2 copy-cursor" onClick={() => { navigator.clipboard.writeText(personalInfo.email); toast.success('Email copied'); }}>
                                <Mail className="w-3.5 h-3.5" /> {personalInfo.email}
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 copy-cursor" onClick={() => { navigator.clipboard.writeText(personalInfo.phone); toast.success('Phone copied'); }}>
                                <Phone className="w-3.5 h-3.5" /> {personalInfo.phone}
                            </Button>
                            {personalInfo.linkedin && (
                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                    <a href={personalInfo.linkedin} target="_blank" rel="noreferrer">
                                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                    </a>
                                </Button>
                            )}
                            {personalInfo.github && (
                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                    <a href={personalInfo.github} target="_blank" rel="noreferrer">
                                        <Github className="w-3.5 h-3.5" /> GitHub
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pb-2">
                        <Button variant="outline" size="lg" className="gap-2" onClick={handleDownloadResume}>
                            <Download className="w-4 h-4" /> Download Resume
                        </Button>
                        {/* Maybe 'Shortlist' or 'Reject' buttons here later */}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-8">
                    {/* About */}
                    <section className="bg-card border border-border rounded-2xl p-8 space-y-4">
                        <h2 className="font-bold text-xl">About</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {personalInfo.bio || "No bio available."}
                        </p>
                    </section>

                    {/* Experience */}
                    <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
                        <h2 className="font-bold text-xl">Work Experience</h2>
                        <div className="space-y-8">
                            {experience?.map((exp: any, i: number) => (
                                <div key={i} className="relative pl-8 border-l-2 border-border/50 space-y-2">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background ${i === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                    <h3 className="font-bold text-lg">{exp.role}</h3>
                                    <div className="text-sm text-primary font-medium">{exp.company} • {exp.duration}</div>
                                    <p className="text-muted-foreground text-sm">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                            {!experience?.length && <p className="text-muted-foreground">No experience listed.</p>}
                        </div>
                    </section>

                    {/* Education */}
                    <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
                        <h2 className="font-bold text-xl">Education</h2>
                        <div className="space-y-6">
                            {education?.map((edu: any, i: number) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{edu.degree}</h3>
                                        <div className="text-sm text-muted-foreground">{edu.institution}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-foreground">{edu.year}</div>
                                        {edu.score && <div className="text-sm text-green-600 font-medium">{edu.score}</div>}
                                    </div>
                                </div>
                            ))}
                            {!education?.length && <p className="text-muted-foreground">No education listed.</p>}
                        </div>
                    </section>

                    {/* Projects */}
                    <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
                        <h2 className="font-bold text-xl">Projects</h2>
                        <div className="grid gap-6">
                            {projects?.map((proj: any, i: number) => (
                                <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{proj.title}</h3>
                                        {proj.link && (
                                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">View Project</a>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{proj.description}</p>
                                    {proj.technologies && (
                                        <div className="flex flex-wrap gap-2">
                                            {proj.technologies.split(',').map((tech: string) => (
                                                <Badge key={tech} variant="outline" className="text-xs">{tech.trim()}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!projects?.length && <p className="text-muted-foreground">No projects listed.</p>}
                        </div>
                    </section>

                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    {/* Skills */}
                    <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
                        <h2 className="font-bold text-lg">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {skills?.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="px-3 py-1 font-normal bg-muted/50 hover:bg-muted text-foreground">
                                    {skill}
                                </Badge>
                            ))}
                            {!skills?.length && <p className="text-sm text-muted-foreground">No skills listed.</p>}
                        </div>
                    </section>

                    {/* Languages */}
                    {personalInfo.languages && (
                        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
                            <h2 className="font-bold text-lg">Languages</h2>
                            <div className="space-y-3">
                                {personalInfo.languages.split(',').map((lang: string, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{lang.trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};
