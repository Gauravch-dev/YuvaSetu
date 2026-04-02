import { Plus, Trash2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';

export const Certifications = () => {
    const { data, updateStepData } = useOnboarding();
    const { certifications } = data;

    const addCertification = () => {
        updateStepData('certifications', [
            ...certifications,
            {
                id: crypto.randomUUID(),
                title: '',
                issuer: '',
                year: ''
            }
        ]);
    };

    const removeCertification = (id: string) => {
        updateStepData('certifications', certifications.filter(c => c.id !== id));
    };

    const updateEntry = (id: string, field: string, value: string) => {
        updateStepData('certifications', certifications.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {certifications.map((cert, index) => (
                <div key={cert.id} className="relative p-6 bg-card/50 rounded-xl border border-border space-y-4">
                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 font-bold border border-amber-500/20">
                        {index + 1}
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold">Certification / Achievement</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCertification(cert.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Title / Name *</Label>
                            <Input
                                value={cert.title}
                                onChange={(e) => updateEntry(cert.id, 'title', e.target.value)}
                                placeholder="Ex. AWS Certified DevOps Professional"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                                value={cert.year || ''}
                                onChange={(e) => updateEntry(cert.id, 'year', e.target.value)}
                                placeholder="Ex. 2025"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label>Issuing Organization *</Label>
                            <Input
                                value={cert.issuer}
                                onChange={(e) => updateEntry(cert.id, 'issuer', e.target.value)}
                                placeholder="Ex. Amazon Web Services, Google, Smart India Hackathon"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addCertification}
                className="w-full h-12 border-dashed border-2 hover:border-amber-500 hover:text-amber-500 gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Certification / Achievement
            </Button>
        </div>
    );
};
