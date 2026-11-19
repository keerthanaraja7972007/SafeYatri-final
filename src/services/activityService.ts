import { supabase } from '@/lib/supabase';

export type ActivityType = 'logout' | 'tourist_place_viewed' | 'risk_assessment_viewed' | 'emergency_search';

export async function recordActivity(eventType: ActivityType, resourceId?: string) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from('activity_logs').insert({ user_id: data.user.id, event_type: eventType, resource_id: resourceId ?? null });
}
