import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { queryClient } from '@/lib/react-query';

export const createPrompt = async (promptData) => {
  console.log('Creating prompt with data:', promptData);

  if (!promptData.title || !promptData.content) {
    toast.error('Title and content are required');
    throw new Error('Title and content are required');
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      toast.error('Please sign in to create prompts');
      throw new Error('Authentication required');
    }

    // Prepare the prompt data according to the database schema
    const promptInsertData = {
      title: promptData.title,
      content: promptData.content,
      description: promptData.description || null,
      tags: promptData.tags || [],
      is_public: promptData.isPublic || false,
      version: 1,
      user_id: user.id,
      team_id: promptData.teamId || null,
      group_id: promptData.groupId || null,
      change_description: promptData.changeDescription || null
    };

    console.log('Attempting to insert prompt with data:', promptInsertData);

    const { data, error } = await supabase
      .from('prompts')
      .insert([promptInsertData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      toast.error(`Failed to create prompt: ${error.message}`);
      throw error;
    }

    if (!data || data.length === 0) {
      const noDataError = 'No data returned from Supabase';
      console.error(noDataError);
      toast.error(noDataError);
      throw new Error(noDataError);
    }

    // Create initial version
    await createPromptVersion(data[0].id, {
      ...promptData,
      changeDescription: 'Initial version'
    });

    // Invalidate both prompts and group-prompts queries
    queryClient.invalidateQueries({ queryKey: ['prompts'] });
    if (promptData.groupId) {
      queryClient.invalidateQueries({ queryKey: ['group-prompts', promptData.groupId] });
    }
    
    toast.success('Prompt created successfully!');
    return data[0];
  } catch (error) {
    console.error('Error in createPrompt:', error);
    toast.error(`Failed to create prompt: ${error.message}`);
    throw error;
  }
};

export const getPrompt = async (promptId) => {
  if (!promptId) {
    toast.error('Prompt ID is required');
    throw new Error('Prompt ID is required');
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      toast.error('Please sign in to view prompts');
      throw new Error('Authentication required');
    }

    // Fetch prompt and latest version in a single query
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        content,
        description,
        tags,
        is_public,
        version,
        user_id,
        group_id,
        created_at,
        updated_at,
        (
          SELECT COUNT(*)
          FROM prompt_versions
          WHERE prompt_id = prompts.id
        ) as version_count
      `)
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      toast.error(`Failed to fetch prompt: ${error.message}`);
      throw error;
    }

    if (!data) {
      toast.error('Prompt not found or you do not have access');
      throw new Error('Prompt not found or access denied');
    }

    return {
      ...data,
      versionCount: parseInt(data.version_count) || 0
    };

  } catch (error) {
    console.error('Error in getPrompt:', error);
    throw error;
  }
};

export const getPromptVersionInfo = async (promptId) => {
  try {
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching version info:', error);
      return { version: 1, versionCount: 0 };
    }

    return {
      version: data[0]?.version_number || 1,
      versionCount: data?.length || 0
    };
  } catch (error) {
    console.error('Error in getPromptVersionInfo:', error);
    return { version: 1, versionCount: 0 };
  }
};

export const getPromptVersions = async (promptId, { limit = 5, offset = 0 } = {}) => {
  const { data: versions, error } = await supabase
    .from('prompt_versions')  
    .select('*')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching versions:', error);
    throw error;
  }

  return {
    versions,
    hasMore: versions.length === limit
  };
};

export const getPromptVersionDetails = async (versionId) => {
  const { data, error } = await supabase
    .from('prompt_version_details_mv')  
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) {
    console.error('Error fetching version details:', error);
    throw error;
  }

  return data;
};

export const createPromptVersion = async (promptId, versionData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Get the latest version number for this prompt
    const { data: versions, error: versionsError } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versionsError) {
      console.error('Error getting latest version:', versionsError);
      throw versionsError;
    }

    // Calculate next version number
    const nextVersionNumber = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const versionInsertData = {
      prompt_id: promptId,
      version_number: nextVersionNumber,
      title: versionData.title,
      content: versionData.content,
      tags: versionData.tags || [],
      is_public: versionData.isPublic || false,
      change_description: versionData.changeDescription || null,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('prompt_versions')
      .insert(versionInsertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt version:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createPromptVersion:', error);
    throw error;
  }
};

export const updatePrompt = async (promptId, promptData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // First, get the current prompt data
    const { data: currentPrompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (promptError) {
      console.error('Error fetching current prompt:', promptError);
      throw promptError;
    }

    // Get the latest version number
    const { data: versions, error: versionsError } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versionsError) {
      console.error('Error getting latest version:', versionsError);
      throw versionsError;
    }

    const nextVersionNumber = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    // Create a version of the current prompt before updating
    const versionData = {
      prompt_id: promptId,
      version_number: nextVersionNumber,
      title: currentPrompt.title,
      content: currentPrompt.content,
      tags: currentPrompt.tags || [],
      is_public: currentPrompt.is_public,
      change_description: promptData.changeDescription || 'Updated prompt',
      created_by: user.id
    };

    // Create the version entry
    const { error: versionError } = await supabase
      .from('prompt_versions')
      .insert(versionData);

    if (versionError) {
      console.error('Error creating version:', versionError);
      throw versionError;
    }

    // First, delete the old prompt
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId);

    if (deleteError) {
      console.error('Error deleting old prompt:', deleteError);
      throw deleteError;
    }

    // Now create a new prompt with the updated data
    const promptUpdateData = {
      id: promptId, // Keep the same ID
      title: promptData.title,
      content: promptData.content,
      description: promptData.description || null,
      tags: promptData.tags || [],
      is_public: promptData.isPublic || false,
      team_id: promptData.teamId || null,
      group_id: promptData.groupId || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the new prompt with the same ID
    const { data: updatedPrompt, error: insertError } = await supabase
      .from('prompts')
      .insert(promptUpdateData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new prompt:', insertError);
      throw insertError;
    }

    // Invalidate both prompts and group-prompts queries
    queryClient.invalidateQueries({ queryKey: ['prompts'] });
    if (promptData.groupId) {
      queryClient.invalidateQueries({ queryKey: ['group-prompts', promptData.groupId] });
    }

    // Invalidate queries to refresh the UI
    queryClient.invalidateQueries({ queryKey: ['promptVersions', promptId] });

    return updatedPrompt;
  } catch (error) {
    console.error('Error in updatePrompt:', error);
    throw error;
  }
};

export const deletePrompt = async (promptId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Get the prompt first to know its group_id
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('group_id')
      .eq('id', promptId)
      .single();

    if (promptError) {
      console.error('Error fetching prompt:', promptError);
      throw promptError;
    }

    // Delete the prompt and its versions (cascade delete should handle versions)
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }

    // Invalidate both prompts and group-prompts queries
    queryClient.invalidateQueries({ queryKey: ['prompts'] });
    if (prompt?.group_id) {
      queryClient.invalidateQueries({ queryKey: ['group-prompts', prompt.group_id] });
    }
    toast.success('Prompt deleted successfully');

  } catch (error) {
    console.error('Error in deletePrompt:', error);
    toast.error(`Failed to delete prompt: ${error.message}`);
    throw error;
  }
};

export const getTemplates = async () => {
  try {
    console.log('Fetching templates...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Authentication required');
    }

    console.log('User authenticated, querying templates...');
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_template', true)
      .order('template_category', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    console.log(`Successfully fetched ${data?.length || 0} templates`);
    if (data?.length > 0) {
      console.log('Template categories:', [...new Set(data.map(t => t.template_category || 'Uncategorized'))]);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTemplates:', error);
    toast.error('Failed to fetch templates');
    throw error;
  }
};

export const createTemplate = async (templateData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const templateInsertData = {
      ...templateData,
      is_template: true,
      user_id: user.id,
      is_public: true // Templates are always public
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert([templateInsertData])
      .select();

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    toast.success('Template created successfully!');
    return data[0];
  } catch (error) {
    console.error('Error creating template:', error);
    toast.error('Failed to create template');
    throw error;
  }
};

export const useTemplateAsPrompt = async (templateId) => {
  try {
    const template = await getPrompt(templateId);
    if (!template) throw new Error('Template not found');

    // Create a new prompt based on the template
    const promptData = {
      title: template.title,
      content: template.content,
      description: template.description,
      tags: template.tags,
      is_public: false,
      is_template: false
    };

    return await createPrompt(promptData);
  } catch (error) {
    console.error('Error using template:', error);
    toast.error('Failed to use template');
    throw error;
  }
};