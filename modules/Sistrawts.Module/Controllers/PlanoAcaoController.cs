using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Services;

namespace Sistrawts.Module.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanoAcaoController : ControllerBase
    {
        private readonly IPlanoAcaoService _planoAcaoService;

        public PlanoAcaoController(IPlanoAcaoService planoAcaoService)
        {
            _planoAcaoService = planoAcaoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlanoAcaoDto>>> GetAll()
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var planos = await _planoAcaoService.GetAllAsync(userId);
                return Ok(planos);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PlanoAcaoDto>> GetById(Guid id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var plano = await _planoAcaoService.GetByIdAsync(id, userId);
                if (plano == null)
                    return NotFound();

                return Ok(plano);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<PlanoAcaoDto>> Create([FromBody] CreatePlanoAcaoDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var plano = await _planoAcaoService.CreateAsync(dto, userId);

                // Enviar e-mail para o responsável
                return CreatedAtAction(nameof(GetById), new { id = plano.Id }, plano);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PlanoAcaoDto>> Update(Guid id, [FromBody] UpdatePlanoAcaoDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var plano = await _planoAcaoService.UpdateAsync(id, dto, userId);
                
                if (plano == null)
                    return NotFound();

                return Ok(plano);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var result = await _planoAcaoService.DeleteAsync(id, userId);
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("responsavel/{responsavelId:guid}")]
        public async Task<ActionResult<IEnumerable<PlanoAcaoDto>>> GetByResponsavel(Guid responsavelId)
        {
            var planos = await _planoAcaoService.GetByResponsavelIdAsync(responsavelId);
            return Ok(planos);
        }

        [HttpPut("{id}/trativa")]
        public async Task<ActionResult> AtualizarTrativa(Guid id, [FromBody] string trativa)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var result = await _planoAcaoService.AtualizarTrativaAsync(id, trativa, userId);
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{id}/relatorio")]
        public async Task<ActionResult> AtualizarRelatorio(Guid id, [FromBody] string relatorio)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var result = await _planoAcaoService.AtualizarRelatorioAsync(id, relatorio, userId);
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("{id}/relatorio/pdf")]
        public async Task<ActionResult> GerarRelatorioPdf(Guid id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var pdfBytes = await _planoAcaoService.GerarRelatorioPdfAsync(id, userId);
                
                if (pdfBytes == null)
                    return NotFound();

                return File(pdfBytes, "application/pdf", $"relatorio-plano-{id}.pdf");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }
    }
}
