import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users, Phone, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { AttachmentUploader } from './AttachmentUploader';
import { AttachmentGrid } from './AttachmentCard';

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  phone_verified: boolean;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  participants?: User[];
  last_message?: Message;
  unread_count?: number;
}

interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited: boolean;
  deleted: boolean;
  sender?: User;
  receipts?: MessageReceipt[];
  attachments?: MessageAttachment[];
}

interface MessageReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
}

export function MessagingApp() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ id: string; filename: string; file_path: string; file_size: number; mime_type: string }>>([]);

  useEffect(() => {
    loadUser();
    loadConversations();
    loadAllUsers();
    subscribeToConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
      const cleanup = subscribeToMessages(selectedConversation);
      return cleanup;
    }
  }, [selectedConversation]);

  async function loadUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      setUser(data);
    }
    setLoading(false);
  }

  async function loadAllUsers() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number, phone_verified')
        .neq('id', authUser.id);

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setAllUsers(data || []);
    } catch (error) {
      console.error('Unexpected error loading users:', error);
    }
  }

  async function loadConversations() {
    const { data: convos } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner(user_id)
      `)
      .order('updated_at', { ascending: false });

    if (convos) {
      const enriched = await Promise.all(
        convos.map(async (convo) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, users(id, email, full_name, phone_number, phone_verified)')
            .eq('conversation_id', convo.id);

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...convo,
            participants: participants?.map((p: any) => p.users) || [],
            last_message: lastMsg,
          };
        })
      );
      setConversations(enriched);
    }
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email, full_name, phone_number),
        message_receipts(message_id, user_id, read_at),
        message_attachments(id, message_id, filename, file_path, file_size, mime_type, created_at)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const messagesWithAttachments = (data || []).map((msg: any) => ({
      ...msg,
      attachments: msg.message_attachments || [],
    }));

    setMessages(messagesWithAttachments);
  }

  async function markMessagesAsRead(conversationId: string) {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  function subscribeToMessages(conversationId: string) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, email, full_name, phone_number),
              message_receipts(message_id, user_id, read_at)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (fullMessage) {
            setMessages((prev) => [...prev, fullMessage]);
            await markMessagesAsRead(conversationId);
            await loadConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_receipts',
        },
        () => {
          loadMessages(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function subscribeToConversations() {
    const channel = supabase
      .channel('conversations:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function createConversation() {
    if (selectedUsers.length === 0 || !user) return;

    try {
      const type = selectedUsers.length === 1 ? 'direct' : 'group';
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          type,
          created_by: user.id,
        })
        .select()
        .single();

      if (convoError) {
        console.error('Error creating conversation:', convoError);
        alert('Erreur lors de la création de la conversation');
        return;
      }

      if (convo) {
        const participants = [user.id, ...selectedUsers].map((userId) => ({
          conversation_id: convo.id,
          user_id: userId,
        }));

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          alert('Erreur lors de l\'ajout des participants');
          await supabase.from('conversations').delete().eq('id', convo.id);
          return;
        }

        setShowNewConversation(false);
        setSelectedUsers([]);
        await loadConversations();
        setSelectedConversation(convo.id);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  }

  async function sendMessage() {
    if ((!messageInput.trim() && pendingAttachments.length === 0) || !selectedConversation) return;

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: user?.id,
        content: messageInput.trim() || '📎 Pièce(s) jointe(s)',
      })
      .select()
      .single();

    if (messageError || !messageData) {
      console.error('Error sending message:', messageError);
      return;
    }

    if (pendingAttachments.length > 0) {
      const attachmentRecords = pendingAttachments.map((att) => ({
        message_id: messageData.id,
        filename: att.filename,
        file_path: att.file_path,
        file_size: att.file_size,
        mime_type: att.mime_type,
        uploaded_by: user?.id,
      }));

      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert(attachmentRecords);

      if (attachmentError) {
        console.error('Error saving attachments:', attachmentError);
      }
    }

    setMessageInput('');
    setPendingAttachments([]);
    setShowAttachmentUploader(false);
    loadConversations();
  }

  async function deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        alert('Erreur lors de la suppression de la conversation');
        return;
      }

      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      setConversations(conversations.filter((c) => c.id !== conversationId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  }

  const selectedConvo = conversations.find((c) => c.id === selectedConversation);
  const otherParticipants = selectedConvo?.participants?.filter((p) => p.id !== user?.id) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-zinc-900 text-zinc-100">
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">Messages</h2>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => {
            const otherUsers = convo.participants?.filter((p) => p.id !== user?.id) || [];
            const displayName =
              convo.type === 'group'
                ? convo.name || `Groupe (${otherUsers.length + 1})`
                : otherUsers[0]?.full_name || otherUsers[0]?.email || 'Utilisateur';

            return (
              <div key={convo.id} className="relative group">
                <button
                  onClick={() => setSelectedConversation(convo.id)}
                  className={`w-full p-4 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 ${
                    selectedConversation === convo.id ? 'bg-zinc-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="font-medium truncate">{displayName}</div>
                      {otherUsers.length > 0 && otherUsers[0]?.phone_number && (
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {otherUsers[0].phone_number}
                          {otherUsers[0].phone_verified && (
                            <Check className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      )}
                      {convo.last_message && (
                        <p className="text-sm text-zinc-400 truncate mt-1">
                          {convo.last_message.content}
                        </p>
                      )}
                    </div>
                    {convo.last_message && (
                      <span className="text-xs text-zinc-500">
                        {new Date(convo.last_message.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(convo.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Supprimer la conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConvo ? (
          <>
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-semibold">
                {selectedConvo.type === 'group'
                  ? selectedConvo.name || `Groupe (${selectedConvo.participants?.length})`
                  : otherParticipants[0]?.full_name || otherParticipants[0]?.email}
              </h3>
              {otherParticipants.length > 0 && otherParticipants[0]?.phone_number && (
                <div className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  {otherParticipants[0].phone_number}
                  {otherParticipants[0].phone_verified && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const hasBeenRead = msg.receipts && msg.receipts.length > 0;

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                      }`}
                    >
                      {!isMine && selectedConvo.type === 'group' && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {msg.sender?.full_name || msg.sender?.email}
                        </div>
                      )}
                      <p className="break-words">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2">
                          <AttachmentGrid
                            attachments={msg.attachments}
                            bucket="message-attachments"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine &&
                          (hasBeenRead ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-zinc-800 space-y-3">
              {showAttachmentUploader && user && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
                  <AttachmentUploader
                    userId={user.id}
                    bucket="message-attachments"
                    onUploadComplete={(attachments) => {
                      setPendingAttachments(attachments);
                      setShowAttachmentUploader(false);
                    }}
                  />
                </div>
              )}

              {pendingAttachments.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm"
                    >
                      <span className="truncate max-w-[150px]">{att.filename}</span>
                      <button
                        onClick={() => setPendingAttachments(pendingAttachments.filter((_, i) => i !== idx))}
                        className="hover:bg-blue-500/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAttachmentUploader(!showAttachmentUploader)}
                  className="px-3 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors"
                  title="Joindre des fichiers"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() && pendingAttachments.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>

      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvelle conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSelectedUsers([]);
                }}
                className="p-1 hover:bg-zinc-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {allUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, u.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{u.full_name || u.email}</div>
                    {u.phone_number && (
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {u.phone_number}
                        {u.phone_verified && <Check className="w-3 h-3 text-green-500" />}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={createConversation}
              disabled={selectedUsers.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Créer ({selectedUsers.length})
            </button>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold">Supprimer la conversation</h3>
            </div>
            <p className="text-zinc-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette conversation? Cette action est irréversible et supprimera tous les messages.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConversation(deleteConfirmId)}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
