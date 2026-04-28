using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface IIndicadorService
    {
        // Categorias
        Task<IEnumerable<CategoriaIndicadorDto>> GetAllCategoriasAsync();
        Task<CategoriaIndicadorDto?> GetCategoriaByIdAsync(int id);
        Task<CategoriaIndicadorDto> CreateCategoriaAsync(CreateCategoriaIndicadorDto dto);
        Task<CategoriaIndicadorDto?> UpdateCategoriaAsync(int id, UpdateCategoriaIndicadorDto dto);
        Task<bool> DeleteCategoriaAsync(int id);
        
        // Indicadores
        Task<IEnumerable<IndicadorDto>> GetAllIndicadoresAsync();
        Task<IndicadorDto?> GetIndicadorByIdAsync(int id);
        Task<IndicadorDto> CreateIndicadorAsync(CreateIndicadorDto dto);
        Task<IndicadorDto?> UpdateIndicadorAsync(int id, UpdateIndicadorDto dto);
        Task<bool> DeleteIndicadorAsync(int id);
        
        // Resultados
        Task<ResultadoMensalDto> CreateResultadoAsync(CreateResultadoMensalDto dto);
        Task<ResultadoMensalDto> UpdateResultadoAsync(CreateResultadoMensalDto dto);
        Task<IEnumerable<ResultadoMensalDto>> GetResultadosByIndicadorAsync(int indicadorId);
        Task<bool> DeleteResultadoAsync(int id);
        
        // Subcategorias
        Task<IEnumerable<SubcategoriaIndicadorDto>> GetAllSubcategoriasAsync();
        Task<SubcategoriaIndicadorDto?> GetSubcategoriaByIdAsync(int id);
        Task<SubcategoriaIndicadorDto> CreateSubcategoriaAsync(CreateSubcategoriaIndicadorDto dto);
        Task<SubcategoriaIndicadorDto?> UpdateSubcategoriaAsync(int id, UpdateSubcategoriaIndicadorDto dto);
        Task<bool> DeleteSubcategoriaAsync(int id);
        Task<bool> VincularIndicadorSubcategoriasAsync(int indicadorId, List<int> subcategoriaIds);
        Task<bool> DesvincularIndicadorSubcategoriaAsync(int indicadorId, int subcategoriaId);
        
        // Dashboard
        Task<IEnumerable<DashboardIndicadorDto>> GetDashboardAsync();
        Task<IndicadorDto?> GetIndicadorComResultadosAsync(int id, int ano, int mes);
    }
}
