# Dashboards dinamicos

Esta base permite cadastrar dashboards Python sem criar rota nova no React e sem republicar o frontend a cada inclusao.

## O que foi implementado

- Catalogo dinamico no backend em `api/dashboards`, lendo manifests `dashboard.json` dentro da pasta `Dashboards`.
- Permissoes extras por usuario, persistidas no mesmo cadastro ja usado no login.
- Tela `Admin Usuarios` com selecao de dashboards por usuario.
- Menu lateral e paginas genericas no React para listar e abrir dashboards por `slug`.
- Busca robusta da pasta `Dashboards` mesmo quando a API roda de `bin` ou da pasta `publish`.
- Suporte opcional a auto-start de dashboards Python/Streamlit no startup da API.

## Como adicionar um novo dashboard

1. Coloque a pasta do dashboard dentro da raiz configurada de dashboards.
2. Crie um arquivo `dashboard.json` dentro da pasta.
3. Suba o dashboard Python em uma porta interna ou URL acessivel pelo navegador.
4. Informe a `embedUrl` no manifesto.
5. Libere a permissao do dashboard para os usuarios na tela `Admin Usuarios`.

Depois disso, o catalogo passa a enxergar o novo dashboard sem alterar o codigo do front.

## Manifesto minimo

```json
{
  "slug": "recuperacao-prejuizo",
  "title": "Recuperacao de Prejuizo",
  "description": "Catalogo do dashboard Python de recuperacao de prejuizo.",
  "group": "Dashboards Python",
  "permissionKey": "dashboard:recuperacao-prejuizo",
  "embedUrl": "{SCHEME}://{HOST}:8501",
  "icon": "line-chart",
  "order": 10,
  "enabled": true,
  "autoStart": true,
  "scriptPath": "Ranking Inad90.py",
  "port": 8501,
  "pythonExecutable": "python"
}
```

## Estrutura esperada

Por padrao o backend procura a pasta `Dashboards` nestes locais, nesta ordem:

1. Caminho configurado em `Dashboards:RootPath`
2. `Dashboards` dentro do content root da API
3. `Dashboards` ao lado da aplicacao publicada
4. `../../Dashboards` a partir do projeto da API

Se quiser fixar a pasta em producao, configure:

```json
"Dashboards": {
  "RootPath": "C:\\CoopSystem\\Dashboards",
  "PythonExecutable": "python"
}
```

## Exemplo de subida do Streamlit

```powershell
streamlit run "C:\CoopSystem\Dashboards\RecuperacaoPrejuizo\Ranking Inad90.py" --server.port 8501
```

## Auto-start junto com a API

Se `enabled=true` e `autoStart=true`, a API tenta iniciar o dashboard no startup usando:

```powershell
python -m streamlit run "<scriptPath>" --server.port <port> --server.address 0.0.0.0 --server.headless true
```

Para isso funcionar, a maquina precisa ter pelo menos:

```powershell
pip install streamlit pandas plotly openpyxl
```

## Observacoes de operacao

- O React so faz o iframe generico; quem executa o dashboard continua sendo o processo Python.
- A `embedUrl` precisa ser acessivel pelo navegador do usuario. `127.0.0.1` so funciona se o browser estiver na mesma maquina do Streamlit.
- O placeholder `{HOST}` e resolvido pela API com o host atual da requisicao, o que facilita usar a mesma configuracao em dev e producao.
- Para ambiente corporativo, o ideal e publicar o Streamlit em rede interna ou atras de proxy/reverse proxy.
- O acesso de usuario ao catalogo e ao detalhe do dashboard passa pela API autenticada do CoopSystem.
- Se voce quiser bloquear tambem o acesso direto ao endereco bruto do Streamlit, o ideal e proteger essa URL no proxy/rede. A permissao implementada aqui controla o acesso pelo CoopSystem.
