import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, FileText, Trash2 } from 'lucide-react';
import { createJob, updateJob, fetchJobs, deleteJob, fetchJobById } from '@/lib/auth-api';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

export const PostJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    skills: ''
  });

  const loadDrafts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const data = await fetchJobs(token, 'DRAFT');
        setDrafts(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // Check for passed Job ID from navigation (e.g., "Edit" on My Postings)
  useEffect(() => {
    const loadJobToEdit = async () => {
      const jobId = location.state?.jobId;
      if (jobId) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const job = await fetchJobById(token, jobId);
            setEditingId(job._id);
            setFormData({
              title: job.title,
              type: job.type,
              location: job.location,
              salary: job.salary,
              description: job.description,
              requirements: job.requirements,
              skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills
            });
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to load job for editing");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadJobToEdit();
  }, [location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleEdit = (draft: any) => {
    setEditingId(draft._id);
    setFormData({
      title: draft.title,
      type: draft.type,
      location: draft.location,
      salary: draft.salary,
      description: draft.description,
      requirements: draft.requirements,
      skills: Array.isArray(draft.skills) ? draft.skills.join(', ') : draft.skills
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this draft?")) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      await deleteJob(token, id);
      toast.success("Draft deleted");
      loadDrafts();
      if (editingId === id) {
        setEditingId(null);
        setFormData({ title: '', type: '', location: '', salary: '', description: '', requirements: '', skills: '' });
      }
    } catch (err) { toast.error("Failed to delete"); }
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title) return toast.error("Job Title is required");

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No token");

      const payload = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        status
      };

      if (editingId) {
        await updateJob(token, editingId, payload);
        toast.success(status === 'PUBLISHED' ? "Job Published!" : "Job Updated!");
      } else {
        await createJob(token, payload);
        toast.success(status === 'PUBLISHED' ? "Job Published!" : "Draft Saved!");
      }

      if (status === 'PUBLISHED') {
        navigate('/dashboard/employer');
      } else {
        loadDrafts(); // Reload drafts if just saved
        if (!editingId) {
          // Clear form if it was a new draft
          setFormData({ title: '', type: '', location: '', salary: '', description: '', requirements: '', skills: '' });
        }
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            {editingId ? (location.state?.jobId ? 'Edit Job' : 'Edit Draft Job') : 'Post a New Job'}
          </h1>
          <p className="text-muted-foreground">Find the perfect candidate for your team.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-8">
          <div className="space-y-4">
            <h2 className="font-bold text-xl border-b border-border pb-2">Job Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="e.g. Senior Frontend Engineer" value={formData.title} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Employment Type</Label>
                <Select onValueChange={handleSelectChange} value={formData.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Bangalore / Remote" value={formData.location} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input id="salary" placeholder="e.g. ₹15L - ₹25L" value={formData.salary} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-xl border-b border-border pb-2">Description & Requirements</h2>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" placeholder="Describe the role responsibilities..." className="min-h-[150px]" value={formData.description} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Key Requirements</Label>
              <Textarea id="requirements" placeholder="List the required skills and experience..." className="min-h-[150px]" value={formData.requirements} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-xl border-b border-border pb-2">Skills</h2>
            <div className="space-y-2">
              <Label>Required Skills (Comma separated)</Label>
              <Input id="skills" placeholder="React, TypeScript, Node.js" value={formData.skills} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            {editingId && <Button variant="ghost" onClick={() => {
              setEditingId(null);
              setFormData({ title: '', type: '', location: '', salary: '', description: '', requirements: '', skills: '' });
              navigate('/dashboard/employer/post-job', { state: {} }); // Clear state
            }}>Cancel Edit</Button>}
            <Button variant="outline" size="lg" onClick={() => handleSubmit('DRAFT')} disabled={isLoading}>
              {editingId ? 'Update Draft' : 'Save Draft'}
            </Button>
            <Button variant="employer" size="lg" className="gap-2" onClick={() => handleSubmit('PUBLISHED')} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publish Job
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Live Preview + Drafts */}
      <div className="space-y-6">
        {/* Live Preview Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm sticky top-6">
          <div className="px-4 py-3 bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Preview
            </h3>
          </div>
          <div className="p-4">
            <div className="border border-border rounded-xl p-4 bg-background space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">
                    {formData.title || 'Job Title'}
                  </h4>
                  <p className="text-xs text-muted-foreground">Your Company</p>
                </div>
              </div>
              
              {/* Meta */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {formData.location && (
                  <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    📍 {formData.location}
                  </span>
                )}
                {formData.type && (
                  <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    💼 {formData.type}
                  </span>
                )}
                {formData.salary && (
                  <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    💰 {formData.salary}
                  </span>
                )}
              </div>

              {/* Skills Pills */}
              {formData.skills && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.skills.split(',').slice(0, 4).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                  {formData.skills.split(',').length > 4 && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                      +{formData.skills.split(',').length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Description Preview */}
              {formData.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-3">
                  {formData.description}
                </p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              This is how your job will appear to candidates
            </p>
          </div>
        </div>

        {/* Drafts List */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> Your Drafts</h3>
          <div className="space-y-3">
            {drafts.length === 0 && <p className="text-sm text-muted-foreground italic">No drafts saved.</p>}
            {drafts.map((draft) => (
              <div key={draft._id} className={`p-4 rounded-lg border cursor-pointer transition-all ${editingId === draft._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => handleEdit(draft)}>
                <h4 className="font-bold text-sm mb-1">{draft.title || 'Untitled Draft'}</h4>
                <p className="text-xs text-muted-foreground mb-3">Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-muted px-2 py-1 rounded">Edit</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-500/10" onClick={(e) => handleDelete(draft._id, e)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
