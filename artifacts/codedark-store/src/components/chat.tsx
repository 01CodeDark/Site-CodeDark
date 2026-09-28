import { useCallback, useEffect, useRef, useState } from 'react';
import { Headphones, Send } from 'lucide-react';
import { get, post, type Mensagem } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function ChatPainel({ orderId, alturaFixa = true }: { orderId: string; alturaFixa?: boolean }) {
  const { usuario } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const ultimaIdRef = useRef(0);
  const souEquipe = usuario?.role === 'administrador' || usuario?.role === 'moderador';

  const carregar = useCallback(async (incremental = false) => {
    try {
      const after = incremental ? ultimaIdRef.current : 0;
      const novas = await get<Mensagem[]>(`/orders/${orderId}/messages${after ? `?after=${after}` : ''}`);
      if (novas.length) {
        ultimaIdRef.current = novas[novas.length - 1].id;
        setMensagens((atuais) => (incremental ? [...atuais, ...novas] : novas));
      } else if (!incremental) setMensagens([]);
    } catch { /* silencioso no polling */ }
  }, [orderId]);

  useEffect(() => {
    ultimaIdRef.current = 0;
    setMensagens([]);
    void carregar(false);
    const t = setInterval(() => void carregar(true), 4000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    try {
      setMensagens(await post<Mensagem[]>(`/orders/${orderId}/messages`, { text: conteudo }));
      setTexto('');
    } catch { /* mensagem de erro no chat: ignora silenciosamente, tenta de novo */ }
    setEnviando(false);
  }

  return <div className={`flex flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-[#070b11] ${alturaFixa ? 'h-[560px]' : 'h-full'}`}>
    <div className="flex items-center gap-2.5 border-b border-white/[.07] px-5 py-3.5 text-sm font-semibold text-[#e9edf2]">
      <Headphones size={15} className="text-[#ff625b]" /> Chat do pedido
      <span className="ml-auto font-mono-ui text-[10px] text-[#4f596a]">{souEquipe ? 'SUORTE' : 'SUPORTE'}</span>
    </div>
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {mensagens.length === 0 && <p className="pt-6 text-center text-xs text-[#5f6b7f]">Nenhuma mensagem ainda. Diga olá 👋</p>}
      {mensagens.map((m) => {
        const doSuporte = m.sender === 'suporte';
        return <div key={m.id} className={`flex ${doSuporte === souEquipe ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-5 ${doSuporte ? 'border border-[#ff534d]/20 bg-[#ff534d]/10 text-[#ffe3e1]' : 'border border-white/10 bg-white/[.05] text-[#dde3ec]'}`}>
            {!doSuporte && m.author && <span className="mb-0.5 block text-[10px] font-bold text-[#7f8b9d]">{m.author}</span>}
            {m.text_body}
            <span className="mt-1 block text-right font-mono-ui text-[9px] text-[#5f6b7f]">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>;
      })}
      <div ref={fimRef} />
    </div>
    <form onSubmit={enviar} className="flex gap-2 border-t border-white/[.07] p-3">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva sua mensagem…"
        className="flex-1 rounded-lg border border-white/10 bg-[#0a0e15] px-3.5 py-2.5 text-sm text-[#e9edf2] outline-none transition placeholder:text-[#59637a] focus:border-[#ff534d]/60"
      />
      <button type="submit" disabled={enviando || !texto.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff534d] text-white transition hover:bg-[#ff6c64] disabled:opacity-40" aria-label="Enviar"><Send size={16} /></button>
    </form>
  </div>;
}
