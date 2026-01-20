# 🎨 Personalização de Perfil com Google Sign-In

## ✨ Nova Funcionalidade Implementada!

Quando um usuário faz login com Google pela **primeira vez**, ele é direcionado para uma tela de personalização onde pode:

1. **Escolher um nome de usuário** personalizado
2. **Selecionar a cor do tema** dos botões do aplicativo

---

## 🎯 Fluxo de Usuário

### Para Novos Usuários (Login com Google):

```
1. Usuário clica em "Continuar com Google"
   ↓
2. Seleciona conta Google
   ↓
3. É redirecionado para tela de Personalização de Perfil
   ↓
4. Escolhe nome de usuário (mínimo 3 caracteres)
   ↓
5. Seleciona cor do tema (8 opções disponíveis)
   ↓
6. Vê preview do botão com a cor escolhida
   ↓
7. Clica em "Continuar"
   ↓
8. Entra no aplicativo com tema personalizado!
```

### Para Usuários Existentes (Login com Google):

```
1. Usuário clica em "Continuar com Google"
   ↓
2. Seleciona conta Google
   ↓
3. Entra direto no aplicativo (pula a tela de setup)
```

---

## 🎨 Cores Disponíveis

O usuário pode escolher entre 8 cores:

| Cor      | Código Hex | Preview |
|----------|-----------|---------|
| Roxo     | #8b5cf6   | 🟣      |
| Azul     | #3b82f6   | 🔵      |
| Verde    | #10b981   | 🟢      |
| Rosa     | #ec4899   | 🩷      |
| Laranja  | #f97316   | 🟠      |
| Vermelho | #ef4444   | 🔴      |
| Ciano    | #06b6d4   | 🔷      |
| Amarelo  | #eab308   | 🟡      |

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:

1. **`components/ProfileSetup.tsx`**
   - Tela de personalização de perfil
   - Seletor de cor com preview
   - Validação de username

2. **`hooks/useThemeColor.ts`**
   - Hook para carregar cor do usuário
   - Aplica cor automaticamente no CSS
   - Persiste no localStorage

### Arquivos Modificados:

1. **`components/LoginView.tsx`**
   - Detecta se é primeiro login com Google
   - Redireciona para ProfileSetup se necessário
   - Mantém fluxo normal para usuários existentes

2. **`App.tsx`**
   - Importa e usa `useThemeColor()`
   - Aplica cor personalizada automaticamente

3. **`FIREBASE_SETUP.md`**
   - Atualizado schema da coleção `users`
   - Adicionados campos `themeColor` e `photoURL`

---

## 💾 Estrutura de Dados no Firestore

### Coleção: `users`

```javascript
{
  username: "João Silva",
  email: "joao@gmail.com",
  themeColor: "#8b5cf6",           // ← NOVO: Cor personalizada
  photoURL: "https://...",         // ← NOVO: Foto do Google
  createdAt: "2026-01-19T..."
}
```

**ID do documento:** UID do usuário

---

## 🎨 Como Funciona a Personalização

### 1. Salvamento da Cor

Quando o usuário escolhe uma cor:
```typescript
await setDoc(doc(db, 'users', user.uid), {
  username: username.trim(),
  email: user.email,
  themeColor: selectedColor.value,  // Ex: "#8b5cf6"
  createdAt: new Date().toISOString(),
  photoURL: user.photoURL
});
```

### 2. Aplicação da Cor

O hook `useThemeColor` carrega e aplica a cor:
```typescript
// Busca do Firestore
const userDoc = await getDoc(userDocRef);
const color = userDoc.data().themeColor;

// Aplica no CSS
document.documentElement.style.setProperty('--color-primary', color);

// Salva no localStorage
localStorage.setItem('userThemeColor', color);
```

### 3. Uso no CSS

A cor é aplicada automaticamente em todos os botões primários:
```css
.bg-primary {
  background-color: var(--color-primary);
}
```

---

## ✅ Funcionalidades

### Tela de Personalização:

- ✅ Mostra foto de perfil do Google
- ✅ Campo de username com validação (mín. 3 caracteres)
- ✅ Grid de 8 cores para escolher
- ✅ Indicador visual da cor selecionada (anel + checkmark)
- ✅ Preview do botão com a cor escolhida
- ✅ Texto mostrando nome da cor selecionada
- ✅ Botão "Continuar" com a cor escolhida
- ✅ Loading state durante salvamento

### Aplicação da Cor:

- ✅ Cor aplicada em todos os botões primários
- ✅ Cor salva no Firestore
- ✅ Cor persistida no localStorage
- ✅ Cor carregada automaticamente no próximo login

---

## 🧪 Como Testar

1. **Limpe os dados do navegador** (para simular novo usuário)
2. Execute `npm run dev`
3. Clique em "Continuar com Google"
4. Selecione sua conta Google
5. **Você verá a tela de personalização!**
6. Escolha um nome de usuário
7. Selecione uma cor
8. Veja o preview do botão
9. Clique em "Continuar"
10. **Pronto!** O app estará com sua cor personalizada

### Para testar com usuário existente:

1. Faça logout
2. Clique em "Continuar com Google"
3. Selecione a mesma conta
4. **Você entrará direto** (sem tela de setup)
5. A cor escolhida anteriormente estará aplicada

---

## 🎯 Benefícios

- ✅ **Personalização:** Cada usuário tem seu tema único
- ✅ **Experiência melhorada:** Usuário se sente dono do app
- ✅ **Onboarding suave:** Processo de setup rápido e intuitivo
- ✅ **Visual atraente:** 8 cores vibrantes para escolher
- ✅ **Persistência:** Cor salva e aplicada automaticamente

---

## 📝 Notas Importantes

1. **Apenas para login com Google:** A tela de setup só aparece para novos usuários do Google
2. **Login com email/senha:** Usa cor padrão (roxo) - pode ser expandido no futuro
3. **Alteração de cor:** Atualmente não há UI para mudar a cor depois (pode ser adicionado nas configurações)
4. **Compatibilidade:** Funciona em todos os navegadores modernos

---

## 🚀 Próximas Melhorias Possíveis

- [ ] Adicionar tela de configurações para alterar cor depois
- [ ] Permitir escolha de cor também no cadastro com email/senha
- [ ] Adicionar mais opções de cores
- [ ] Permitir escolha de cores customizadas (color picker)
- [ ] Aplicar cor em mais elementos da UI
- [ ] Modo claro/escuro com cores personalizadas

---

## 🎉 Resumo

Agora o MeusMangás tem um sistema completo de personalização de perfil! Quando um usuário faz login com Google pela primeira vez, ele pode:

1. ✅ Escolher seu nome de usuário
2. ✅ Selecionar a cor do tema (8 opções)
3. ✅ Ver preview em tempo real
4. ✅ Ter sua cor aplicada em todo o app

Tudo salvo no Firestore e aplicado automaticamente! 🚀
