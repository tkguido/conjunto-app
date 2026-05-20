'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';

export default function ClientsView() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPersona, setNewClientPersona] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = () => {
    fetch('/api/data', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setClients(data.clients));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    
    setIsLoading(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: newClientName, persona: newClientPersona })
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      setNewClientName('');
      setNewClientPersona('');
      fetchClients();
    }
    setIsLoading(false);
  };

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: 0, color: 'rgba(0, 0, 0, 0.6)', fontWeight: 'bold' }}>Seus Clientes</h1>
            <p className="text-muted text-sm mt-1">Selecione uma marca para gerenciar campanhas e conteúdos.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {clients.map(client => (
          <Link href={`/dashboard/${client.id}`} key={client.id}>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <img src={client.logo} alt={client.nome} style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '50%', marginBottom: '1rem', border: '1px solid var(--border-color)', backgroundColor: '#fff' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{client.nome}</h3>
              <span className="text-sm text-muted mt-2">Ver Quinzenas →</span>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Novo Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="form-group mb-4">
                <label className="form-label">Nome da Marca</label>
                <input type="text" className="form-input" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required placeholder="Ex: Pink Cats" />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Persona / Descrição Rápida</label>
                <textarea className="form-textarea" rows="3" value={newClientPersona} onChange={(e) => setNewClientPersona(e.target.value)} placeholder="Ex: Marca jovem, alegre e colorida..."></textarea>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
