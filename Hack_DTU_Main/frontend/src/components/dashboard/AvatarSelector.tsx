import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Check } from 'lucide-react';

interface AvatarSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    currentName?: string;
}

const STYLES = [
    { id: 'avataaars', name: 'People' },
    { id: 'bottts', name: 'Robots' },
    { id: 'initials', name: 'Initials' },
    { id: 'micah', name: 'Sketch' },
    { id: 'lorelei', name: 'Fun' },
];

export const AvatarSelector = ({ open, onClose, onSelect, currentName = 'User' }: AvatarSelectorProps) => {
    const [selectedStyle, setSelectedStyle] = useState('avataaars');
    const [selectedSeed, setSelectedSeed] = useState<string | null>(null);

    // Generate 12 variations
    const seeds = Array.from({ length: 12 }, (_, i) => `${currentName.replace(' ', '')}${i}`);

    const handleSelect = (seed: string) => {
        const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
        onSelect(url);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Choose your Avatar</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="avataaars" value={selectedStyle} onValueChange={setSelectedStyle} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4">
                        {STYLES.map(style => (
                            <TabsTrigger key={style.id} value={style.id} className="text-xs">
                                {style.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <ScrollArea className="h-[300px] w-full p-2">
                        <div className="grid grid-cols-3 gap-4">
                            {seeds.map((seed) => {
                                const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
                                return (
                                    <button
                                        key={seed}
                                        onClick={() => handleSelect(seed)}
                                        className="relative group aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all p-2 bg-muted/30 hover:bg-muted/50"
                                    >
                                        <img
                                            src={url}
                                            alt="Avatar"
                                            className="w-full h-full object-contain"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
