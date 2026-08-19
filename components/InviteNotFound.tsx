import { Heart } from 'lucide-react';

export default function InviteNotFound({ isGuest }: { isGuest: boolean }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-8 text-center">
      <Heart size={40} className="fill-blush text-blush" />
      <h1 className="text-xl font-bold text-ink">Convite não encontrado</h1>
      <p className="text-sm text-mist">
        Esse link expirou (convites duram 30 dias) ou está incompleto.
        {isGuest
          ? ' Peça pra pessoa que te convidou enviar o link de novo.'
          : ' Você pode criar um convite novo abaixo.'}
      </p>
      {!isGuest && (
        <a href="/" className="btn-primary">
          Criar novo convite
        </a>
      )}
    </div>
  );
}
