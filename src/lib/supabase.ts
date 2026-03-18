import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveConversation(conversation: {
  id: string;
  title: string;
  messages: unknown[];
  model: string;
}) {
  const { data, error } = await supabase
    .from("conversations")
    .upsert({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages,
      model: conversation.model,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export async function saveProjectState(projectId: string, state: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("project_states")
    .upsert({
      id: projectId,
      state,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadProjectState(projectId: string) {
  const { data, error } = await supabase
    .from("project_states")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.state || null;
}
