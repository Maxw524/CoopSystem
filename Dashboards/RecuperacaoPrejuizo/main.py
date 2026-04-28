from __future__ import annotations
 
import json
import re
import unicodedata
import requests
from pathlib import Path
from typing import Callable
 
import streamlit as st
 
 
# =========================================================
# CONFIGURAÇÕES GERAIS
# =========================================================
BASE_DIR = Path(__file__).resolve().parent
PAGES_DIR = BASE_DIR / "pages"
 
st.set_page_config(
    page_title="Portal de Aplicações",
    page_icon="logo.png",
    layout="wide",
    initial_sidebar_state="expanded",
)
 
 
# =========================================================
# UTILITÁRIOS
# =========================================================
def slugify(text: str) -> str:
    """
    Converte texto em slug amigável para URL.
    Ex.: 'Gestão de Lançamentos' -> 'gestao_de_lancamentos'
    """
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text
 
 
def prettify_name(name: str) -> str:
    """
    Converte nome técnico para nome visual.
    Ex.: 'ranking_inad90' -> 'Ranking Inad90'
    """
    return name.replace("_", " ").strip().title()
 
 
def load_json(file_path: Path) -> dict:
    """
    Lê um JSON com segurança.
    """
    if not file_path.exists():
        return {}
 
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except Exception:
        return {}
 
 
def list_py_files(folder: Path) -> list[Path]:
    """
    Lista arquivos .py da pasta, ignorando arquivos iniciados por '_'.
    """
    return sorted(
        [
            file
            for file in folder.iterdir()
            if file.is_file()
            and file.suffix == ".py"
            and not file.name.startswith("_")
        ]
    )
 
 
def list_subfolders(folder: Path) -> list[Path]:
    """
    Lista subpastas válidas.
    """
    return sorted(
        [
            sub
            for sub in folder.iterdir()
            if sub.is_dir() and not sub.name.startswith(".")
        ]
    )
 
 
def get_user_info() -> dict:
    """
    Obtém dados do usuário atual via API do CoopSystem.
    Retorna dict com setor, nomeCompleto e roles.
    """
    try:
        token = None
 
        # 1. Tentar obter token da query string (iframe via URL)
        try:
            query_params = st.query_params
            token = query_params.get("token")
            if token:
                token = token[0] if isinstance(token, list) else token
        except Exception:
            pass
 
        # 2. Tentar obter token do header Authorization (via proxy reverso)
        if not token:
            try:
                request_headers = st.context.headers
                auth_header = request_headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header[7:]
            except Exception:
                pass
 
        if not token:
            return {
                "setor": "Não identificado",
                "nomeCompleto": "Visitante",
                "roles": ["user"]
            }
 
        # Chamar API do CoopSystem para obter dados do usuário
        api_url = "https://localhost:5000/api/Usuario/setor"
        headers = {"Authorization": f"Bearer {token}"}
 
        response = requests.get(api_url, headers=headers, verify=False, timeout=5)
 
        if response.status_code == 200:
            user_data = response.json()
 
            # Extrair informações básicas
            setor = user_data.get("setor", "") or "Não definido"
            nome = user_data.get("nomeCompleto", "") or "Usuário"
 
            # Extrair roles baseado nas permissões do usuário
            roles = ["user"]  # Role padrão
 
            # Verificar se é admin
            if user_data.get("admin", False):
                roles.append("admin")
 
            # Adicionar roles específicas baseadas em permissões
            if user_data.get("permiteSistrawts", False):
                roles.append("sistrawts")
 
            if user_data.get("permiteJuridico", False):
                roles.append("juridico")
 
            if user_data.get("permiteSimuladorTaxa", False):
                roles.append("simulador")
 
            return {
                "setor": setor,
                "nomeCompleto": nome,
                "roles": roles
            }
        else:
            # Se falhar API, retorna dados básicos
            return {
                "setor": f"Erro API ({response.status_code})",
                "nomeCompleto": "Usuário",
                "roles": ["user"]
            }
 
    except Exception as e:
        # Em caso de erro, retorna dados básicos
        return {
            "setor": f"Erro: {str(e)}",
            "nomeCompleto": "Usuário",
            "roles": ["user"]
        }
 
 
def get_user_roles() -> list[str]:
    try:
        token = None
 
        # 1. Tentar obter token da query string (iframe via URL)
        try:
            query_params = st.query_params
            token = query_params.get("token")
            if token:
                token = token[0] if isinstance(token, list) else token
        except Exception:
            pass
 
        # 2. Tentar obter token do header Authorization (via proxy reverso)
        if not token:
            try:
                request_headers = st.context.headers
                auth_header = request_headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header[7:]
            except Exception:
                pass
 
        if not token:
            st.error("⚠️ Autenticação necessária")
            st.info(
                "Por favor, acesse o dashboard através do CoopSystem "
                "para autenticação automática."
            )
            return []
 
        # 🌐 Chamada à API do CoopSystem
        api_url = "https://localhost:5000/api/Usuario/setor"
        headers = {"Authorization": f"Bearer {token}"}
 
        response = requests.get(
            api_url,
            headers=headers,
            verify=False,
            timeout=5
        )
 
        if response.status_code != 200:
            st.error(f"❌ Erro na autenticação: {response.status_code}")
            return []
 
        data = response.json()
 
        # ✅ Retornar SOMENTE o setor
        setor = data.get("setor")
 
        # Garante sempre list[str]
        if setor:
            return [setor]
 
        return []
 
    except Exception as e:
        st.error(f"❌ Erro ao obter dados do usuário: {e}")
        return []
 
 
def has_access(required_roles: list[str] | None, user_roles: list[str]) -> bool:
    """
    Valida se o usuário possui alguma das roles necessárias.
    """
    if not required_roles:
        return True
    return any(role in user_roles for role in required_roles)
 
 
def make_placeholder_page(title: str, folder: Path, route_key: str) -> Callable[[], None]:
    """
    Cria uma página placeholder para pastas sem arquivo principal.
    """
 
    def _page():
        st.title(title)
        st.info(f"Esta rota foi criada automaticamente para a pasta: {folder}")
        st.write(f"Rota técnica: `{route_key}`")
 
        py_files = list_py_files(folder)
        subfolders = list_subfolders(folder)
 
        if py_files:
            st.markdown("### Arquivos Python encontrados")
            for file in py_files:
                st.write(f"- {file.name}")
 
        if subfolders:
            st.markdown("### Subpastas encontradas")
            for sub in subfolders:
                st.write(f"- {sub.name}")
 
        if not py_files and not subfolders:
            st.warning("A pasta existe, mas ainda não possui arquivos nem subpastas válidas.")
 
    return _page
 
 
def get_folder_landing_file(folder: Path, route_config: dict) -> Path | None:
    """
    Define o arquivo principal (landing page) da pasta.
 
    Prioridade:
    1. landing no _route.json
    2. index.py
    3. primeiro .py encontrado
    """
    landing_name = route_config.get("landing")
    if landing_name:
        landing_path = folder / landing_name
        if landing_path.exists():
            return landing_path
 
    index_path = folder / "index.py"
    if index_path.exists():
        return index_path
 
    py_files = list_py_files(folder)
    return py_files[0] if py_files else None
 
 
def build_route_key(parts: list[str]) -> str:
    """
    Gera a chave técnica da rota com '__'.
    Ex.: ['ranking_inad90', 'teste', 'detalhes']
    -> ranking_inad90__teste__detalhes
    """
    return "__".join(slugify(part) for part in parts if part.strip())
 
 
# =========================================================
# PÁGINA INICIAL
# =========================================================
def home():
    st.title("Portal de Aplicações")
    st.write("Bem-vindo ao portal.")
 
    st.markdown("## Como funciona")
    st.markdown(
        """
        - Cada **pasta de primeiro nível** dentro de `pages/` vira uma **rota principal**.
        - Cada **subpasta** vira uma **subrota automática**.
        - Cada **arquivo `.py`** dentro de uma pasta vira uma **página/subrota**.
        - Se uma pasta não tiver `index.py`, o sistema tenta usar outro `.py`.
        - Se não houver arquivo principal, uma página placeholder é criada.
        """
    )
 
    st.markdown("## Dados do Usuário")
    user_info = get_user_info()
   
    col1, col2, col3 = st.columns(3)
   
    with col1:
        st.info(f"👤 **Nome:** {user_info['nomeCompleto']}")
   
    with col2:
        st.info(f"🏢 **Setor:** {user_info['setor']}")
   
    with col3:
        st.info(f"🔑 **Permissões:** {', '.join(user_info['roles'])}")
 
 
# =========================================================
# DESCOBERTA RECURSIVA DAS PÁGINAS
# =========================================================
def discover_pages_in_folder(
    folder: Path,
    root_parts: list[str],
    user_roles: list[str],
) -> list:
    """
    Descobre recursivamente páginas de uma pasta e suas subpastas.
 
    root_parts:
        caminho lógico da rota, ex. ['ranking_inad90', 'teste']
    """
    pages = []
 
    route_config = load_json(folder / "_route.json")
 
    folder_title = route_config.get("title") or prettify_name(folder.name)
    folder_icon = route_config.get("icon", "📁")
    folder_roles = route_config.get("roles", [])
    folder_visibility = route_config.get("visibility", "visible")
    show_children = route_config.get("show_children", True)
 
    if not has_access(folder_roles, user_roles):
        return pages
 
    route_key = build_route_key(root_parts)
 
    landing_file = get_folder_landing_file(folder, route_config)
 
    # -----------------------------------------------------
    # Página principal da pasta
    # -----------------------------------------------------
    if landing_file:
        pages.append(
            st.Page(
                landing_file,
                title=folder_title,
                icon=folder_icon,
                url_path=route_key,
                visibility=folder_visibility,
            )
        )
    else:
        pages.append(
            st.Page(
                make_placeholder_page(folder_title, folder, route_key),
                title=folder_title,
                icon=folder_icon,
                url_path=route_key,
                visibility=folder_visibility,
            )
        )
 
    # -----------------------------------------------------
    # Arquivos .py da pasta (exceto landing)
    # -----------------------------------------------------
    if show_children:
        children_cfg = route_config.get("children", {})
        py_files = list_py_files(folder)
 
        for file in py_files:
            if landing_file and file == landing_file:
                continue
 
            file_cfg = children_cfg.get(file.name, {})
            file_roles = file_cfg.get("roles", folder_roles)
 
            if not has_access(file_roles, user_roles):
                continue
 
            child_title = file_cfg.get("title") or prettify_name(file.stem)
            child_icon = file_cfg.get("icon", "📄")
            child_visibility = file_cfg.get("visibility", "visible")
            child_url_path = file_cfg.get(
                "url_path",
                build_route_key(root_parts + [file.stem]),
            )
 
            pages.append(
                st.Page(
                    file,
                    title=child_title,
                    icon=child_icon,
                    url_path=child_url_path,
                    visibility=child_visibility,
                )
            )
 
    # -----------------------------------------------------
    # Subpastas -> subrotas automáticas
    # -----------------------------------------------------
    subfolders = list_subfolders(folder)
 
    for subfolder in subfolders:
        if subfolder.name.startswith("_"):
            continue
 
        pages.extend(
            discover_pages_in_folder(
                folder=subfolder,
                root_parts=root_parts + [subfolder.name],
                user_roles=user_roles,
            )
        )
 
    return pages
 
 
# =========================================================
# CONSTRUÇÃO DA NAVEGAÇÃO
# =========================================================
def build_navigation() -> dict[str, list]:
    """
    Monta o st.navigation com:
    - Home
    - Uma seção para cada pasta de primeiro nível em pages/
    - Páginas e subrotas descobertas recursivamente
    """
    user_roles = get_user_roles()
 
    nav: dict[str, list] = {
        "Início": [
            st.Page(
                home,
                title="Início",
                icon="🏠",
                default=True,
            )
        ]
    }
 
    if not PAGES_DIR.exists():
        return nav
 
    top_level_folders = sorted([folder for folder in PAGES_DIR.iterdir() if folder.is_dir()])
 
    for folder in top_level_folders:
        route_config = load_json(folder / "_route.json")
 
        section_label = route_config.get("section_label") or route_config.get("title") or prettify_name(folder.name)
        section_roles = route_config.get("roles", [])
 
        if not has_access(section_roles, user_roles):
            continue
 
        section_pages = discover_pages_in_folder(
            folder=folder,
            root_parts=[folder.name],
            user_roles=user_roles,
        )
 
        if section_pages:
            nav[section_label] = section_pages
 
    return nav
 
 
# =========================================================
# EXECUÇÃO
# =========================================================
pages = build_navigation()
 
pg = st.navigation(
    pages,
    position="sidebar",
    expanded=True,
)
 
pg.run()