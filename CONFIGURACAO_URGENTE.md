# 🚨 CONFIGURAÇÃO URGENTE - Resolver Erros

## Erro: "Missing or insufficient permissions"

Este erro ocorre porque as regras de segurança do Firestore ainda não foram configuradas.

### ✅ SOLUÇÃO RÁPIDA (5 minutos)

#### Passo 1: Acessar o Firebase Console
1. Acesse: https://console.firebase.google.com
2. Selecione o projeto **meusmangas-42aaa**

#### Passo 2: Configurar Regras do Firestore
1. No menu lateral, clique em **Firestore Database**
2. Clique na aba **Rules** (Regras)
3. **APAGUE** todo o conteúdo atual
4. **COPIE E COLE** o conteúdo do arquivo `firestore.rules` que está na raiz do projeto
5. Clique em **Publish** (Publicar)

**OU copie diretamente daqui:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    match /collection/{docId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    
    match /series_status/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /tracked_volumes/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
    
    match /hidden_volumes/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

#### Passo 3: Ativar Google Sign-In
1. No menu lateral, clique em **Authentication**
2. Clique na aba **Sign-in method**
3. Clique em **Add new provider**
4. Selecione **Google**
5. Ative o toggle
6. Adicione um e-mail de suporte (pode ser o seu email)
7. Clique em **Save**

#### Passo 4: Recarregar o Aplicativo
1. Volte para o navegador onde o app está rodando
2. Pressione **Ctrl + Shift + R** (ou Cmd + Shift + R no Mac) para recarregar
3. Faça login novamente

---

## ✅ Outros Erros Corrigidos

### Erro no Header (username undefined)
- **Status:** ✅ CORRIGIDO
- **O que foi feito:** Atualizado para usar `displayName` do Firebase ao invés de `user_metadata.username` do Supabase

### Avisos CORS do Google Sign-In
- **Status:** ⚠️ AVISOS NORMAIS (não impedem o funcionamento)
- **Explicação:** São avisos do navegador sobre políticas de segurança, mas não afetam o login

### Erro MangaDex API
- **Status:** ⚠️ PROBLEMA EXTERNO
- **Explicação:** A API do MangaDex pode estar temporariamente indisponível ou bloqueando requisições
- **Impacto:** Não afeta o login ou a coleção, apenas a busca inicial de mangás populares

---

## 🧪 Teste Após Configurar

1. Faça login com email/senha OU Google
2. Adicione um mangá à coleção
3. Verifique se aparece na aba "Coleção"
4. Teste o verificador de completude

Se tudo funcionar, você verá:
- ✅ Seu nome no header
- ✅ Mangás sendo salvos
- ✅ Sem erros de permissão no console

---

## 📞 Precisa de Ajuda?

Se ainda houver erros após configurar as regras:
1. Verifique se as regras foram publicadas com sucesso
2. Faça logout e login novamente
3. Limpe o cache do navegador (Ctrl + Shift + Delete)
