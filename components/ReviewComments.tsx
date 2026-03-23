// components/ReviewComment.tsx
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import FormattedDescription from "@/components/FormattedDescription";
// Assumindo que StarRating está sendo exportado de 'page.tsx'
import { StarRating } from "@/app/categoria/[slug]/[nome]/page";
import { useAuth } from "@/context/AuthContext";
import { getUserProgress } from "@/lib/api";

// Tipos
type User = {
  usuarioId?: number;
  nomeCompleto?: string;
  nome?: string; 
};

type Review = {
  avaliacoesId: number;
  comentario: string;
  nota: number | null;
  usuario: User;
  respostas?: Review[]; 
};

type ReviewCommentProps = {
  review: Review;
  onReplyClick: (parentId: number) => void;
  onDeleteClick: (reviewId: number) => void;
  currentUser: { usuarioId: number } | null;
  allowReply: boolean;
};

export const ReviewComment = ({
  review,
  onReplyClick,
  onDeleteClick,
  currentUser,
  allowReply,
}: ReviewCommentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Cache simples em memória para evitar múltiplas chamadas para o mesmo usuário
  // (vigorará durante a sessão da página)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staticAny: any = null;
  // @ts-ignore
  const userTagCache: Map<number, string | null> = (globalThis as any).__userTagCache ||= new Map();

  const { user: authUser } = useAuth();
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    const uid = (review.usuario as any)?.usuarioId ?? (review.usuario as any)?.id;
    if (!uid) return;

    // Se já tivermos a tag em cache, usar imediatamente
    if (userTagCache.has(uid)) {
      setTag(userTagCache.get(uid) ?? null);
      return;
    }

    // Se não houver token, salvar null em cache e não tentar buscar
    if (!authUser || !authUser.token) {
      userTagCache.set(uid, null);
      setTag(null);
      return;
    }

    let mounted = true;
    getUserProgress(Number(uid), authUser.token)
      .then((resp) => {
        if (!mounted) return;
        if (resp && typeof resp.tag !== "undefined") {
          const t = String(resp.tag);
          userTagCache.set(uid, t);
          setTag(t);
        } else {
          userTagCache.set(uid, null);
          setTag(null);
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar tag do usuário para comentário:", err);
        userTagCache.set(uid, null);
        if (mounted) setTag(null);
      });

    return () => {
      mounted = false;
    };
  }, [review.usuario, authUser]);

  // --- CORREÇÃO 1 ---
  // Use optional chaining (?.), e 'nullish coalescing' (??) para
  // calcular 'replyCount' e 'hasReplies' de forma segura.
  const replyCount = review.respostas?.length ?? 0;
  const hasReplies = replyCount > 0;
  // --- FIM DA CORREÇÃO 1 ---

  // Nome a ser exibido: prioriza 'nomeCompleto', cai para 'nome' ou 'Usuário'
  const displayName = review.usuario?.nomeCompleto ?? review.usuario?.nome ?? "Usuário";
  // Compatibilidade para comparação de IDs (pode vir como usuarioId ou id)
  const reviewUserId = (review.usuario as any)?.usuarioId ?? (review.usuario as any)?.id ?? 0;

  return (
    <div className="flex gap-4 py-2 items-start">
      {/* Avatar */}
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 my-top ml-4">
        <Image
          src="/avatars/default-avatar.png"
          alt={`Avatar de ${displayName}`}
          width={48}
          height={48}
          className="rounded-full w-full h-full object-cover"
        />
      </div>

      {/* Conteúdo do Comentário */}
      <div className="flex-1">
        {/* ... (Nome de usuário, botão de excluir, estrelas, texto) ... */}
        <div className="flex items-center gap-2">
          <p
            className={` text-gray-800 font-semibold ${
              allowReply ? " text-base" : "text-sm text-gray-500"
            }`}
          >
            {displayName}
            {/* Exibe a tag do usuário ao lado do nome, se disponível */}
            {tag && (
              <span className="ml-2 text-xs text-[#007a73] font-semibold px-2 py-0.5 bg-[#e6f7f6] rounded-full">
                {tag}
              </span>
            )}
            {currentUser && currentUser.usuarioId === reviewUserId && (
              <button
                onClick={() => onDeleteClick(review.avaliacoesId)}
                className="ml-3 text-sm text-red-500 hover:text-red-700"
                aria-label="Excluir seu comentário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </p>
        </div>

        {review.nota && review.nota > 0 && (
          <div className="flex items-center gap-1 my-1">
            <StarRating rating={review.nota} />
          </div>
        )}

        <p className="text-gray-600 break-words">
          <FormattedDescription text={review.comentario} />
        </p>

        {/* --- SEÇÃO DE BOTÕES --- */}
        <div className="flex items-center gap-4 mt-2">
          {/* Botão de Responder */}
          {allowReply && (
            <button
              onClick={() => onReplyClick(review.avaliacoesId)}
              className="text-sm font-medium text-[#3C6AB2] hover:text-[#D7386E] flex items-center gap-1"
            >
              Responder
            </button>
          )}

          {/* Botão de Ver/Esconder Respostas */}
          {hasReplies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-[#D7386E] hover:[#3C6AB2] flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Esconder Respostas
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> Ver{" "}
                  {/* --- CORREÇÃO 2 --- */}
                  {/* Use a variável segura 'replyCount' que calculamos acima */}
                  {replyCount} {replyCount === 1 ? "Resposta" : "Respostas"}
                  {/* --- FIM DA CORREÇÃO 2 --- */}
                </>
              )}
            </button>
          )}
        </div>
        {/* --- FIM DA SEÇÃO DE BOTÕES --- */}

        {/* --- RENDERIZAÇÃO CONDICIONAL DAS RESPOSTAS --- */}
        {isExpanded && hasReplies && (
          <div className="mt-2 pt-4 border-l-2 border-gray-200 space-y-4">
            {/* --- CORREÇÃO 3 --- */}
            {/* Use optional chaining (?.) aqui. O map só será executado se 'respostas' existir. */}
            {review.respostas?.map((reply) => (
              <ReviewComment
                key={reply.avaliacoesId}
                review={reply}
                onReplyClick={onReplyClick}
                onDeleteClick={onDeleteClick}
                currentUser={currentUser}
                allowReply={false}
              />
            ))}
            {/* --- FIM DA CORREÇÃO 3 --- */}
          </div>
        )}
        {/* --- FIM DA RENDERIZAÇÃO CONDICIONAL --- */}
      </div>
    </div>
  );
};
