# CoopSystem - Clean Architecture Guide

## 🏗️ Visão Geral

CoopSystem segue os princípios de Clean Architecture com modularidade, permitindo desenvolvimento escalável e manutenível.

## 📁 Estrutura do Projeto

```
CoopSystem/
├── 📁 src/                          # Backend .NET
│   └── 📁 CoopSystem.API/          # API Principal (Orchestrator)
│       ├── 📁 Controllers/           # Controllers Globais
│       ├── 📁 Infrastructure/        # Infraestrutura Compartilhada
│       ├── 📁 Core/                # Camada Central
│       └── 📄 Program.cs            # Configuração e Startup
├── 📁 wwwroot/                     # Arquivos Estáticos (Frontend Build)
│   ├── 📄 index.html              # Página principal
│   ├── 📁 assets/                 # Assets compilados
│   └── 📁 [imagens]              # Imagens e recursos
├── 📁 modules/                      # Módulos de Negócio
│   ├── 📁 Core/                   # Componentes Reutilizáveis
│   │   ├── 📁 Shared/             # DTOs e Interfaces Comuns
│   │   ├── 📁 Domain/             # Entidades Base
│   │   └── 📁 Infrastructure/      # Configurações Base
│   ├── 📁 Recoopera.Module/        # Módulo de Recuperação
│   └── 📁 [NovoModulo].Module/    # Futuros Módulos
├── 📁 frontend/                    # Frontend React (Source)
│   ├── 📁 src/
│   │   ├── 📁 components/         # Componentes Reutilizáveis
│   │   ├── 📁 pages/              # Páginas
│   │   ├── 📁 contexts/           # Contextos React
│   │   ├── 📁 services/           # Serviços API
│   │   └── 📁 styles/             # Estilos Globais
│   ├── 📁 public/                # Assets Estáticos
│   └── 📄 package.json
├── 📁 tests/                       # Testes Automatizados
│   ├── 📁 Unit/                  # Testes Unitários
│   ├── 📁 Integration/           # Testes de Integração
│   └── 📁 E2E/                   # Testes End-to-End
├── 📁 docs/                        # Documentação
│   ├── 📄 ARCHITECTURE.md       # Este arquivo
│   ├── 📄 API.md               # Documentação da API
│   └── 📄 DEPLOYMENT.md         # Guia de Deploy
├── 📁 scripts/                     # Scripts de Automação
│   ├── 📄 build.sh             # Build e Deploy
│   ├── 📄 test.sh              # Executar Testes
│   └── 📄 migrate.sh           # Migrations
├── 📁 deploy/                      # Artefatos de Deploy
│   └── 📁 docker/               # Configurações Docker
├── 📁 shared/                      # Recursos Compartilhados
│   ├── 📁 configs/              # Configurações
│   └── 📁 templates/            # Templates
└── 📄 CoopSystem.sln             # Solution Principal
```

## 🔧 Princípios da Arquitetura

### 1. Separação de Responsabilidades

- **API Principal**: Orquestração e configurações globais
- **Módulos**: Lógica de negócio isolada e auto-contida
- **Core**: Componentes compartilhados entre módulos
- **Frontend**: Interface do usuário independente

### 2. Dependências Direcionais

```
Frontend → API Principal → Módulos → Core → Infrastructure
    ↑           ↑           ↑        ↑         ↑
  UI        HTTP      Business  Domain   Data
```

### 3. Modularidade

Cada módulo deve ser:
- **Auto-contido**: Todas as dependências internas
- **Configurável**: Registro via DI
- **Testável**: Isolado para testes
- **Removível**: Possível desativar sem afetar outros

## 🏛️ Camadas da Arquitetura

### API Principal (CoopSystem.API)
- **Controllers**: Endpoints globais (Auth, Users, Health)
- **Infrastructure**: Configurações compartilhadas
- **Core**: Serviços e interfaces base

### Módulos de Negócio
```
[ModuleName].Module/
├── 📁 Controllers/           # API Endpoints
├── 📁 Application/           # Regras de Negócio
│   ├── 📁 Services/          # Serviços de Aplicação
│   ├── 📁 DTOs/             # Data Transfer Objects
│   └── 📁 Interfaces/        # Interfaces Locais
├── 📁 Domain/                # Lógica de Domínio
│   ├── 📁 Entities/          # Entidades
│   ├── 📁 Enums/             # Enumerações
│   ├── 📁 Events/            # Eventos de Domínio
│   └── 📁 Services/          # Serviços de Domínio
└── 📁 Infrastructure/         # Implementações Externas
    ├── 📁 Data/              # Repositórios
    ├── 📁 External/           # APIs Externas
    └── 📁 Mappings/          # Configurações ORM
```

### Frontend (React)
```
src/
├── 📁 components/           # Componentes Reutilizáveis
│   ├── 📁 ui/               # Componentes UI Base
│   ├── 📁 forms/            # Formulários
│   └── 📁 layout/           # Layout Components
├── 📁 pages/               # Páginas/Rotas
├── 📁 contexts/            # React Contexts
├── 📁 services/            # API Services
├── 📁 hooks/               # Custom Hooks
├── 📁 utils/               # Utilitários
├── 📁 types/               # TypeScript Types
└── 📁 styles/              # Estilos Globais
```

## 🔐 Segurança

### Autenticação
- **JWT Tokens**: Stateless authentication
- **Refresh Tokens**: Renovação automática
- **Password Hashing**: BCrypt ou superior

### Autorização
- **Role-based**: Permissões por papel
- **Module-based**: Acesso por módulo
- **Endpoint-based**: Granularidade fina

### Segurança de Dados
- **Encryption**: Dados sensíveis criptografados
- **Masking**: Logs sem informações sensíveis
- **Audit Trail**: Rastreabilidade completa

## 🚀 Performance

### Cache Strategy
- **Redis Cache**: Cache distribuído
- **In-Memory**: Cache local rápido
- **CDN**: Assets estáticos

### Database Optimization
- **Connection Pooling**: Pool de conexões
- **Indexing**: Índices otimizados
- **Query Optimization**: Queries eficientes

### Frontend Optimization
- **Code Splitting**: Lazy loading
- **Tree Shaking**: Remoção código morto
- **Bundle Optimization**: Mínimo de requisições

## 🧪 Testes

### Pyramid de Testes
```
        E2E Tests (10%)
       ─────────────────
      Integration Tests (20%)
     ─────────────────────
    Unit Tests (70%)
   ────────────────────────
```

### Cobertura Esperada
- **Unit Tests**: >80%
- **Integration**: >60%
- **E2E**: >40%

## 🔄 CI/CD Pipeline

### Stages
1. **Lint**: Code quality checks
2. **Test**: Automated test execution
3. **Build**: Compilation and packaging
4. **Security**: Vulnerability scanning
5. **Deploy**: Automated deployment

### Environment Strategy
- **Development**: Branches de feature
- **Staging**: Branch main
- **Production**: Tags de release

## 📊 Monitoramento

### Application Metrics
- **Performance**: Tempo de resposta
- **Availability**: Uptime
- **Error Rate**: Taxa de erros
- **Business Metrics**: KPIs específicas

### Logging Strategy
- **Structured Logs**: JSON format
- **Log Levels**: Debug, Info, Warning, Error
- **Correlation IDs**: Rastreabilidade
- **Centralized**: Agregador de logs

## 🚀 Escalabilidade

### Horizontal Scaling
- **Load Balancer**: Distribuição de carga
- **Microservices**: Separação por módulo
- **Database Sharding**: Particionamento de dados

### Vertical Scaling
- **Resource Allocation**: CPU/Memory dinâmica
- **Auto-scaling**: Baseado em demanda
- **Performance Tuning**: Otimização contínua

---

**CoopSystem** - Arquitetura Limpa e Modular  
Versão: 2.0.0  
Framework: .NET 8.0 + React 18  
Padrão: Clean Architecture + DDD
