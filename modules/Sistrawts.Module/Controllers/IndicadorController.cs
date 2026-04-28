using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Services;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class IndicadorController : ControllerBase
    {
        private readonly IIndicadorService _indicadorService;
        private readonly SistrawtsDbContext _context;

        public IndicadorController(IIndicadorService indicadorService, SistrawtsDbContext context)
        {
            _indicadorService = indicadorService;
            _context = context;
        }

        // Categorias
        [HttpGet("categorias")]
        public async Task<ActionResult<IEnumerable<CategoriaIndicadorDto>>> GetAllCategorias()
        {
            try
            {
                var categorias = await _indicadorService.GetAllCategoriasAsync();
                return Ok(categorias);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("categorias/{id}")]
        public async Task<ActionResult<CategoriaIndicadorDto>> GetCategoriaById(int id)
        {
            try
            {
                var categoria = await _indicadorService.GetCategoriaByIdAsync(id);
                if (categoria == null)
                    return NotFound();

                return Ok(categoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("categorias")]
        public async Task<ActionResult<CategoriaIndicadorDto>> CreateCategoria([FromBody] CreateCategoriaIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem cadastrar categorias");

                var categoria = await _indicadorService.CreateCategoriaAsync(dto);
                return CreatedAtAction(nameof(GetCategoriaById), new { id = categoria.Id }, categoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("categorias/{id}")]
        public async Task<ActionResult<CategoriaIndicadorDto>> UpdateCategoria(int id, [FromBody] UpdateCategoriaIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem atualizar categorias");

                var categoria = await _indicadorService.UpdateCategoriaAsync(id, dto);
                if (categoria == null)
                    return NotFound();

                return Ok(categoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("categorias/{id}")]
        public async Task<ActionResult> DeleteCategoria(int id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem excluir categorias");

                var result = await _indicadorService.DeleteCategoriaAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Indicadores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IndicadorDto>>> GetAllIndicadores()
        {
            try
            {
                var indicadores = await _indicadorService.GetAllIndicadoresAsync();
                return Ok(indicadores);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IndicadorDto>> GetIndicadorById(int id)
        {
            try
            {
                var indicador = await _indicadorService.GetIndicadorByIdAsync(id);
                if (indicador == null)
                    return NotFound();

                return Ok(indicador);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<IndicadorDto>> CreateIndicador([FromBody] CreateIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem cadastrar indicadores");

                var indicador = await _indicadorService.CreateIndicadorAsync(dto);
                return CreatedAtAction(nameof(GetIndicadorById), new { id = indicador.Id }, indicador);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<IndicadorDto>> UpdateIndicador(int id, [FromBody] UpdateIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem atualizar indicadores");

                var indicador = await _indicadorService.UpdateIndicadorAsync(id, dto);
                if (indicador == null)
                    return NotFound();

                return Ok(indicador);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteIndicador(int id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem excluir indicadores");

                var result = await _indicadorService.DeleteIndicadorAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Resultados
        [HttpPost("{indicadorId}/resultados")]
        public async Task<ActionResult<ResultadoMensalDto>> CreateResultado(int indicadorId, [FromBody] CreateResultadoMensalDto dto)
        {
            try
            {
                dto.IndicadorId = indicadorId;
                var resultado = await _indicadorService.CreateResultadoAsync(dto);
                return CreatedAtAction(nameof(GetResultadosByIndicador), new { indicadorId }, resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{indicadorId}/resultados")]
        public async Task<ActionResult<ResultadoMensalDto>> UpdateResultado(int indicadorId, [FromBody] CreateResultadoMensalDto dto)
        {
            try
            {
                dto.IndicadorId = indicadorId;
                var resultado = await _indicadorService.UpdateResultadoAsync(dto);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{indicadorId}/resultados")]
        public async Task<ActionResult<IEnumerable<ResultadoMensalDto>>> GetResultadosByIndicador(int indicadorId)
        {
            try
            {
                var resultados = await _indicadorService.GetResultadosByIndicadorAsync(indicadorId);
                return Ok(resultados);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("resultados/{id}")]
        public async Task<ActionResult> DeleteResultado(int id)
        {
            try
            {
                var result = await _indicadorService.DeleteResultadoAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Subcategorias
        [HttpGet("subcategorias")]
        public async Task<ActionResult<IEnumerable<SubcategoriaIndicadorDto>>> GetAllSubcategorias()
        {
            try
            {
                var subcategorias = await _indicadorService.GetAllSubcategoriasAsync();
                return Ok(subcategorias);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("subcategorias/{id}")]
        public async Task<ActionResult<SubcategoriaIndicadorDto>> GetSubcategoriaById(int id)
        {
            try
            {
                var subcategoria = await _indicadorService.GetSubcategoriaByIdAsync(id);
                if (subcategoria == null)
                    return NotFound();

                return Ok(subcategoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("subcategorias")]
        public async Task<ActionResult<SubcategoriaIndicadorDto>> CreateSubcategoria([FromBody] CreateSubcategoriaIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem cadastrar subcategorias");

                var subcategoria = await _indicadorService.CreateSubcategoriaAsync(dto);
                return CreatedAtAction(nameof(GetSubcategoriaById), new { id = subcategoria.Id }, subcategoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("subcategorias/{id}")]
        public async Task<ActionResult<SubcategoriaIndicadorDto>> UpdateSubcategoria(int id, [FromBody] UpdateSubcategoriaIndicadorDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem atualizar subcategorias");

                var subcategoria = await _indicadorService.UpdateSubcategoriaAsync(id, dto);
                if (subcategoria == null)
                    return NotFound();

                return Ok(subcategoria);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("subcategorias/{id}")]
        public async Task<ActionResult> DeleteSubcategoria(int id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var usuario = await GetUserById(userId);
                if (usuario == null || !usuario.Admin)
                    return Unauthorized("Apenas administradores podem excluir subcategorias");

                var result = await _indicadorService.DeleteSubcategoriaAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{indicadorId}/subcategorias")]
        public async Task<ActionResult> VincularIndicadorSubcategorias(int indicadorId, [FromBody] CreateIndicadorSubcategoriaDto dto)
        {
            try
            {
                dto.IndicadorId = indicadorId;
                var result = await _indicadorService.VincularIndicadorSubcategoriasAsync(dto.IndicadorId, dto.SubcategoriaIds);
                if (!result)
                    return BadRequest("Não foi possível vincular as subcategorias");

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{indicadorId}/subcategorias/{subcategoriaId}")]
        public async Task<ActionResult> DesvincularIndicadorSubcategoria(int indicadorId, int subcategoriaId)
        {
            try
            {
                var result = await _indicadorService.DesvincularIndicadorSubcategoriaAsync(indicadorId, subcategoriaId);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<IEnumerable<DashboardIndicadorDto>>> GetDashboard()
        {
            try
            {
                var dashboard = await _indicadorService.GetDashboardAsync();
                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<Usuario?> GetUserById(Guid userId)
        {
            return await _context.Usuarios.FindAsync(userId);
        }
    }
}
