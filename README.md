# 💧 AquaHabit - PWA de Hidratação Diária & Diário de Hábitos

AquaHabit é um **Progressive Web App (PWA)** offline-first de alta performance construído em React, TypeScript, Tailwind CSS e Supabase. O aplicativo calcula automaticamente o **Índice de Massa Corporal (IMC)** e a **meta diária ideal de água** com base nos parâmetros corporais e nível de atividade física do usuário, permitindo o registro ágil de consumo, acompanhamento em calendário diário/mensal e sincronização na nuvem com **Google OAuth**.

---

## ✨ Funcionalidades Principais

1. **Setup Corporal & Cálculo Dinâmico de IMC:**
   - Fórmula: $\text{IMC} = \frac{\text{peso (kg)}}{(\text{altura (m)})^2}$.
   - Classificação detalhada (Abaixo do peso, Normal, Sobrepeso, Obesidade I, II, III).
   - Cálculo inteligente de meta hídrica (35ml a 45ml por kg corporal ajustado por nível de atividade física: sedentário, moderado ou intenso).
   - Preview em tempo real durante a digitação.

2. **Diário & Planner de Hidratação:**
   - Anel animado de progresso com porcentagens, volume atual e meta restante.
   - Botões de adição rápida com 1 toque (+150ml, +250ml, +500ml, +750ml e volume customizado).
   - Seletor de tipo de bebida (Água pura, Água com limão, Chá natural, Café, Isotônico).
   - Linha do tempo de ingestão com horário e opção de remover registro.
   - Efeito comemorativo de confetes e áudio sintetizado ao atingir 100% da meta!

3. **Calendário Mensal & Histórico de Hábitos:**
   - Visualização estilo planner/calendário de todos os dias do mês.
   - Status visual imediato (dias com meta batida em verde/esmeralda, dias parciais em azul e dias sem registro).
   - Indicador de Sequência de Hábitos (*Streak Counter* em dias consecutivos).

4. **PWA Completo & Offline-First:**
   - Totalmente instalável no Android, Windows/Mac e iOS (Adicionar à Tela de Início).
   - Service Worker via Workbox com cache inteligente de assets.
   - Fila de sincronização offline (IndexedDB/LocalStorage) que salva seus registros sem internet e sincroniza automaticamente com o Supabase ao reconectar.
   - Suporte a notificações locais de lembrete de hidratação.

5. **Autenticação & Banco com Supabase:**
   - Login com Google OAuth com persistência de sessão e proteção de dados.
   - Row Level Security (RLS) completo com políticas restritas ao usuário autenticado (`auth.uid() = id`).
   - Modo Convidado / Demonstração 100% funcional caso o Supabase ainda não tenha sido configurado.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 18+ instalado.

### 2. Instalar Dependências
```bash
npm install
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

### 4. Executar os Testes Unitários
```bash
npm run test
```

### 5. Gerar Build de Produção do PWA
```bash
npm run build
```

---

## 🗄️ Configuração do Banco de Dados Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No painel do Supabase, acesse o **SQL Editor**.
3. Copie e cole todo o conteúdo do arquivo [`supabase/migrations/20260818_init_schema.sql`](./supabase/migrations/20260818_init_schema.sql) e clique em **Run**.
4. No menu **Authentication > Providers**, ative o provedor **Google** inserindo seu *Client ID* e *Client Secret* do Google Cloud Console.
5. Em **Authentication > URL Configuration**, certifique-se de que a URL do seu app (ex: `http://localhost:5173` ou seu domínio de produção) esteja na lista de **Redirect URLs**.
6. Copie a `Project URL` e a `anon key` em **Project Settings > API** e insira diretamente no app (pelo botão de Banco de Dados na barra superior) ou em um arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```
