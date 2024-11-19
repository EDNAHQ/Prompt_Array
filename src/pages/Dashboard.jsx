import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import QuickAccessGroups from '@/components/dashboard/QuickAccessGroups';
import PromptsList from '@/components/dashboard/PromptsList';
import CreatePromptSheet from '@/components/CreatePromptSheet';
import CreateGroupSheet from '@/components/CreateGroupSheet';

const Dashboard = () => {
  const [isCreatePromptOpen, setIsCreatePromptOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <CreateGroupSheet
            trigger={
              <Button
                variant="outline"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            }
          />
          <Button
            onClick={() => setIsCreatePromptOpen(true)}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Access Groups</h2>
        <QuickAccessGroups groups={[]} />
      </section>

      <PromptsList onPromptClick={setSelectedPrompt} />

      <CreatePromptSheet
        isOpen={isCreatePromptOpen}
        onOpenChange={setIsCreatePromptOpen}
        initialData={selectedPrompt}
      />
    </div>
  );
};

export default Dashboard;