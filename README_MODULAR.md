# CoopSystem - Sistema Modular Cooperativista

## 📋 Visão Geral

O CoopSystem é uma plataforma modular desenvolvida em .NET 8.0 projetada para gerenciar operações cooperativistas. O sistema foi arquitetado seguindo princípios de modularidade para permitir expansão e manutenção escaláveis.

## 🏗️ Estrutura do Sistema

```
CoopSystem/
├── CoopSystem.sln                    # Solution principal
├── src/                             # Projetos principais
│   └── CoopSystem.API/              # API principal do sistema
│       ├── CoopSystem.API.csproj
│       ├── Program.cs                # Configuração e startup
│       ├── appsettings.json
│       └── Infrastructure/           # Infraestrutura compartilhada
├── modules/                         # Módulos de negócio
│   └── Recoopera.Module/           # Módulo de Recuperação
│       ├── Recoopera.Module.csproj
│       ├── ModuleExtensions.cs      # Configurações do módulo
│       ├── Application/            # Camada de aplicação
│       ├── Domain/                # Camada de domínio
│       ├── Infrastructure/         # Camada de infraestrutura
│       └── Controllers/           # Controllers do módulo
└── README_MODULAR.md              # Esta documentação
```

## 🚀 Módulo Recoopera

O módulo Recoopera é responsável pela gestão de renegociação de contratos e recuperação de crédito.

### Funcionalidades

- **Renegociação de Contratos**: Gestão completa do processo de renegociação
- **Cálculos Financeiros**: Motor de cálculos para juros, multas e taxas
- **Validação de Contratos**: Verificação de regras de negócio
- **Integração com Excel**: Importação e processamento de planilhas
- **Autenticação**: Sistema seguro de login e permissões

### Endpoints Principais

```
GET    /api/renegociacoes/{cpfCnpj}              # Buscar contratos
GET    /api/renegociacoes/pesquisar-por-nome/{nome} # Pesquisar por nome
GET    /api/renegociacoes/grid/{cpfCnpj}         # Grid de contratos
POST   /api/renegociacoes/consolidar              # Consolidar renegociação
POST   /api/renegociacoes/simular                 # Simular valores
POST   /api/renegociacoes/limpar-cache            # Limpar cache
```

## 🔧 Configuração

### 1. Configuração do Ambiente

No arquivo `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CoopSystemNovo;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "Jwt": {
    "Key": "SuaChaveSecretaSuperSegura123456789",
    "Issuer": "CoopSystem",
    "Audience": "CoopSystem.Users"
  },
  "CoopSystemSettings": {
    "SystemName": "CoopSystem",
    "Version": "1.0.0",
    "EnableModules": ["Recoopera"]
  }
}
```

### 2. Configuração do Módulo

No `Program.cs` da API principal:

```csharp
// Registrar módulo Recoopera
builder.Services.AddRecooperaModule(builder.Configuration);
```

## 🏛️ Arquitetura

### Camadas do Módulo

1. **Controllers**: Orquestração de requisições HTTP
2. **Application**: Serviços de aplicação e DTOs
3. **Domain**: Entidades e serviços de domínio
4. **Infrastructure**: Repositórios e configurações externas

### Princípios

- **Single Responsibility**: Cada classe tem uma única responsabilidade
- **Dependency Injection**: Injeção de dependências para testabilidade
- **Separation of Concerns**: Separação clara entre camadas
- **Modularity**: Módulos independentes e configuráveis

## 📦 Adicionando Novos Módulos

Para adicionar um novo módulo ao sistema:

1. Criar pasta em `modules/{NomeDoModulo}.Module`
2. Criar projeto `{NomeDoModulo}.Module.csproj`
3. Implementar interfaces e classes necessárias
4. Criar método de extensão `{NomeDoModulo}Extensions`
5. Adicionar referência no projeto `CoopSystem.API`
6. Registrar no `Program.cs`

### Exemplo de Estrutura de Módulo

```
modules/NovoModulo.Module/
├── NovoModulo.Module.csproj
├── NovoModuloExtensions.cs
├── Application/
├── Domain/
├── Infrastructure/
└── Controllers/
```

## 🔄 Fluxo de Trabalho

### Desenvolvimento

1. **API Principal**: Configurações globais e autenticação
2. **Módulos**: Lógica de negócio específica
3. **Comunicação**: Injeção de dependências e interfaces

### Deploy

1. Compilar solution: `dotnet build CoopSystem.sln`
2. Publicar API: `dotnet publish src/CoopSystem.API`
3. Deploy do executável com todos os módulos

## 🧪 Testes

### Testes Unitários

Cada módulo deve ter seu próprio projeto de testes:

```
tests/
├── Recoopera.Module.Tests/
├── OutroModulo.Module.Tests/
└── CoopSystem.API.Tests/
```

### Testes de Integração

Testar a integração entre módulos através da API principal.

## 📊 Monitoramento

### Logs

- **Sistema**: `logs/coopsystem-.log`
- **Módulos**: Integrado ao sistema central de logging

### Métricas

- Performance de endpoints
- Tempo de processamento de módulos
- Taxa de erros por módulo

## 🔐 Segurança

- **JWT**: Autenticação baseada em tokens
- **Autorização**: Por módulo e endpoint
- **HTTPS**: Comunicação segura
- **CORS**: Configuração de origens permitidas

## 🚀 Performance

- **Cache**: Cache inteligente por módulo
- **Async**: Operações assíncronas
- **Connection Pooling**: Otimização de banco de dados
- **Lazy Loading**: Carregamento sob demanda

## 📝 Próximos Passos

1. **Módulo de CRM**: Gestão de relacionamento com clientes
2. **Módulo Financeiro**: Contas a pagar/receber
3. **Módulo de Relatórios**: Dashboard e analytics
4. **Módulo de Notificações**: Email, SMS, Push
5. **Módulo de Auditoria**: Log de operações

## 🤝 Contribuição

1. Fork do projeto
2. Criar branch para feature/módulo
3. Implementar seguindo padrões arquiteturais
4. Testes automatizados
5. Pull request para review

---

**CoopSystem** - Plataforma Modular Cooperativista  
Versão: 1.0.0  
Framework: .NET 8.0
