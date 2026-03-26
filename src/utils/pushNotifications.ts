import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// COLE SUA VAPID PUBLIC KEY AQUI DENTRO DAS ASPAS
const PUBLIC_VAPID_KEY = 'BDorNWv1zkXMxijqymQhTI3YT_ycHKRnIDNMcEtIE0zXuMsrQovR02ycYhZbGPQ0RnRWq_-DYdifEeBU3BdvZb8';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error('Seu navegador não suporta notificações Push.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Permissão negada. Você não receberá alertas.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    const subData = JSON.parse(JSON.stringify(subscription));
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Erro de autenticação.');
      return;
    }

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subData.endpoint,
      auth: subData.keys.auth,
      p256dh: subData.keys.p256dh
    }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Erro no Supabase:', error);
      toast.error('Falha ao salvar a inscrição no banco de dados.');
      return;
    }

    toast.success('Notificações ativadas com sucesso! 🔔');
  } catch (error: any) {
    console.error('Erro geral ao assinar push:', error);
    toast.error('Falha ao ativar notificações. Tente novamente mais tarde.');
  }
};

// --- NOVA FUNÇÃO DE DISPARO (BLINDADA CONTRA ERRO 401) ---
export const sendPushNotification = async (title: string, body: string, url: string = '/jobs') => {
  try {
    // 1. Pega o "crachá" (sessão) do usuário logado
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Envia a requisição forçando o crachá no cabeçalho (Headers) para o Supabase não barrar
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { title, body, url },
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      }
    });

    if (error) {
      console.error('Erro ao chamar a função de Push:', error);
      return false;
    }

    console.log('Push enviado com sucesso para a rede!', data);
    return true;
  } catch (err) {
    console.error('Falha na requisição do Push:', err);
    return false;
  }
};