using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface IEmailService
    {
        Task EnviarEmailPlanoAcaoAtribuido(PlanoAcaoDto plano);
        Task EnviarEmailMicroAcaoAtribuida(MicroAcaoDto microAcao);
        Task EnviarEmailPlanoAcaoProximoVencimento(PlanoAcaoDto plano, int diasRestantes);
        Task EnviarEmailMicroAcaoProximoVencimento(MicroAcaoDto microAcao, int diasRestantes);
    }
}
