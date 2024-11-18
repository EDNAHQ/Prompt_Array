import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PromptTeamAndGroupFields = ({ newPrompt, setNewPrompt }) => {
  // Mock data with proper UUID formats
  const teams = [
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Marketing Team' },
    { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Content Team' },
    { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Development Team' }
  ];

  const groups = [
    { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Blog Writing' },
    { id: '123e4567-e89b-12d3-a456-426614174004', name: 'Social Media' },
    { id: '123e4567-e89b-12d3-a456-426614174005', name: 'Email Marketing' },
    { id: '123e4567-e89b-12d3-a456-426614174006', name: 'SEO Content' }
  ];

  return (
    <>
      <div className="flex items-center justify-between space-x-2">
        <label htmlFor="public" className="text-sm font-medium">
          Make Public
        </label>
        <Switch
          id="public"
          checked={newPrompt.isPublic}
          onCheckedChange={(checked) => setNewPrompt(prev => ({ ...prev, isPublic: checked }))}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="team" className="text-sm font-medium">
          Add to Team
        </label>
        <Select
          value={newPrompt.teamId}
          onValueChange={(value) => setNewPrompt(prev => ({ ...prev, teamId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="group" className="text-sm font-medium">
          Add to Group
        </label>
        <Select
          value={newPrompt.groupId}
          onValueChange={(value) => setNewPrompt(prev => ({ ...prev, groupId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default PromptTeamAndGroupFields;