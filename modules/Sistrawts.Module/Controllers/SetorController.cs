using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Services;

namespace Sistrawts.Module.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SetorController : ControllerBase
    {
        private readonly ISetorService _setorService;

        public SetorController(ISetorService setorService)
        {
            _setorService = setorService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SetorDto>>> GetAll()
        {
            var setores = await _setorService.GetAllAsync();
            return Ok(setores);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<SetorDto>> GetById(Guid id)
        {
            var setor = await _setorService.GetByIdAsync(id);
            if (setor == null)
                return NotFound();

            return Ok(setor);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SetorDto>> Create([FromBody] CreateSetorDto dto)
        {
            try
            {
                var setor = await _setorService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = setor.Id }, setor);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SetorDto>> Update(Guid id, [FromBody] UpdateSetorDto dto)
        {
            try
            {
                var setor = await _setorService.UpdateAsync(id, dto);
                if (setor == null)
                    return NotFound();

                return Ok(setor);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var result = await _setorService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
