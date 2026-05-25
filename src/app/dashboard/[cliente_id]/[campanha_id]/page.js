'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Sparkles, Image as ImageIcon, FileText, Calendar as CalendarIcon, List, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ExportButton from '../../../../components/ExportButton';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgencyView() {
  const params = useParams();
  const [posts, setPosts] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    data_publicacao: '',
    dia_semana: 'Segunda-feira',
    formato: 'Feed 4:5',
    horario_agendamento: '12:00',
    foto_produto_crua: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingTextsId, setEditingTextsId] = useState(null);
  const [tempTexts, setTempTexts] = useState({ texto_instagram: '', acessibilidade_para_todos_verem: '' });
  useEffect(() => {
    fetchPosts();
  }, [params.campanha_id, params.cliente_id]);

  const fetchPosts = () => {
    fetch('/api/data', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const foundCampaign = data.campaigns.find(c => c.id === params.campanha_id);
        const foundClient = data.clients.find(c => c.id === params.cliente_id);
        
        if (foundCampaign) setCampaign(foundCampaign);
        if (foundClient) setClient(foundClient);
        
        const filteredPosts = data.posts.filter(p => p.campanha_id === params.campanha_id);
        filteredPosts.sort((a, b) => {
          const dateA = new Date(a.data_publicacao + 'T' + (a.horario_agendamento || '00:00'));
          const dateB = new Date(b.data_publicacao + 'T' + (b.horario_agendamento || '00:00'));
          return dateA - dateB;
        });
        setPosts(filteredPosts);
      });
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostData.data_publicacao || !newPostData.formato) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPostData, campanha_id: params.campanha_id })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewPostData({ data_publicacao: '', dia_semana: 'Segunda-feira', formato: 'Feed 4:5', horario_agendamento: '12:00', foto_produto_crua: '' });
        fetchPosts();
      } else {
        const errorData = await res.json();
        console.error("Failed to create post:", errorData);
        alert(`Erro ao criar post: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Erro de conexão ao tentar criar o post.");
    }
    setIsCreating(false);
  };

  const handleGenerateAI = async (post) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing: post.orientacoes_briefing,
          rede: post.formato,
          produto: post.referencia_produto,
          persona: client?.persona || 'Tom de voz genérico e comercial.'
        })
      });

      const data = await res.json();
      
      if (res.status !== 200) {
        alert(data.error || 'Erro ao gerar textos.');
        setLoading(false);
        return;
      }
      
      // Update post locally and on server
      const updates = {
        texto_instagram: data.texto_instagram,
        texto_facebook: data.texto_facebook,
        acessibilidade_para_todos_verem: data.acessibilidade,
        direcionamento_designer: data.direcionamento,
        status_interno: 'Para Revisão Interna'
      };

      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      fetchPosts();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleGenerateArt = async (post) => {
    if (!post.foto_produto_crua) {
      alert("Faça o upload do PNG do produto primeiro!");
      return;
    }

    setLoading(true);
    
    try {
      // Tenta acionar a API do Nano Banana primeiro
      const nanoBananaRes = await fetch('/api/generate-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          prompt: post.direcionamento_designer || "Gerar arte premium para produto",
          image_url: post.foto_produto_crua,
          formato: post.formato
        })
      });
      
      const nanoBananaData = await nanoBananaRes.json();

      if (nanoBananaData.success) {
        // Nano Banana gerou com sucesso
        fetchPosts();
        setLoading(false);
        return;
      } else if (nanoBananaData.message !== 'NANO_BANANA_NOT_CONFIGURED') {
        throw new Error(nanoBananaData.error || "Falha na API");
      }

      // FALLBACK: Como não temos a API Key do Nano Banana, vamos usar o Canvas e IA de Background Local
      const aiRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direcionamento: post.direcionamento_designer || 'Fundo com texturas em tons pastéis e recortes.' })
      });

      let bgSrc = '/3d_scenarios/3d_pink_1.png'; // Fundo padrão de segurança
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        if (aiData.image) bgSrc = aiData.image;
      }

      const isStory = post.formato.toLowerCase().includes('stories') || post.formato.toLowerCase().includes('story');
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = isStory ? 1920 : 1350;
      const ctx = canvas.getContext('2d');

      const bgImg = new window.Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = bgSrc;
      await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; });
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const shoeImg = new window.Image();
      shoeImg.crossOrigin = "anonymous";
      shoeImg.src = post.foto_produto_crua;
      await new Promise((resolve) => { shoeImg.onload = resolve; shoeImg.onerror = resolve; });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(canvas.width/2, canvas.height/2 + 250, 250, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      const scale = isStory ? 0.9 : 0.8;
      const aspect = shoeImg.width / shoeImg.height;
      const drawWidth = canvas.width * scale;
      const drawHeight = drawWidth / aspect;
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2 + (isStory ? 100 : 50);
      
      ctx.drawImage(shoeImg, x, y, drawWidth, drawHeight);

      const arteFinalBase64 = canvas.toDataURL('image/jpeg', 0.90);

      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arte_final: arteFinalBase64 })
      });
      
      fetchPosts();
    } catch (error) {
      alert("Erro ao gerar arte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInternal = async (post) => {
    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_interno: 'Aprovado Interno', status_cliente: 'Pendente' })
    });
    fetchPosts();
  };

  const getBadgeClass = (status_interno, status_cliente) => {
    if (status_cliente === 'Aprovado') return 'bg-green-100 text-green-800 border-green-200';
    if (status_cliente === 'Alteração Solicitada') return 'bg-orange-100 text-orange-800 border-orange-200';
    
    switch(status_interno) {
      case 'Em Criação': return 'badge-draft';
      case 'Para Revisão Interna': return 'badge-review';
      case 'Aprovado Interno': return 'badge-approved-internal';
      default: return 'badge-draft';
    }
  };

  const getStatusText = (post) => {
    if (post.status_cliente === 'Aprovado') return 'Aprovado pelo Cliente ✓';
    if (post.status_cliente === 'Alteração Solicitada') return 'Alteração Solicitada ⚠';
    return post.status_interno;
  };

  const renderCalendar = () => {
    if (posts.length === 0) return null;
    
    // Pega a data do primeiro post para descobrir o mês
    const firstDate = parseISO(posts[0].data_publicacao);
    const start = startOfMonth(firstDate);
    const end = endOfMonth(firstDate);
    const days = eachDayOfInterval({ start, end });
    
    // Dias da semana para o cabeçalho
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Descobre em qual dia da semana o mês começa (0 = Domingo)
    const startDayIndex = getDay(start);

    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
          {format(start, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {weekDays.map(wd => <div key={wd} style={{ fontWeight: 'bold', color: '#64748b', fontSize: '0.875rem' }}>{wd}</div>)}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Células vazias antes do dia 1 */}
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} style={{ minHeight: '100px', backgroundColor: '#f8fafc', borderRadius: '8px' }}></div>)}
          
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPosts = posts.filter(p => p.data_publicacao === dateStr);
            
            return (
              <div key={dateStr} style={{ minHeight: '120px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', backgroundColor: dayPosts.length > 0 ? '#f0f9ff' : 'white' }}>
                <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>{format(day, 'd')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {dayPosts.map(p => (
                    <div key={p.id} style={{ fontSize: '0.7rem', padding: '4px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => setViewMode('list')} title={p.status_interno}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.formato.split(' ')[1] || p.formato}</div>
                      <div style={{ color: p.status_cliente === 'Aprovado' ? 'green' : (p.status_cliente === 'Alteração Solicitada' ? 'orange' : '#64748b') }}>
                        {p.status_cliente === 'Aprovado' ? '✓ Aprovado' : (p.status_cliente === 'Alteração Solicitada' ? '⚠ Alteração' : 'Em prod')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <Link href={`/dashboard/${client?.id}`} className="text-sm text-muted mb-2 inline-block hover:underline">← Voltar para {client?.nome}</Link>
          <div className="flex-mobile-col" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {client && <img src={client.logo} alt={client.nome} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ marginBottom: 0 }}>Painel de Conteúdo</h1>
              {campaign && <p className="text-muted text-sm">{campaign.periodo}</p>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href={`/cliente/${campaign?.id}`} className="btn btn-outline" target="_blank">
              Ver Tela do Cliente ↗
            </Link>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Novo Post
            </button>
          </div>
          {posts && campaign && <ExportButton posts={posts} campaignName={campaign.periodo} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('list')} style={{ flex: 1, justifyContent: 'center' }}>
          <List size={18} /> Ver em Lista
        </button>
        <button className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('calendar')} style={{ flex: 1, justifyContent: 'center' }}>
          <CalendarIcon size={18} /> Ver Calendário
        </button>
      </div>

      {viewMode === 'calendar' ? renderCalendar() : (
        <div className="grid">
          {posts.map(post => {
          const isStory = post.formato.toLowerCase().includes('stories') || post.formato.toLowerCase().includes('story');
          return (
          <div key={post.id} className="card" style={{ border: post.status_cliente === 'Alteração Solicitada' ? '2px solid #fdba74' : '' }}>
            <div className="flex justify-between items-center mb-4 flex-mobile-col gap-2">
              <div>
                <h3 className="font-bold">{post.dia_semana}, {post.data_publicacao}</h3>
                <span className="text-sm text-muted">{post.formato} • {post.horario_agendamento}</span>
              </div>
              <span className={`badge ${getBadgeClass(post.status_interno, post.status_cliente)}`}>
                {getStatusText(post)}
              </span>
            </div>
            {post.status_cliente === 'Alteração Solicitada' && post.obs_cliente && (
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, color: '#9a3412', fontSize: '0.875rem' }}><strong>Observação do Cliente:</strong> {post.obs_cliente}</p>
              </div>
            )}

            <div className="grid grid-cols-2">
              <div>
                <div className="form-group">
                  <label className="form-label">Foto do Produto (PNG)</label>
                  {post.foto_produto_crua && !post.foto_produto_crua.includes('placeholder') ? (
                    <div className="mt-2 flex flex-col items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <img src={post.foto_produto_crua} alt="Preview Produto" style={{ height: '80px', borderRadius: '4px', objectFit: 'contain' }} />
                      <button 
                        onClick={async () => {
                          if(window.confirm("Deseja remover esta imagem para subir outra?")) {
                            await fetch(`/api/posts/${post.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ foto_produto_crua: "" })
                            });
                            fetchPosts();
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium"
                      >
                        <X size={14} /> Remover Produto
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="file" 
                      accept="image/*"
                      className="form-input" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = reader.result;
                            await fetch(`/api/posts/${post.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ foto_produto_crua: base64String })
                            });
                            fetchPosts();
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  )}
                </div>

                <div className="form-group mt-4">
                  <label className="form-label">Referência Visual para Card (Opcional)</label>
                  {post.referencia_arte ? (
                    <div className="mt-2 flex flex-col items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <img src={post.referencia_arte} alt="Preview Referência" style={{ height: '80px', borderRadius: '4px', objectFit: 'contain' }} />
                      <button 
                        onClick={async () => {
                          if(window.confirm("Deseja remover esta referência?")) {
                            await fetch(`/api/posts/${post.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ referencia_arte: "" })
                            });
                            fetchPosts();
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium"
                      >
                        <X size={14} /> Remover Referência
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="file" 
                      accept="image/*"
                      className="form-input" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = reader.result;
                            await fetch(`/api/posts/${post.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ referencia_arte: base64String })
                            });
                            fetchPosts();
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  )}
                </div>

                <div className="form-group mt-4">
                  <label className="form-label">Ref do Produto</label>
                  <input type="text" className="form-input" defaultValue={post.referencia_produto} />
                </div>
                
                <div className="form-group mt-4">
                  <label className="form-label">Briefing para Head</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    defaultValue={post.orientacoes_briefing}
                    onBlur={async (e) => {
                      await fetch(`/api/posts/${post.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orientacoes_briefing: e.target.value })
                      });
                    }}
                  ></textarea>
                </div>

                <div className="form-group mt-4">
                  <label className="form-label">Briefing para Card</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    defaultValue={post.direcionamento_designer}
                    placeholder="Digite o prompt para o Nano Banana gerar a arte..."
                    onBlur={async (e) => {
                      await fetch(`/api/posts/${post.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ direcionamento_designer: e.target.value })
                      });
                    }}
                  ></textarea>
                </div>
                
                <div className="flex gap-2 mt-6 flex-wrap">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleGenerateAI(post)}
                    disabled={loading || post.status_interno === 'Aprovado Interno'}
                  >
                    <Sparkles size={16} />
                    {loading ? 'Gerando...' : 'Gerar Textos (IA)'}
                  </button>

                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleGenerateArt(post)}
                    disabled={post.status_interno === 'Aprovado Interno'}
                  >
                    <ImageIcon size={16} />
                    Gerar Arte Final
                  </button>
                  
                  {post.status_interno === 'Para Revisão Interna' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handleApproveInternal(post)}
                    >
                      <Check size={16} />
                      Aprovar e Liberar p/ Cliente
                    </button>
                  )}
                </div>
              </div>

              <div>
                {post.texto_instagram ? (
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 relative">
                    {editingTextsId === post.id ? (
                      <div className="mb-4 flex justify-end gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingTextsId(null)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          await fetch(`/api/posts/${post.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(tempTexts)
                          });
                          setEditingTextsId(null);
                          fetchPosts();
                        }}>Salvar</button>
                      </div>
                    ) : (
                      <div className="mb-4 flex justify-end">
                        <button className="btn btn-outline btn-sm" onClick={() => {
                          setEditingTextsId(post.id);
                          setTempTexts({ 
                            texto_instagram: post.texto_instagram, 
                            acessibilidade_para_todos_verem: post.acessibilidade_para_todos_verem 
                          });
                        }}>✏️ Editar Textos</button>
                      </div>
                    )}

                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText size={16} /> Head Instagram Feed</h4>
                    {editingTextsId === post.id ? (
                      <textarea 
                        className="form-textarea mb-4 text-sm" 
                        rows="6" 
                        value={tempTexts.texto_instagram}
                        onChange={e => setTempTexts({...tempTexts, texto_instagram: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap mb-4">{post.texto_instagram}</p>
                    )}
                    
                    <h4 className="font-bold text-sm mb-2">Acessibilidade</h4>
                    {editingTextsId === post.id ? (
                      <textarea 
                        className="form-textarea mb-4 text-xs" 
                        rows="3" 
                        value={tempTexts.acessibilidade_para_todos_verem}
                        onChange={e => setTempTexts({...tempTexts, acessibilidade_para_todos_verem: e.target.value})}
                      />
                    ) : (
                      <p className="text-xs text-muted mb-4">{post.acessibilidade_para_todos_verem}</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 m-0">
                          <ImageIcon size={16} /> 
                          {isStory ? 'Card Stories (1080x1920)' : 'Card Feed (1080x1350)'}
                        </h4>
                        
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '4px 8px', fontSize: '0.75rem' }}>
                          Upload Manual
                          <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64String = reader.result;
                                  await fetch(`/api/posts/${post.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ arte_final: base64String, status_interno: 'Para Revisão Interna' })
                                  });
                                  fetchPosts();
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {post.arte_final ? (
                        <>
                          <a href={post.arte_final} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', maxWidth: '200px', cursor: 'pointer', position: 'relative' }} title="Clique para ampliar a arte">
                            <img 
                              src={post.arte_final} 
                              alt="Arte Final" 
                              style={{ 
                                width: '100%', 
                                aspectRatio: isStory ? '9/16' : '4/5',
                                objectFit: 'cover',
                                borderRadius: '8px', 
                                boxShadow: 'var(--shadow-md)',
                                transition: 'transform 0.2s ease, opacity 0.2s ease'
                              }} 
                              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                              onMouseOut={e => e.currentTarget.style.opacity = '1'}
                            />
                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', pointerEvents: 'none' }}>
                              🔍 Ampliar
                            </div>
                          </a>
                          <a 
                            href={post.arte_final} 
                            download={`Post_${post.data_publicacao.replace(/-/g, '')}.png`}
                            className="btn btn-outline btn-sm mt-2" 
                            style={{ width: '100%', maxWidth: '200px', display: 'flex', justifyContent: 'center' }}
                          >
                            Baixar Arquivo
                          </a>
                        </>
                      ) : (
                        <p className="text-xs text-muted mb-0">Ainda sem arte final. Utilize a IA ou faça upload.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-slate-200 rounded-md p-6">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm text-center">Clique em "Gerar com IA" para criar os textos automaticamente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Novo Post</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPost}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="form-label">Data de Publicação</label>
                  <input type="date" className="form-input" value={newPostData.data_publicacao} onChange={(e) => setNewPostData({...newPostData, data_publicacao: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Horário</label>
                  <input type="time" className="form-input" value={newPostData.horario_agendamento} onChange={(e) => setNewPostData({...newPostData, horario_agendamento: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="form-label">Dia da Semana</label>
                  <select className="form-input" value={newPostData.dia_semana} onChange={(e) => setNewPostData({...newPostData, dia_semana: e.target.value})}>
                    <option>Segunda-feira</option>
                    <option>Terça-feira</option>
                    <option>Quarta-feira</option>
                    <option>Quinta-feira</option>
                    <option>Sexta-feira</option>
                    <option>Sábado</option>
                    <option>Domingo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Formato</label>
                  <select className="form-input" value={newPostData.formato} onChange={(e) => setNewPostData({...newPostData, formato: e.target.value})}>
                    <option>Feed 4:5</option>
                    <option>Story 9:16</option>
                    <option>Carrossel 4:5</option>
                    <option>Reels 9:16</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isCreating}>{isCreating ? 'Criando...' : 'Criar Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
