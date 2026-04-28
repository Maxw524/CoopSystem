using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Services;

namespace Sistrawts.Module.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MicroAcaoController : ControllerBase
    {
        private readonly IMicroAcaoService _microAcaoService;

        public MicroAcaoController(IMicroAcaoService microAcaoService)
        {
            _microAcaoService = microAcaoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MicroAcaoDto>>> GetAll()
        {
            var microAcoes = await _microAcaoService.GetAllAsync();
            return Ok(microAcoes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MicroAcaoDto>> GetById(int id)
        {
            var microAcao = await _microAcaoService.GetByIdAsync(id);
            if (microAcao == null)
                return NotFound();

            return Ok(microAcao);
        }

        [HttpPost]
        public async Task<ActionResult<MicroAcaoDto>> Create([FromBody] CreateMicroAcaoDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var microAcao = await _microAcaoService.CreateAsync(dto, userId);

                // Enviar e-mail para o responsável
                return CreatedAtAction(nameof(GetById), new { id = microAcao.Id }, microAcao);
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
        public async Task<ActionResult<MicroAcaoDto>> Update(int id, [FromBody] UpdateMicroAcaoDto dto)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var microAcao = await _microAcaoService.UpdateAsync(id, dto, userId);
                
                if (microAcao == null)
                    return NotFound();

                return Ok(microAcao);
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
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var result = await _microAcaoService.DeleteAsync(id, userId);
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("plano/{planoAcaoId:guid}")]
        public async Task<ActionResult<IEnumerable<MicroAcaoDto>>> GetByPlanoAcao(Guid planoAcaoId)
        {
            var microAcoes = await _microAcaoService.GetByPlanoAcaoIdAsync(planoAcaoId);
            return Ok(microAcoes);
        }

        [HttpGet("responsavel/{responsavelId:guid}")]
        public async Task<ActionResult<IEnumerable<MicroAcaoDto>>> GetByResponsavel(Guid responsavelId)
        {
            var microAcoes = await _microAcaoService.GetByResponsavelIdAsync(responsavelId);
            return Ok(microAcoes);
        }

        [HttpPut("{id}/concluir")]
        public async Task<ActionResult> MarcarComoConcluida(int id)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var result = await _microAcaoService.MarcarComoConcluidaAsync(id, userId);
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("{id}/upload")]
        public async Task<ActionResult<string>> UploadComprovacao(int id, IFormFile file)
        {
            try
            {
                var userId = ControllerUserIdHelper.GetRequiredUserId(User);
                var caminhoArquivo = await _microAcaoService.UploadComprovacaoAsync(id, file, userId);
                
                if (caminhoArquivo == null)
                    return NotFound();

                return Ok(new { caminhoArquivo });
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
    }
}
