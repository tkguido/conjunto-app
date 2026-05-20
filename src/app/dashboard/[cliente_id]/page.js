'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, UserCircle, Plus, X } from 'lucide-react';

export default function ClientCampaignsView() {
  const params = useParams();
  const [client, setClient] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaignPeriod, setNewCampaignPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [editedPersona, setEditedPersona] = useState('');
  const [isSavingPersona, setIsSavingPersona] = useState(false);

  const fetchCampaigns = () => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        const foundClient = data.clients.find(c => c.id === params.cliente_id);
        if (foundClient) setClient(foundClient);
        setCampaigns(data.campaigns.filter(c => c.client_id === params.cliente_id));
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [params.cliente_id]);

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignPeriod) return;
    
    setIsLoading(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: params.cliente_id, periodo: newCampaignPeriod })
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      setNewCampaignPeriod('');
      fetchCampaigns();
    }
    setIsLoading(false);
  };

  if (!client) return <div className="container">Carregando...</div>;

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      <div className="header" style={{ borderBottom: 'none', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={client.logo} alt={client.nome} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'contain', backgroundColor: '#fff' }} />
          <div>
            <h1>{client.nome}</h1>
            <p className="text-muted mt-1">Gestão de Campanhas</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', margin: 0 }}>
            <UserCircle size={18} color="#64748b" /> Persona & Tom de Voz
          </h3>
          <button 
            className="btn btn-outline btn-sm" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={async () => {
              if (isEditingPersona) {
                // Salvar as alterações
                setIsSavingPersona(true);
                await fetch(`/api/clients/${client.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ persona: editedPersona })
                });
                setClient({...client, persona: editedPersona});
                setIsEditingPersona(false);
                setIsSavingPersona(false);
              } else {
                // Entrar no modo de edição
                setEditedPersona(client.persona || '');
                setIsEditingPersona(true);
              }
            }}
            disabled={isSavingPersona}
          >
            {isEditingPersona ? (isSavingPersona ? 'Salvando...' : 'Salvar') : 'Editar'}
          </button>
        </div>
        {isEditingPersona ? (
          <textarea 
            className="form-input" 
            style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
            value={editedPersona}
            onChange={(e) => setEditedPersona(e.target.value)}
            placeholder="Descreva a persona e o tom de voz da marca..."
          />
        ) : (
          <p className="text-sm" style={{ color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {client.persona || 'Nenhuma persona definida ainda. Clique em Editar para adicionar.'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Quinzenas Abertas</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nova Quinzena
        </button>
      </div>
      
      {campaigns.length === 0 ? (
        <p className="text-muted">Nenhuma quinzena criada para este cliente.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {campaigns.map(camp => (
            <Link href={`/dashboard/${client.id}/${camp.id}`} key={camp.id}>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: 0 }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{camp.periodo}</h4>
                  <span className="text-xs text-muted">Acessar Painel da Agência →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Nova Quinzena</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCampaign}>
              <div className="form-group mb-4">
                <label className="form-label">Período</label>
                <input type="text" className="form-input" value={newCampaignPeriod} onChange={(e) => setNewCampaignPeriod(e.target.value)} required placeholder="Ex: Agosto 2026 - 1ª Quinzena" />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Quinzena'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
