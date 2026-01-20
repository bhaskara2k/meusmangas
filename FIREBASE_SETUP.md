# MeusMangás - Migração para Firebase

## 🔥 Configuração do Firebase

Este projeto foi migrado do Supabase para o Firebase. Aqui estão as instruções para configurar o Firebase no seu projeto.

### Estrutura do Banco de Dados (Firestore)

O aplicativo usa as seguintes coleções no Firestore:

#### 1. **collection** (Coleção de Mangás)
Armazena os volumes de mangá que o usuário possui.

```javascript
{
  user_id: string,        // UID do usuário no Firebase Auth
  item_id: string,        // ID único do item (formato: mangaId-volume)
  manga_id: string,       // ID do mangá no MangaDex
  title: string,          // Título do mangá
  volume: string,         // Número do volume
  image_url: string,      // URL da capa
  publisher: string       // Editora (JBC, Panini, etc.)
}
```

**Índices necessários:**
- `user_id` (ASC)
- Índice composto: `user_id` (ASC) + `item_id` (ASC)

#### 2. **series_status** (Status das Séries)
Armazena o status de cada série (Lendo, Completo, etc.)

```javascript
{
  user_id: string,
  manga_id: string,
  status: string          // "reading", "completed", "on_hold", "dropped"
}
```

**ID do documento:** `{userId}_{mangaId}`

#### 3. **tracked_volumes** (Volumes Rastreados)
Armazena quais volumes o usuário deseja rastrear para completude.

```javascript
{
  user_id: string,
  manga_id: string,
  volumes: string[]       // Array de números de volumes
}
```

**ID do documento:** `{userId}_{mangaId}`

#### 4. **hidden_volumes** (Volumes Ocultos)
Armazena volumes que o usuário não deseja rastrear.

```javascript
{
  user_id: string,
  manga_id: string,
  volumes: string[]
}
```

**ID do documento:** `{userId}_{mangaId}`

#### 5. **users** (Usuários)
Informações adicionais dos usuários.

```javascript
{
  username: string,       // ÚNICO - Validado antes de salvar
  email: string,
  themeColor: string,     // Cor personalizada do tema (hex)
  photoURL: string,       // URL da foto de perfil (Google)
  createdAt: string       // ISO timestamp
}
```

**ID do documento:** UID do usuário

**Nota:** O campo `username` deve ser único. A validação é feita no código antes de salvar.

### Regras de Segurança do Firestore

Configure as seguintes regras no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função helper para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função helper para verificar se é o próprio usuário
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Coleção de usuários
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Coleção de mangás
    match /collection/{docId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    
    // Status das séries
    match /series_status/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Volumes rastreados
    match /tracked_volumes/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Volumes ocultos
    match /hidden_volumes/{docId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.user_id == request.auth.uid) &&
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

### Configuração da Autenticação

1. No Firebase Console, vá para **Authentication**
2. Ative o método de login **Email/Password**
3. **Ative o método de login com Google:**
   - Clique em "Add new provider"
   - Selecione "Google"
   - Ative o toggle
   - Configure o e-mail de suporte do projeto
   - Clique em "Save"

**Importante:** O login com Google funciona automaticamente em localhost. Para produção:
- Adicione seu domínio em **Authentication → Settings → Authorized domains**
- Configure o OAuth consent screen no Google Cloud Console se necessário

### Índices do Firestore

Crie os seguintes índices compostos no Firestore:

1. **collection**
   - Campos: `user_id` (Ascending), `item_id` (Ascending)
   - Modo de consulta: Collection

### Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

3. Para build de produção:
```bash
npm run build
```

## 📝 Mudanças Principais da Migração

### Autenticação
- **Antes (Supabase):** `supabase.auth.signInWithPassword()`
- **Agora (Firebase):** `signInWithEmailAndPassword(auth, email, password)`

### Banco de Dados
- **Antes (Supabase):** SQL com `supabase.from('table').select()`
- **Agora (Firebase):** NoSQL com Firestore usando `collection()`, `query()`, `getDocs()`

### Identificação de Usuário
- **Antes:** `user.id`
- **Agora:** `user.uid`

## 🔧 Arquivos Principais

- `firebase.ts` - Configuração do Firebase
- `services/firestoreService.ts` - Funções helper para operações no Firestore
- `contexts/UserContext.tsx` - Contexto de autenticação
- `components/LoginView.tsx` - Tela de login/registro

## 🚀 Próximos Passos

1. Configure as regras de segurança no Firebase Console
2. Crie os índices necessários
3. **Ative o Google Sign-In no Firebase Console**
4. Teste o login e registro de usuários (email/senha e Google)
5. Teste a adição e remoção de mangás da coleção
6. Teste o verificador de completude

## ✨ Funcionalidades de Autenticação

### Login com Email/Senha
- Registro de novos usuários com email, senha e username
- Login de usuários existentes
- Validação de senha (mínimo 6 caracteres)
- Tratamento de erros em português

### Login com Google
- **Login rápido com conta Google** (novo!)
- Criação automática de perfil de usuário
- Sincronização de nome e foto do perfil
- Funciona em localhost sem configuração adicional
- Para produção, adicione seu domínio nas "Authorized domains"

**Vantagens do Google Sign-In:**
- ✅ Login com um clique
- ✅ Não precisa lembrar de senha
- ✅ Mais seguro (autenticação do Google)
- ✅ Foto de perfil automática
- ✅ Experiência de usuário melhorada

## 📚 Recursos

- [Documentação do Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
