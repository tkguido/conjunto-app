'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DownloadCloud } from 'lucide-react';

export default function ExportButton({ posts, campaignName }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const approvedPosts = posts.filter(p => p.status_cliente === 'Aprovado');
      
      if (approvedPosts.length === 0) {
        alert('Não há posts aprovados pelo cliente para exportar nesta quinzena.');
        setIsExporting(false);
        return;
      }

      const zip = new JSZip();
      let legendasTxt = `=== LEGENDAS APROVADAS - ${campaignName || 'Quinzena'} ===\n\n`;

      for (let i = 0; i < approvedPosts.length; i++) {
        const post = approvedPosts[i];
        const dateStr = post.data_publicacao.replace(/-/g, '');
        const filePrefix = `${dateStr}_${post.formato.replace(/\s+/g, '')}`;
        
        // Add to text file
        legendasTxt += `--------------------------------------\n`;
        legendasTxt += `DATA: ${post.dia_semana}, ${post.data_publicacao} às ${post.horario_agendamento}\n`;
        legendasTxt += `FORMATO: ${post.formato}\n`;
        legendasTxt += `REFERÊNCIA DO ARQUIVO: ${filePrefix}.png\n\n`;
        legendasTxt += `[LEGENDA]\n${post.texto_instagram}\n\n`;
        if (post.texto_facebook && post.texto_facebook !== post.texto_instagram) {
          legendasTxt += `[FACEBOOK]\n${post.texto_facebook}\n\n`;
        }
        legendasTxt += `[ACESSIBILIDADE]\n${post.acessibilidade_para_todos_verem}\n`;
        legendasTxt += `--------------------------------------\n\n`;

        // Fetch image and add to zip
        if (post.arte_final) {
          try {
            const response = await fetch(post.arte_final);
            const blob = await response.blob();
            // extract extension, usually png
            const extension = post.arte_final.split('.').pop().split('?')[0] || 'png';
            zip.file(`imagens/${filePrefix}.${extension}`, blob);
          } catch (e) {
            console.error('Failed to fetch image for post', post.id, e);
          }
        }
      }

      zip.file('legendas_aprovadas.txt', legendasTxt);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Pacote_${campaignName ? campaignName.replace(/\s+/g, '_') : 'Campanha'}.zip`);
      
    } catch (err) {
      console.error('Erro na exportação:', err);
      alert('Ocorreu um erro ao gerar o arquivo ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  const approvedCount = posts.filter(p => p.status_cliente === 'Aprovado').length;

  return (
    <button 
      onClick={handleExport} 
      className="btn btn-success" 
      disabled={isExporting || approvedCount === 0}
      title={approvedCount === 0 ? "Nenhum post aprovado ainda" : `Baixar ${approvedCount} post(s) aprovado(s)`}
    >
      <DownloadCloud size={18} />
      {isExporting ? 'Compactando...' : 'Exportar Lote Aprovado (ZIP)'}
    </button>
  );
}
