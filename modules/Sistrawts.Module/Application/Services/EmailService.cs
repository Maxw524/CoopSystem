using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MimeKit;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Settings;

namespace Sistrawts.Module.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IOptions<EmailSettings> _emailSettings;

        public EmailService(ILogger<EmailService> logger, IOptions<EmailSettings> emailSettings)
        {
            _logger = logger;
            _emailSettings = emailSettings;
        }

        public async Task EnviarEmailPlanoAcaoAtribuido(PlanoAcaoDto plano)
        {
            try
            {
                var assunto = $"Novo Plano de Ação Atribuído: {plano.Titulo}";
                var corpo = GerarCorpoEmailPlanoAcao(plano);

                await EnviarEmailAsync(plano.ResponsavelEmail, plano.ResponsavelNome, assunto, corpo);
                
                _logger.LogInformation($"E-mail enviado para {plano.ResponsavelEmail} sobre o plano {plano.Titulo}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao enviar e-mail para {plano.ResponsavelEmail}");
            }
        }

        public async Task EnviarEmailMicroAcaoAtribuida(MicroAcaoDto microAcao)
        {
            try
            {
                var assunto = $"Nova Micro Ação Atribuída: {microAcao.Titulo}";
                var corpo = GerarCorpoEmailMicroAcao(microAcao);

                await EnviarEmailAsync(microAcao.ResponsavelEmail, microAcao.ResponsavelNome, assunto, corpo);
                
                _logger.LogInformation($"E-mail enviado para {microAcao.ResponsavelEmail} sobre a micro ação {microAcao.Titulo}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao enviar e-mail para {microAcao.ResponsavelEmail}");
            }
        }

        public async Task EnviarEmailPlanoAcaoProximoVencimento(PlanoAcaoDto plano, int diasRestantes)
        {
            try
            {
                var assunto = $"⚠️ Plano de Ação Próximo ao Vencimento: {plano.Titulo}";
                var corpo = GerarCorpoEmailPlanoAcaoVencimento(plano, diasRestantes);

                await EnviarEmailAsync(plano.ResponsavelEmail, plano.ResponsavelNome, assunto, corpo);
                
                _logger.LogInformation($"E-mail de vencimento enviado para {plano.ResponsavelEmail} sobre o plano {plano.Titulo} ({diasRestantes} dias restantes)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao enviar e-mail de vencimento para {plano.ResponsavelEmail}");
            }
        }

        public async Task EnviarEmailMicroAcaoProximoVencimento(MicroAcaoDto microAcao, int diasRestantes)
        {
            try
            {
                var assunto = $"⚠️ Micro Ação Próxima ao Vencimento: {microAcao.Titulo}";
                var corpo = GerarCorpoEmailMicroAcaoVencimento(microAcao, diasRestantes);

                await EnviarEmailAsync(microAcao.ResponsavelEmail, microAcao.ResponsavelNome, assunto, corpo);
                
                _logger.LogInformation($"E-mail de vencimento enviado para {microAcao.ResponsavelEmail} sobre a micro ação {microAcao.Titulo} ({diasRestantes} dias restantes)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao enviar e-mail de vencimento para {microAcao.ResponsavelEmail}");
            }
        }

        private async Task EnviarEmailAsync(string email, string nome, string assunto, string corpo)
        {
            var settings = _emailSettings.Value;
            
            // Verificar se as configurações estão preenchidas
            if (IsMissing(settings.SmtpServer) ||
                IsMissing(settings.SmtpUsername) ||
                IsMissing(settings.SmtpPassword) ||
                IsMissing(settings.FromEmail))
            {
                // Configurações não preenchidas - usar modo simulado
                _logger.LogWarning("Configurações de e-mail não encontradas. Usando modo simulado.");
                
                _logger.LogInformation($"--- E-MAIL SIMULADO ---");
                _logger.LogInformation($"Para: {nome} <{email}>");
                _logger.LogInformation($"Assunto: {assunto}");
                _logger.LogInformation($"Corpo: {corpo}");
                _logger.LogInformation($"--- FIM DO E-MAIL ---");

                await Task.Delay(100);
                return;
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(settings.FromName, settings.FromEmail));
                message.To.Add(new MailboxAddress(nome, email));
                message.Subject = assunto;
                message.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = corpo };

                using var client = new SmtpClient();
                
                // Aumentar timeout para conexão SMTP (2 minutos = 120000ms)
                client.Timeout = 120000;
                
                // Conectar ao servidor SMTP com StartTLS para Outlook
                await client.ConnectAsync(settings.SmtpServer, settings.SmtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                
                // Autenticar
                await client.AuthenticateAsync(settings.SmtpUsername, settings.SmtpPassword);
                
                // Enviar e-mail
                await client.SendAsync(message);
                
                // Desconectar
                await client.DisconnectAsync(true);

                _logger.LogInformation($"E-mail enviado com sucesso para {email} - Assunto: {assunto}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao enviar e-mail para {email}: {ex.Message}");
                
                // Fallback para modo simulado em caso de erro
                _logger.LogInformation($"--- E-MAIL SIMULADO (FALLBACK) ---");
                _logger.LogInformation($"Para: {nome} <{email}>");
                _logger.LogInformation($"Assunto: {assunto}");
                _logger.LogInformation($"Corpo: {corpo}");
                _logger.LogInformation($"--- FIM DO E-MAIL ---");
            }
        }

        private static bool IsMissing(string? value)
        {
            return string.IsNullOrWhiteSpace(value) || value.Contains("__SET_IN_SECRET_STORE__", StringComparison.Ordinal);
        }

        private string GerarCorpoEmailPlanoAcao(PlanoAcaoDto plano)
        {
            var settings = _emailSettings.Value;
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .title {{ color: #667eea; font-size: 24px; margin-bottom: 20px; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .data-table th {{ background: #667eea; color: white; padding: 12px; text-align: left; }}
        .data-table td {{ padding: 12px; border-bottom: 1px solid #ddd; }}
        .data-table tr:nth-child(even) {{ background: #f2f2f2; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎯 Novo Plano de Ação Atribuído</h1>
        </div>
        <div class='content'>
            <p>Prezado(a) <strong>{plano.ResponsavelNome}</strong>,</p>
            
            <p>Um novo plano de ação foi atribuído a você no sistema <strong>Sistrawts</strong>. Por favor, revise os detalhes abaixo e inicie as trativas necessárias.</p>
            
            <h2 class='title'>📋 Dados do Plano</h2>
            <table class='data-table'>
                <tr>
                    <th><strong>📌 Título</strong></th>
                    <td>{plano.Titulo}</td>
                </tr>
                <tr>
                    <th><strong>📝 Descrição</strong></th>
                    <td>{(!string.IsNullOrEmpty(plano.Descricao) ? plano.Descricao : "Não informada")}</td>
                </tr>
                <tr>
                    <th><strong>📅 Data de Início</strong></th>
                    <td>{plano.DataInicio:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>⏰ Previsão de Conclusão</strong></th>
                    <td>{plano.PrevisaoConclusao:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>👤 Criado por</strong></th>
                    <td>{plano.CriadoPorNome}</td>
                </tr>
            </table>
            
            <div style='text-align: center;'>
                <a href='{settings.SystemUrl}' class='btn'>🚀 Acessar Sistema</a>
            </div>
            
            <p>Por favor, acesse o sistema para mais detalhes e começar a trativa deste plano.</p>
            
            <div class='footer'>
                <p><strong>Atenciosamente,</strong><br>Equipe Sistrawts 🚀</p>
                <p style='font-size: 12px; color: #999;'>Este é um e-mail automático. Por favor, não responda a esta mensagem.</p>
            </div>
        </div>
    </div>
</body>
</html>";
        }

        private string GerarCorpoEmailMicroAcao(MicroAcaoDto microAcao)
        {
            var settings = _emailSettings.Value;
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .title {{ color: #f5576c; font-size: 24px; margin-bottom: 20px; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .data-table th {{ background: #f5576c; color: white; padding: 12px; text-align: left; }}
        .data-table td {{ padding: 12px; border-bottom: 1px solid #ddd; }}
        .data-table tr:nth-child(even) {{ background: #f2f2f2; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🔧 Nova Micro Ação Atribuída</h1>
        </div>
        <div class='content'>
            <p>Prezado(a) <strong>{microAcao.ResponsavelNome}</strong>,</p>
            
            <p>Uma nova micro ação foi atribuída a você no sistema <strong>Sistrawts</strong>. Esta ação faz parte de um plano maior e precisa da sua atenção.</p>
            
            <h2 class='title'>📋 Dados da Micro Ação</h2>
            <table class='data-table'>
                <tr>
                    <th><strong>📌 Título</strong></th>
                    <td>{microAcao.Titulo}</td>
                </tr>
                <tr>
                    <th><strong>📝 Descrição</strong></th>
                    <td>{(!string.IsNullOrEmpty(microAcao.Descricao) ? microAcao.Descricao : "Não informada")}</td>
                </tr>
                <tr>
                    <th><strong>🎯 Plano de Ação</strong></th>
                    <td>{microAcao.PlanoAcaoTitulo}</td>
                </tr>
                <tr>
                    <th><strong>📅 Data de Início</strong></th>
                    <td>{microAcao.DataInicio:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>⏰ Previsão de Conclusão</strong></th>
                    <td>{microAcao.PrevisaoConclusao:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>👤 Criado por</strong></th>
                    <td>{microAcao.CriadoPorNome}</td>
                </tr>
                <tr>
                    <th><strong>✅ Status</strong></th>
                    <td>{(microAcao.Concluida ? "🟢 Concluída" : "🟡 Em andamento")}</td>
                </tr>
            </table>
            
            <div style='text-align: center;'>
                <a href='{settings.SystemUrl}' class='btn'>🚀 Acessar Sistema</a>
            </div>
            
            <p>Por favor, acesse o sistema para mais detalhes e começar a trativa desta micro ação.</p>
            
            <div class='footer'>
                <p><strong>Atenciosamente,</strong><br>Equipe Sistrawts 🚀</p>
                <p style='font-size: 12px; color: #999;'>Este é um e-mail automático. Por favor, não responda a esta mensagem.</p>
            </div>
        </div>
    </div>
</body>
</html>";
        }

        private string GerarCorpoEmailPlanoAcaoVencimento(PlanoAcaoDto plano, int diasRestantes)
        {
            var settings = _emailSettings.Value;
            var urgencia = diasRestantes <= 2 ? "URGENTE" : "IMPORTANTE";
            var corUrgencia = diasRestantes <= 2 ? "#ff4757" : "#ffa502";
            var iconeUrgencia = diasRestantes <= 2 ? "🚨" : "⚠️";
            
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, {corUrgencia} 0%, #ff6b6b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .title {{ color: {corUrgencia}; font-size: 24px; margin-bottom: 20px; }}
        .alert {{ background: {corUrgencia}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .data-table th {{ background: {corUrgencia}; color: white; padding: 12px; text-align: left; }}
        .data-table td {{ padding: 12px; border-bottom: 1px solid #ddd; }}
        .data-table tr:nth-child(even) {{ background: #f2f2f2; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: {corUrgencia}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .dias-restantes {{ font-size: 48px; font-weight: bold; color: {corUrgencia}; text-align: center; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{iconeUrgencia} Plano de Ação Próximo ao Vencimento</h1>
        </div>
        <div class='content'>
            <p>Prezado(a) <strong>{plano.ResponsavelNome}</strong>,</p>
            
            <div class='alert'>
                <strong>{urgencia}:</strong> Seu plano de ação está próximo ao vencimento!
            </div>
            
            <div class='dias-restantes'>
                {diasRestantes} dias restantes
            </div>
            
            <h2 class='title'>📋 Dados do Plano</h2>
            <table class='data-table'>
                <tr>
                    <th><strong>📌 Título</strong></th>
                    <td>{plano.Titulo}</td>
                </tr>
                <tr>
                    <th><strong>📝 Descrição</strong></th>
                    <td>{(!string.IsNullOrEmpty(plano.Descricao) ? plano.Descricao : "Não informada")}</td>
                </tr>
                <tr>
                    <th><strong>📅 Data de Início</strong></th>
                    <td>{plano.DataInicio:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>⏰ Previsão de Conclusão</strong></th>
                    <td>{plano.PrevisaoConclusao:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>📊 Percentual Conclusão</strong></th>
                    <td>{plano.PercentualConclusao:F1}%</td>
                </tr>
            </table>
            
            {(diasRestantes <= 2 ? @"
            <div class='alert' style='background: #ff4757;'>
                <strong>🚨 ATENÇÃO:</strong> Restam apenas 2 dias para a conclusão! Por favor, priorize este plano.
            </div>" : @"
            <div class='alert' style='background: #ffa502;'>
                <strong>⏰ LEMBRETE:</strong> Organize suas atividades para concluir este plano a tempo.
            </div>")}
            
            <div style='text-align: center;'>
                <a href='{settings.SystemUrl}' class='btn'>🚀 Acessar Sistema</a>
            </div>
            
            <p>Acesse o sistema para atualizar o andamento e registrar as trativas.</p>
            
            <div class='footer'>
                <p><strong>Atenciosamente,</strong><br>Equipe Sistrawts 🚀</p>
                <p style='font-size: 12px; color: #999;'>Este é um e-mail automático. Por favor, não responda a esta mensagem.</p>
            </div>
        </div>
    </div>
</body>
</html>";
        }

        private string GerarCorpoEmailMicroAcaoVencimento(MicroAcaoDto microAcao, int diasRestantes)
        {
            var settings = _emailSettings.Value;
            var urgencia = diasRestantes <= 2 ? "URGENTE" : "IMPORTANTE";
            var corUrgencia = diasRestantes <= 2 ? "#ff4757" : "#ffa502";
            var iconeUrgencia = diasRestantes <= 2 ? "🚨" : "⚠️";
            
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, {corUrgencia} 0%, #ff6b6b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .title {{ color: {corUrgencia}; font-size: 24px; margin-bottom: 20px; }}
        .alert {{ background: {corUrgencia}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .data-table th {{ background: {corUrgencia}; color: white; padding: 12px; text-align: left; }}
        .data-table td {{ padding: 12px; border-bottom: 1px solid #ddd; }}
        .data-table tr:nth-child(even) {{ background: #f2f2f2; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: {corUrgencia}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .dias-restantes {{ font-size: 48px; font-weight: bold; color: {corUrgencia}; text-align: center; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{iconeUrgencia} Micro Ação Próxima ao Vencimento</h1>
        </div>
        <div class='content'>
            <p>Prezado(a) <strong>{microAcao.ResponsavelNome}</strong>,</p>
            
            <div class='alert'>
                <strong>{urgencia}:</strong> Sua micro ação está próxima ao vencimento!
            </div>
            
            <div class='dias-restantes'>
                {diasRestantes} dias restantes
            </div>
            
            <h2 class='title'>📋 Dados da Micro Ação</h2>
            <table class='data-table'>
                <tr>
                    <th><strong>📌 Título</strong></th>
                    <td>{microAcao.Titulo}</td>
                </tr>
                <tr>
                    <th><strong>📝 Descrição</strong></th>
                    <td>{(!string.IsNullOrEmpty(microAcao.Descricao) ? microAcao.Descricao : "Não informada")}</td>
                </tr>
                <tr>
                    <th><strong>🎯 Plano de Ação</strong></th>
                    <td>{microAcao.PlanoAcaoTitulo}</td>
                </tr>
                <tr>
                    <th><strong>📅 Data de Início</strong></th>
                    <td>{microAcao.DataInicio:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>⏰ Previsão de Conclusão</strong></th>
                    <td>{microAcao.PrevisaoConclusao:dd/MM/yyyy}</td>
                </tr>
                <tr>
                    <th><strong>✅ Status</strong></th>
                    <td>{(microAcao.Concluida ? "🟢 Concluída" : "🟡 Em andamento")}</td>
                </tr>
            </table>
            
            {(diasRestantes <= 2 ? @"
            <div class='alert' style='background: #ff4757;'>
                <strong>🚨 ATENÇÃO:</strong> Restam apenas 2 dias para a conclusão! Por favor, priorize esta micro ação.
            </div>" : @"
            <div class='alert' style='background: #ffa502;'>
                <strong>⏰ LEMBRETE:</strong> Organize suas atividades para concluir esta micro ação a tempo.
            </div>")}
            
            <div style='text-align: center;'>
                <a href='{settings.SystemUrl}' class='btn'>🚀 Acessar Sistema</a>
            </div>
            
            <p>Acesse o sistema para atualizar o andamento e registrar as trativas.</p>
            
            <div class='footer'>
                <p><strong>Atenciosamente,</strong><br>Equipe Sistrawts 🚀</p>
                <p style='font-size: 12px; color: #999;'>Este é um e-mail automático. Por favor, não responda a esta mensagem.</p>
            </div>
        </div>
    </div>
</body>
</html>";
        }
    }
}
