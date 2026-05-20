'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ClientView() {
  const params = useParams();
  const [posts, setPosts] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [client, setClient] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [params.campanha_id]);

  const fetchPosts = async () => {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      
      const foundCampaign = data.campaigns.find(c => c.id === params.campanha_id);
      setCampaign(foundCampaign);
      
      if (foundCampaign) {
        const foundClient = data.clients.find(c => c.id === foundCampaign.client_id);
        setClient(foundClient);
      }

      // FILTRO DE SEGURANÇA E CAMPANHA
      const visiblePosts = data.posts.filter(p => 
        p.campanha_id === params.campanha_id &&
        (
          ['Aprovado Interno', 'Aprovado', 'Alteração Solicitada'].includes(p.status_interno) || 
          ['Pendente', 'Aprovado', 'Alteração Solicitada'].includes(p.status_cliente)
        )
      );
      setPosts(visiblePosts);
    }
  };

  const handleApprove = async (post) => {
    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_cliente: 'Aprovado' })
    });
    fetchPosts();
  };

  const handleRequestChange = async (post) => {
    if (!feedback.trim()) {
      alert("Por favor, digite o que precisa ser alterado.");
      return;
    }

    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status_cliente: 'Alteração Solicitada',
        status_interno: 'Ajustar Interno',
        obs_cliente: feedback 
      })
    });
    
    setFeedback('');
    setActivePost(null);
    fetchPosts();
  };

  if (posts.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h2>Ainda não há conteúdos para aprovação.</h2>
        <p className="text-muted mt-2">A agência está preparando o seu cronograma.</p>
        <Link href="/" className="btn btn-outline mt-4">Voltar para a Agência</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff0f5', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header Cliente */}
      <div style={{ backgroundColor: 'white', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-4">
            {client && campaign && (
              <>
                <img src={client.logo} alt={client.nome} style={{ height: '40px', borderRadius: '8px' }} />
                <div>
                  <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--primary-dark)' }}>Aprovação de Conteúdo</h1>
                  <p className="text-sm text-muted" style={{ margin: 0 }}>{campaign.periodo}</p>
                </div>
              </>
            )}
          </div>
          <Link href="/" className="text-sm text-muted hover:underline">Acesso Agência</Link>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        {posts.map(post => (
          <div key={post.id} style={{ 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            boxShadow: '0 10px 25px rgba(255,105,180,0.1)', 
            overflow: 'hidden',
            marginBottom: '3rem',
            border: post.status_cliente === 'Aprovado' ? '2px solid var(--success)' : 'none'
          }}>
            {/* Cabecalho Post */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{post.dia_semana}, {post.data_publicacao}</h2>
                <p className="text-sm text-muted" style={{ margin: 0 }}>{post.horario_agendamento}</p>
              </div>
              <div className="flex gap-2">
                {post.formato.includes('Instagram') && <span style={{ background: '#fdf2f8', color: '#db2777', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Instagram</span>}
                {post.formato.includes('Facebook') && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Facebook</span>}
              </div>
            </div>

            {/* Conteudo Post */}
            <div className="grid grid-cols-2" style={{ gap: 0 }}>
              {/* Imagem (Simulada) */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem',
                borderRight: '1px solid #f1f5f9'
              }}>
                <img 
                  src={post.arte_final || post.foto_produto_crua} 
                  alt="Post preview" 
                  style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                />
              </div>

              {/* Textos */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: '#334155' }}>
                    {post.texto_instagram}
                  </p>
                  
                  <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <p className="text-xs font-bold text-muted mb-1">Acessibilidade</p>
                    <p className="text-xs text-muted">{post.acessibilidade_para_todos_verem}</p>
                  </div>
                </div>

                {/* Área de Aprovação */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                  {post.status_cliente === 'Aprovado' ? (
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--success)', fontWeight: 'bold', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                      <CheckCircle size={24} />
                      POST APROVADO
                    </div>
                  ) : post.status_cliente === 'Alteração Solicitada' ? (
                    <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '12px', color: '#b45309' }}>
                      <div className="flex items-center gap-2 font-bold mb-2">
                        <AlertCircle size={20} />
                        Alteração Solicitada
                      </div>
                      <p className="text-sm">"{post.obs_cliente}"</p>
                      <p className="text-xs mt-2 opacity-70">A agência está trabalhando nestes ajustes.</p>
                    </div>
                  ) : (
                    <>
                      {activePost === post.id ? (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          <textarea 
                            className="form-textarea mb-2" 
                            rows="3" 
                            placeholder="O que você gostaria de mudar? (Ex: Trocar a cor de fundo, mudar a legenda...)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            autoFocus
                          ></textarea>
                          <div className="flex gap-2">
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActivePost(null)}>Cancelar</button>
                            <button className="btn btn-warning" style={{ flex: 1 }} onClick={() => handleRequestChange(post)}>
                              <Send size={16} /> Enviar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success" 
                            style={{ flex: 1, padding: '1rem' }}
                            onClick={() => handleApprove(post)}
                          >
                            <CheckCircle size={20} /> APROVAR
                          </button>
                          <button 
                            className="btn btn-warning" 
                            style={{ flex: 1, padding: '1rem', backgroundColor: '#fff', color: 'var(--warning)', border: '2px solid var(--warning)' }}
                            onClick={() => setActivePost(post.id)}
                          >
                            <AlertCircle size={20} /> ALTERAÇÃO
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
