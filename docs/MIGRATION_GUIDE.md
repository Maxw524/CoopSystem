# CoopSystem - Guia de Migração

## 📋 Situação Atual

O projeto atualmente contém duas versões do módulo Recoopera:

### 🚨 Problema Identificado

1. **`Recoopera/`** (raiz) - Versão antiga standalone
   - Contém Program.cs próprio
   - Era uma aplicação independente
   - **DEVE SER REMOVIDA**

2. **`modules/Recoopera.Module/`** - Versão modular correta
   - Integrada ao sistema principal
   - Segue clean architecture
   - **É A VERSÃO CORRETA**

## 🎯 Estrutura Correta Esperada

```
CoopSystem/
├── 📁 src/CoopSystem.API/          # API Principal
├── 📁 wwwroot/                      # Frontend Build
├── 📁 modules/                       # Módulos de Negócio
│   ├── 📁 Core/                    # Componentes Reutilizáveis
│   └── 📁 Recoopera.Module/         # ✅ Módulo Recoopera (CORRETO)
├── 📁 frontend/                      # Source Frontend
└── 📁 [outras pastas]
```

## 🔧 Passos para Correção

### 1. Backup (Opcional)
```bash
# Se precisar salvar algo da versão antiga
cp -r Recoopera backup-recoopera-$(date +%Y%m%d)
```

### 2. Remover Versão Antiga
```bash
# Remover pasta antiga (após backup)
rm -rf Recoopera/
```

### 3. Verificar Funcionamento
```bash
# Build do sistema
dotnet build CoopSystem.sln

# Build frontend
cd frontend && npm run build

# Testar API
cd src/CoopSystem.API && dotnet run
```

## 📁 Arquivos Importantes na Versão Antiga

Antes de remover, verifique se há algum arquivo importante em `Recoopera/`:

- **Arquivos/** - Planilhas e documentos
- **taxas-campanha.json** - Configurações de taxas
- **Migrations/** - Se tiver migrações não aplicadas

### Migrar Arquivos

```bash
# Migrar arquivos importantes
cp Recoopera/Arquivos/* shared/arquivos/
cp Recoopera/taxas-campanha.json shared/configs/

# Verificar migrations
# Se necessário, aplicar migrations do módulo correto
```

## 🎯 Benefícios da Correção

1. **Modularidade Real**: Sistema verdadeiramente modular
2. **Manutenibilidade**: Única fonte de verdade
3. **Consistência**: Segue padrão arquitetural
4. **Deploy Simplificado**: Uma única aplicação
5. **Versionamento**: Sem duplicidade no Git

## ⚠️ Cuidados

1. **Backup**: Sempre faça backup antes de remover
2. **Migrations**: Verifique se há migrations pendentes
3. **Configurações**: Migre configurações importantes
4. **Testes**: Teste tudo após a migração

## 🔄 Fluxo de Trabalho Futuro

Após correção:

1. **Desenvolvimento**: Trabalhar apenas em `modules/Recoopera.Module/`
2. **Build**: Build único do sistema principal
3. **Deploy**: Deploy da aplicação principal
4. **Novos Módulos**: Seguir mesmo padrão

---

**Status**: 🟡 Aguardando confirmação para remoção da versão antiga  
**Ação Necessária**: Remover pasta `Recoopera/` da raiz  
**Impacto**: Melhora significativa na arquitetura e manutenção
