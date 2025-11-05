import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TrustedSource = Database['public']['Tables']['trusted_sources']['Row'];
type TrustedSourceInsert = Database['public']['Tables']['trusted_sources']['Insert'];

export const sourcesService = {
  async getAllSources(): Promise<TrustedSource[]> {
    const { data, error } = await supabase
      .from('trusted_sources')
      .select('*')
      .order('reliability_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveSources(): Promise<TrustedSource[]> {
    const { data, error } = await supabase
      .from('trusted_sources')
      .select('*')
      .eq('is_active', true)
      .order('reliability_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSourcesByCategory(category: string): Promise<TrustedSource[]> {
    const { data, error } = await supabase
      .from('trusted_sources')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('reliability_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addSource(source: TrustedSourceInsert): Promise<TrustedSource> {
    const { data, error } = await supabase
      .from('trusted_sources')
      .insert(source)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSource(id: string, updates: Partial<TrustedSourceInsert>): Promise<TrustedSource> {
    const { data, error } = await supabase
      .from('trusted_sources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleSourceActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('trusted_sources')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getSourceStats() {
    const { data, error } = await supabase
      .from('trusted_sources')
      .select('category, is_active')
      .eq('is_active', true);

    if (error) throw error;

    const stats = {
      total: data.length,
      byCategory: data.reduce((acc, source) => {
        acc[source.category] = (acc[source.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }
};
