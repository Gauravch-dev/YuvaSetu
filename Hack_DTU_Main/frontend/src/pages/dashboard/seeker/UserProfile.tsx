import { MapPin, Mail, Phone, Linkedin, Github, Download, Edit2, Plus, Code, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { AvatarSelector } from '@/components/dashboard/AvatarSelector';
import { exportResumeToPDF } from '@/lib/resume-export';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const UserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const { getJobSeekerProfile } = await import('@/lib/auth-api');
        const data = await getJobSeekerProfile(token);
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarSelect = async (url: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token && profile) {
        const { saveJobSeekerProfile } = await import('@/lib/auth-api');
        // Optimistic update
        const updatedProfile = {
          ...profile,
          personalInfo: { ...profile.personalInfo, profilePicture: url }
        };
        setProfile(updatedProfile);

        await saveJobSeekerProfile(token, updatedProfile);
        toast.success("Avatar updated!");
      }
    } catch (error) {
      toast.error("Failed to update avatar");
      fetchProfile(); // Revert
    }
  };

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token && profile) {
        const { uploadFile } = await import('@/lib/upload-api');
        const { saveJobSeekerProfile } = await import('@/lib/auth-api');

        const url = await uploadFile(file, token);

        const updatedProfile = {
          ...profile,
          personalInfo: { ...profile.personalInfo, coverImage: url }
        };
        setProfile(updatedProfile);
        await saveJobSeekerProfile(token, updatedProfile);
        toast.success("Cover image updated!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload cover image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!profile) return;
    try {
      toast.promise(
        exportResumeToPDF(profile, `${profile.personalInfo.fullName || 'Resume'}.pdf`),
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

  const handleEditProfile = () => {
    if (profile) {
      navigate('/onboarding', { state: { editMode: true, profileData: profile } });
    }
  };

  if (!profile) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

  const { personalInfo, education, experience, skills, projects } = profile;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <AvatarSelector
        open={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        onSelect={handleAvatarSelect}
        currentName={personalInfo.fullName}
      />

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleCoverUpload}
      />

      {/* Header Banner */}
      <div className="relative h-48 rounded-3xl bg-gradient-to-r from-primary/20 to-accent/20 border border-border overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: personalInfo.coverImage ? `url(${personalInfo.coverImage})` : undefined }}
      >
        {!personalInfo.coverImage && <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />}
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-4 right-4 gap-2 shadow-lg backdrop-blur-md bg-white/50 hover:bg-white/80"
          onClick={handleCoverClick}
          disabled={isUploading}
        >
          <Edit2 className="w-3 h-3" />
          {isUploading ? 'Uploading...' : 'Edit Cover'}
        </Button>
      </div>

      {/* Profile Info */}
      <div className="px-4 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-background p-2 shadow-2xl ring-4 ring-background overflow-hidden cursor-pointer" onClick={() => setIsAvatarOpen(true)}>
              <div className="w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold border-2 border-primary/20 overflow-hidden relative">
                {personalInfo.profilePicture ? (
                  <img src={personalInfo.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  personalInfo.fullName ? personalInfo.fullName.charAt(0).toUpperCase() : 'U'
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 py-2">
            <h1 className="text-3xl font-display font-bold">{personalInfo.fullName}</h1>
            <p className="text-lg text-muted-foreground">{experience?.[0]?.role || "Job Seeker"} • <MapPin className="inline w-4 h-4 ml-1" /> {personalInfo.location || "India"}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="w-3.5 h-3.5" /> {personalInfo.email}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
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
            <Button variant="seeker" size="lg" className="gap-2" onClick={handleEditProfile}>
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-8">
          {/* About */}
          <section className="bg-card border border-border rounded-2xl p-8 space-y-4">
            <h2 className="font-bold text-xl">About Me</h2>
            <p className="text-muted-foreground leading-relaxed">
              {personalInfo.bio || "No bio added yet."}
            </p>
          </section>

          {/* Experience */}
          <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Work Experience</h2>
              <Button variant="ghost" size="sm" className="text-primary"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>

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
              {!experience?.length && <p className="text-muted-foreground">No experience added.</p>}
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
              {!education?.length && <p className="text-muted-foreground">No education added.</p>}
            </div>
          </section>

          {/* Projects */}
          <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Projects</h2>
              <Button variant="ghost" size="sm" className="text-primary"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
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
              {!projects?.length && <p className="text-muted-foreground">No projects added.</p>}
            </div>
          </section>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Skills */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Skills</h2>
              <Edit2 className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex flex-wrap gap-2">
              {skills?.map((skill: string) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1 font-normal bg-muted/50 hover:bg-muted text-foreground">
                  {skill}
                </Badge>
              ))}
              {!skills?.length && <p className="text-sm text-muted-foreground">No skills added.</p>}
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
