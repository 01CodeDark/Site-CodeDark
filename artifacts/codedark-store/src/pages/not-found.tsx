import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[80dvh] items-center justify-center bg-[#05080c] px-5">
      <div className="text-center">
        <p className="font-mono-ui text-[13px] text-[#ff665e]">ERRO 404</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight text-white">Página não encontrada</h1>
        <p className="mt-3 text-sm text-[#7f8b9d]">O endereço que você abriu não existe ou saiu do ar.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.03] px-5 py-3 text-sm font-semibold text-[#e9edf2] transition hover:border-[#ff534d]/60 hover:text-white">
          <ArrowLeft size={15} /> Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
