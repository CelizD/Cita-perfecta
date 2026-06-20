// H-005: re-exporta el servicio canónico para eliminar la clase duplicada.
// Los servicios del core reciben el mismo singleton que usan las páginas.
export { SupabaseService } from '../../services/supabase.service';
