import { supabase } from '../supabaseClient';

export const StorageService = {
  // Faz o upload e retorna a URL pública
  async uploadArquivo(file: File, categoria: string): Promise<string | null> {
    try {
      // Gera nome único para evitar sobrescrita: "manual-170999999.pdf"
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoria.toLowerCase()}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Envia para o bucket 'arquivos_tecnicos'
      const { error: uploadError } = await supabase.storage
        .from('arquivos_tecnicos') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pega a URL pública
      const { data } = supabase.storage
        .from('arquivos_tecnicos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Falha ao enviar arquivo para nuvem. Verifique sua conexão.');
      return null;
    }
  },

  // Deleta o arquivo da nuvem para economizar espaço
  async deleteArquivo(url: string) {
      if (!url) return;
      // Extrai o nome do arquivo da URL completa
      const path = url.split('/').pop(); 
      if(!path) return;
      
      const { error } = await supabase.storage
        .from('arquivos_tecnicos')
        .remove([path]);
        
      if (error) console.error("Erro ao deletar do storage:", error);
  }
};