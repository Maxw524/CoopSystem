// Estado global da aplicação
let currentUser = null;
let authToken = null;

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const userInfo = document.getElementById('user-info');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já existe um token salvo
    const savedToken = localStorage.getItem('coopSystem_token');
    const savedUser = localStorage.getItem('coopSystem_user');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
    }
    
    // Configurar evento de login
    loginForm.addEventListener('submit', handleLogin);
});

// Função de login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Limpar mensagens
    hideMessage(errorMessage);
    hideMessage(successMessage);
    
    try {
        const response = await fetch('/api/usuario/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login sucesso
            authToken = data.token;
            currentUser = {
                username: data.user,
                roles: data.roles
            };
            
            // Salvar no localStorage
            localStorage.setItem('coopSystem_token', authToken);
            localStorage.setItem('coopSystem_user', JSON.stringify(currentUser));
            
            showSuccessMessage('Login realizado com sucesso!');
            
            // Redirecionar para o app após 1 segundo
            setTimeout(() => {
                showApp();
            }, 1000);
            
        } else {
            // Erro de login
            showErrorMessage(data.message || 'Erro ao fazer login');
        }
        
    } catch (error) {
        console.error('Erro de login:', error);
        showErrorMessage('Erro de conexão. Tente novamente.');
    }
}

// Mostrar aplicação principal
function showApp() {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Atualizar informações do usuário
    if (currentUser) {
        userInfo.textContent = `${currentUser.username} (${currentUser.roles.join(', ')})`;
        
        // Mostrar menus baseado nos papéis
        updateMenuVisibility();
        
        // Carregar informações dos módulos
        loadModulesInfo();
    }
}

// Atualizar visibilidade do menu baseado nos papéis
function updateMenuVisibility() {
    if (!currentUser || !currentUser.roles) return;
    
    const roles = currentUser.roles;
    
    // Menu Jurídico - visível para Admin e Juridico
    const juridicoMenu = document.getElementById('juridico-menu');
    if (roles.includes('Admin') || roles.includes('Juridico')) {
        juridicoMenu.classList.remove('hidden');
    }
    
    // Menu Crédito - visível para Admin e Credito I
    const creditoMenu = document.getElementById('credito-menu');
    if (roles.includes('Admin') || roles.includes('Credito I')) {
        creditoMenu.classList.remove('hidden');
    }
    
    // Menu Admin - visível apenas para Admin
    const adminMenu = document.getElementById('admin-menu');
    if (roles.includes('Admin')) {
        adminMenu.classList.remove('hidden');
    }
}

// Carregar informações dos módulos
async function loadModulesInfo() {
    try {
        const response = await fetch('/api/modules/info', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const modules = await response.json();
            displayModulesInfo(modules);
        } else {
            document.getElementById('modules-info').innerHTML = 
                '<p>Não foi possível carregar informações dos módulos.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar módulos:', error);
        document.getElementById('modules-info').innerHTML = 
            '<p>Erro ao carregar informações dos módulos.</p>';
    }
}

// Exibir informações dos módulos
function displayModulesInfo(modules) {
    const modulesInfo = document.getElementById('modules-info');
    
    if (!modules || modules.length === 0) {
        modulesInfo.innerHTML = '<p>Nenhum módulo encontrado.</p>';
        return;
    }
    
    let html = '<div class="modules-grid">';
    
    modules.forEach(module => {
        html += `
            <div class="module-card">
                <h4>${module.name}</h4>
                <p>${module.description}</p>
                <div class="module-status ${module.enabled ? 'enabled' : 'disabled'}">
                    ${module.enabled ? '✓ Ativo' : '✗ Inativo'}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    modulesInfo.innerHTML = html;
}

// Navegação entre páginas
function navigateTo(page) {
    // Se for página de renegociação, redireciona para o frontend real do Recoopera
    if (page === 'renegociacao') {
        window.location.href = '/recoopera/';
        return;
    }
    
    // Esconder todas as páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));
    
    // Mostrar a página selecionada
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Atualizar menu ativo
    updateActiveMenu(page);
    
    // Carregar conteúdo específico da página
    loadPageContent(page);
}

// Atualizar menu ativo
function updateActiveMenu(activePage) {
    const menuLinks = document.querySelectorAll('.app-sidebar-menu a');
    menuLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Encontrar e ativar o link correspondente
    const activeLink = document.querySelector(`[onclick="navigateTo('${activePage}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Carregar conteúdo específico da página
async function loadPageContent(page) {
    switch(page) {
        case 'renegociacao':
            await loadRenegociacaoContent();
            break;
        case 'admin-usuarios':
            await loadAdminUsersContent();
            break;
        case 'admin-taxas':
            await loadAdminTaxasContent();
            break;
        // Adicionar outros casos conforme necessário
    }
}

// Carregar conteúdo da página de renegociação
async function loadRenegociacaoContent() {
    const pageContent = document.querySelector('#renegociacao-page .card');
    
    try {
        const response = await fetch('/api/modules/recoopera/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            pageContent.innerHTML = `
                <h2 class="card-title">Recoopera - Renegociação</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.totalPropostas || 0}</div>
                        <div class="stat-label">Total de Propostas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.propostasAprovadas || 0}</div>
                        <div class="stat-label">Propostas Aprovadas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.valorTotal || 'R$ 0,00'}</div>
                        <div class="stat-label">Valor Total</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button class="rn-button primary" onclick="createNewProposta()">
                        Nova Proposta
                    </button>
                    <button class="rn-button" onclick="viewPropostas()">
                        Ver Propostas
                    </button>
                    <button class="rn-button" onclick="generateReports()">
                        Gerar Relatórios
                    </button>
                </div>
            `;
        } else {
            // Conteúdo padrão se a API não responder
            pageContent.innerHTML = `
                <h2 class="card-title">Recoopera - Renegociação</h2>
                <p>Módulo de renegociação de dívidas</p>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">-</div>
                        <div class="stat-label">Total de Propostas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">-</div>
                        <div class="stat-label">Propostas Aprovadas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">-</div>
                        <div class="stat-label">Valor Total</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button class="rn-button primary" onclick="createNewProposta()">
                        Nova Proposta
                    </button>
                    <button class="rn-button" onclick="viewPropostas()">
                        Ver Propostas
                    </button>
                    <button class="rn-button" onclick="generateReports()">
                        Gerar Relatórios
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
        // Conteúdo padrão em caso de erro
        pageContent.innerHTML = `
            <h2 class="card-title">Recoopera - Renegociação</h2>
            <p>Módulo de renegociação de dívidas</p>
            <div style="margin-top: 20px;">
                <button class="rn-button primary" onclick="createNewProposta()">
                    Nova Proposta
                </button>
                <button class="rn-button" onclick="viewPropostas()">
                    Ver Propostas
                </button>
                <button class="rn-button" onclick="generateReports()">
                    Gerar Relatórios
                </button>
            </div>
        `;
    }
}

// Carregar conteúdo da página de admin usuários
async function loadAdminUsersContent() {
    const pageContent = document.querySelector('#admin-usuarios-page .card');
    
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsersList(users, pageContent);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        pageContent.innerHTML = '<p>Erro ao carregar usuários.</p>';
    }
}

// Exibir lista de usuários
function displayUsersList(users, container) {
    let html = `
        <h2 class="card-title">Administração de Usuários</h2>
        <div class="users-table">
            <table>
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Papéis</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.username}</td>
                <td>${Array.isArray(user.roles) ? user.roles.join(', ') : 'Operador'}</td>
                <td>
                    <button class="rn-button" onclick="editUser('${user.id}')">Editar</button>
                    <button class="rn-button warn" onclick="deleteUser('${user.id}')">Excluir</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <button class="rn-button primary" onclick="openNewUser()">
            Novo Usuário
        </button>
    `;
    
    container.innerHTML = html;
}

// Carregar conteúdo da página de admin taxas
async function loadAdminTaxasContent() {
    const pageContent = document.querySelector('#admin-taxas-page .card');
    
    try {
        // Simulação de taxas já que não temos endpoint específico ainda
        const taxas = [
            {
                id: '1',
                campanha: 'Recupera 2024',
                taxa: 1.5,
                vigencia: '01/01/2024 - 31/12/2024'
            },
            {
                id: '2',
                campanha: 'Negociação Direta',
                taxa: 1.2,
                vigencia: '01/06/2024 - 30/06/2024'
            }
        ];
        
        displayTaxasList(taxas, pageContent);
    } catch (error) {
        console.error('Erro ao carregar taxas:', error);
        pageContent.innerHTML = '<p>Erro ao carregar taxas.</p>';
    }
}

// Exibir lista de taxas
function displayTaxasList(taxas, container) {
    let html = `
        <h2 class="card-title">Administração de Taxas</h2>
        <div class="taxas-table">
            <table>
                <thead>
                    <tr>
                        <th>Campanha</th>
                        <th>Taxa</th>
                        <th>Vigência</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    taxas.forEach(taxa => {
        html += `
            <tr>
                <td>${taxa.campanha}</td>
                <td>${taxa.taxa}%</td>
                <td>${taxa.vigencia}</td>
                <td>
                    <button class="rn-button" onclick="editTaxa('${taxa.id}')">Editar</button>
                    <button class="rn-button warn" onclick="deleteTaxa('${taxa.id}')">Excluir</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <button class="rn-button primary" onclick="openNewTaxa()">
            Nova Taxa
        </button>
    `;
    
    container.innerHTML = html;
}

// Funções de utilidade
function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function showSuccessMessage(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
}

function hideMessage(element) {
    element.classList.add('hidden');
}

// Logout
function logout() {
    // Limpar dados
    currentUser = null;
    authToken = null;
    
    // Limpar localStorage
    localStorage.removeItem('coopSystem_token');
    localStorage.removeItem('coopSystem_user');
    
    // Mostrar tela de login
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    // Limpar formulário
    loginForm.reset();
    hideMessage(errorMessage);
    hideMessage(successMessage);
}

// Funções placeholder para ações futuras
function createNewProposta() {
    alert('Funcionalidade de nova proposta em desenvolvimento');
}

function viewPropostas() {
    alert('Funcionalidade de visualizar propostas em desenvolvimento');
}

function generateReports() {
    alert('Funcionalidade de gerar relatórios em desenvolvimento');
}

function openNewProposta() {
    alert('Funcionalidade de nova proposta em desenvolvimento');
}

function openNewUser() {
    alert('Funcionalidade de novo usuário em desenvolvimento');
}

function openNewTaxa() {
    alert('Funcionalidade de nova taxa em desenvolvimento');
}

function editUser(userId) {
    alert(`Editar usuário ${userId} - funcionalidade em desenvolvimento`);
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        alert(`Excluir usuário ${userId} - funcionalidade em desenvolvimento`);
    }
}

function editTaxa(taxaId) {
    alert(`Editar taxa ${taxaId} - funcionalidade em desenvolvimento`);
}

function deleteTaxa(taxaId) {
    if (confirm('Tem certeza que deseja excluir esta taxa?')) {
        alert(`Excluir taxa ${taxaId} - funcionalidade em desenvolvimento`);
    }
}

// Adicionar estilos adicionais dinamicamente
const additionalStyles = `
    .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .module-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--color-border-card);
        border-radius: var(--radius-md);
        padding: 1rem;
    }
    
    .module-card h4 {
        margin-bottom: 0.5rem;
        color: var(--color-text-main);
    }
    
    .module-card p {
        font-size: 0.9rem;
        color: var(--color-text-label);
        margin-bottom: 0.5rem;
    }
    
    .module-status {
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .module-status.enabled {
        color: #22c55e;
    }
    
    .module-status.disabled {
        color: #ef4444;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .stat-item {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-md);
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-primary);
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: var(--color-text-label);
        margin-top: 0.25rem;
    }
    
    .users-table, .taxas-table {
        margin: 1rem 0;
        overflow-x: auto;
    }
    
    .users-table table, .taxas-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .users-table th, .taxas-table th {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border-card);
    }
    
    .users-table td, .taxas-table td {
        padding: 0.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .users-table tr:hover, .taxas-table tr:hover {
        background: rgba(255, 255, 255, 0.02);
    }
`;

// Adicionar estilos ao head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
