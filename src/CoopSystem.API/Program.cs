using System.Net.WebSockets;
using System.Text;
using System.Text.Json.Serialization;
using CoopSystem.API.Infrastructure;
using CoopSystem.API.Dashboards;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Recoopera.Module;
using Serilog;
using Serilog.Formatting.Compact;
using Sistrawts.Module;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5000");


builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.Local.json", optional: true, reloadOnChange: true);

if (OperatingSystem.IsWindows())
{
    builder.Services.AddWindowsService();
}

var baseDir = AppContext.BaseDirectory;
var logsDir = Path.Combine(baseDir, "logs");
Directory.CreateDirectory(logsDir);
var logPath = Path.Combine(logsDir, "coopsystem-.log");

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        formatter: new CompactJsonFormatter(),
        path: logPath,
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        shared: true)
    .CreateLogger();


builder.Host.UseSerilog();

builder.Services.AddProblemDetails();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .AddApplicationPart(Recoopera.Module.Controllers.AssemblyReference.Assembly)
    .AddApplicationPart(Sistrawts.Module.Controllers.AssemblyReference.Assembly);

builder.Services.Configure<CoopSystemSettings>(builder.Configuration.GetSection("CoopSystemSettings"));
builder.Services.Configure<DashboardCatalogOptions>(builder.Configuration.GetSection("Dashboards"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CoopSystem",
        Version = "v1",
        Description = "Sistema modular cooperativista"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole apenas o token JWT sem o prefixo Bearer."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var jwtKey = GetRequiredConfiguration(builder.Configuration, "Jwt:Key");
var jwtIssuer = GetRequiredConfiguration(builder.Configuration, "Jwt:Issuer");
var jwtAudience = GetRequiredConfiguration(builder.Configuration, "Jwt:Audience");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient("DashboardProxy", client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "CoopSystem-DashboardProxy");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
});
builder.Services.AddSingleton<IDashboardCatalogService, DashboardCatalogService>();
builder.Services.AddScoped<IDashboardAccessService, DashboardAccessService>();
builder.Services.AddHostedService<DashboardManagedProcessHostedService>();
// Mantido desativado o serviço de monitoramento que causa problemas
// builder.Services.Configure<DashboardHealthOptions>(builder.Configuration.GetSection("DashboardHealth"));
// builder.Services.AddHostedService<DashboardHealthMonitorService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddRecooperaModule(builder.Configuration);
builder.Services.AddSistrawtsModule(builder.Configuration);

builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

builder.Services.AddHostedService<Sistrawts.Module.Application.BackgroundServices.PlanoAcaoVencimentoService>();

var app = builder.Build();

var webRootPath = app.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
var frontendIndexPath = Path.Combine(webRootPath, "index.html");

var swaggerEnabled = builder.Configuration.GetValue("Swagger:Enabled", app.Environment.IsDevelopment());
var httpsRedirectionEnabled = builder.Configuration.GetValue("HttpsRedirection:Enabled", false);

app.UseSerilogRequestLogging();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
            if (exceptionFeature?.Error is not null)
            {
                var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("GlobalException");
                logger.LogError(exceptionFeature.Error, "Unhandled request exception.");
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            await Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Unexpected server error").ExecuteAsync(context);
        });
    });
}

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (httpsRedirectionEnabled)
{
    app.UseHttpsRedirection();
}

// Habilitar WebSockets para proxy do Streamlit
app.UseWebSockets();

// Proxy para recursos estáticos do Streamlit (/static/, /media/, /_stcore/ e variantes com /dashboard-proxy/) - DEVE VIR ANTES de UseStaticFiles
app.MapWhen(context =>
{
    var path = context.Request.Path.Value ?? "";
    return path.StartsWith("/static") ||
           path.StartsWith("/media") ||
           path.StartsWith("/_stcore") ||
           path.Contains("/dashboard-proxy/static") ||
           path.Contains("/dashboard-proxy/media") ||
           path.Contains("/dashboard-proxy/_stcore");
}, async appBuilder =>
{
    var httpClientFactory = appBuilder.ApplicationServices.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient("DashboardProxy");
    var logger = appBuilder.ApplicationServices.GetRequiredService<ILogger<Program>>();

    appBuilder.Run(async context =>
    {
        try
        {
            // Extrair o caminho real do recurso (remover /dashboard-proxy/{slug} se presente)
            var path = context.Request.Path.Value ?? "";
            var targetPath = path;

            // Se o caminho contém /dashboard-proxy/, extrair o path do recurso
            if (path.Contains("/dashboard-proxy/"))
            {
                var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                // Encontrar o índice de "static", "media" ou "_stcore"
                for (int i = 0; i < parts.Length; i++)
                {
                    if (parts[i] == "static" || parts[i] == "media" || parts[i] == "_stcore")
                    {
                        targetPath = "/" + string.Join("/", parts.Skip(i));
                        break;
                    }
                }
            }

            // Redirecionar recursos estáticos para o Streamlit na porta 8501
            var targetPort = 8501;
            var targetUrl = $"http://localhost:{targetPort}{targetPath}";

            if (context.Request.QueryString.HasValue)
            {
                targetUrl += context.Request.QueryString;
            }

            logger.LogInformation("Proxying static resource {OriginalPath} -> {TargetUrl}", path, targetUrl);

            var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUrl);

            foreach (var header in context.Request.Headers)
            {
                if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) &&
                    !header.Key.Equals("Connection", StringComparison.OrdinalIgnoreCase))
                {
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }
            
            // Log dos headers copiados
            logger.LogInformation("Proxy static - Headers copiados: {Headers}", 
                string.Join(", ", request.Headers.Select(h => h.Key)));

            if (context.Request.ContentLength > 0)
            {
                request.Content = new StreamContent(context.Request.Body);
            }

            var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);

            context.Response.StatusCode = (int)response.StatusCode;

            foreach (var header in response.Headers)
            {
                if (!header.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.Headers[header.Key] = header.Value.ToArray();
                }
            }

            foreach (var header in response.Content.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }

            await response.Content.CopyToAsync(context.Response.Body);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao fazer proxy para recurso estático");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Erro interno no proxy");
        }
    });
});

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Proxy reverso para dashboards Streamlit
// Proxy reverso para dashboards Streamlit (com suporte a WebSocket)
app.MapWhen(context => context.Request.Path.StartsWithSegments("/dashboard-proxy"), async appBuilder =>
{
    var httpClientFactory = appBuilder.ApplicationServices.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient("DashboardProxy");
    var logger = appBuilder.ApplicationServices.GetRequiredService<ILogger<Program>>();

    appBuilder.Run(async context =>
    {
        try
        {
            // Extrair dashboard slug e path
            var path = context.Request.Path.Value;
            var pathParts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (pathParts.Length < 2)
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Formato inválido. Use: /dashboard-proxy/{slug}/{*path}");
                return;
            }

            var slug = pathParts[1];
            var remainingPath = string.Join("/", pathParts.Skip(2));

            // Para proxy reverso, usamos a porta configurada no manifesto
            // Se não tiver porta configurada, usamos 8501 como padrão
            var targetPort = 8501; // Padrão para Streamlit

            // Construir URL de destino para o Streamlit local
            var targetUrl = $"http://localhost:{targetPort}";
            if (!string.IsNullOrEmpty(remainingPath))
            {
                targetUrl += $"/{remainingPath}";
            }

            // Copiar query string
            if (context.Request.QueryString.HasValue)
            {
                targetUrl += context.Request.QueryString;
            }

            logger.LogInformation("Proxying request for dashboard {Slug} to {TargetUrl}", slug, targetUrl);
            
            // Log dos headers da requisição original (especialmente Authorization)
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            logger.LogInformation("Proxy request - Authorization header presente: {HasAuth}, Valor: {AuthValue}", 
                !string.IsNullOrEmpty(authHeader), 
                authHeader != null ? authHeader[..Math.Min(20, authHeader.Length)] + "..." : "nenhum");

            // Verificar se é uma requisição WebSocket
            if (context.WebSockets.IsWebSocketRequest)
            {
                logger.LogInformation("WebSocket request detected for {Path}", context.Request.Path);

                // Construir URL WebSocket de destino (wss:// para HTTPS)
                var wsTargetUrl = targetUrl.Replace("http://", "ws://");

                try
                {
                    using var client = new ClientWebSocket();

                    // Copiar headers do WebSocket
                    foreach (var header in context.Request.Headers)
                    {
                        if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) &&
                            !header.Key.Equals("Connection", StringComparison.OrdinalIgnoreCase) &&
                            !header.Key.Equals("Upgrade", StringComparison.OrdinalIgnoreCase) &&
                            !header.Key.Equals("Sec-WebSocket", StringComparison.OrdinalIgnoreCase))
                        {
                            client.Options.SetRequestHeader(header.Key, string.Join(",", header.Value));
                        }
                    }

                    // Conectar ao servidor WebSocket de destino
                    await client.ConnectAsync(new Uri(wsTargetUrl), context.RequestAborted);

                    // Aceitar o WebSocket do cliente
                    using var webSocket = await context.WebSockets.AcceptWebSocketAsync();

                    // Fazer proxy bidirecional
                    await ProxyWebSocketAsync(webSocket, client, context.RequestAborted);
                }
                catch (Exception wsEx)
                {
                    logger.LogError(wsEx, "Erro no proxy WebSocket para {TargetUrl}", wsTargetUrl);
                    context.Response.StatusCode = 400;
                }
                return;
            }

            // Fazer proxy da requisição HTTP normal
            var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUrl);

            // Copiar headers (exceto os que não devem ser copiados)
            foreach (var header in context.Request.Headers)
            {
                if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) &&
                    !header.Key.Equals("Connection", StringComparison.OrdinalIgnoreCase))
                {
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }
            
            // Log dos headers copiados para o request
            logger.LogInformation("Proxy HTTP - Headers copiados: {Headers}", 
                string.Join(", ", request.Headers.Select(h => h.Key)));

            // Copiar corpo se existir
            if (context.Request.ContentLength > 0)
            {
                request.Content = new StreamContent(context.Request.Body);
            }

            var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);

            // Copiar resposta
            context.Response.StatusCode = (int)response.StatusCode;

            foreach (var header in response.Headers)
            {
                if (!header.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.Headers[header.Key] = header.Value.ToArray();
                }
            }

            foreach (var header in response.Content.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }

            await response.Content.CopyToAsync(context.Response.Body);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao fazer proxy para dashboard");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Erro interno no proxy do dashboard");
        }
    });
});

app.MapControllers();

app.MapFallback(async context =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    if (!File.Exists(frontendIndexPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.SendFileAsync(frontendIndexPath);
}).AllowAnonymous();

app.Run();

// Helper para fazer proxy bidirecional de WebSocket
static async Task ProxyWebSocketAsync(WebSocket serverWebSocket, ClientWebSocket clientWebSocket, CancellationToken cancellationToken)
{
    var buffer = new byte[8192];
    var serverToClient = Task.Run(async () =>
    {
        try
        {
            while (serverWebSocket.State == WebSocketState.Open && clientWebSocket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                var result = await serverWebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await clientWebSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, cancellationToken);
                    break;
                }
                await clientWebSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType, result.EndOfMessage, cancellationToken);
            }
        }
        catch (Exception)
        {
            // Ignorar erros de desconexão
        }
    });

    var clientToServer = Task.Run(async () =>
    {
        try
        {
            while (serverWebSocket.State == WebSocketState.Open && clientWebSocket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                var result = await clientWebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await serverWebSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, cancellationToken);
                    break;
                }
                await serverWebSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType, result.EndOfMessage, cancellationToken);
            }
        }
        catch (Exception)
        {
            // Ignorar erros de desconexão
        }
    });

    await Task.WhenAny(serverToClient, clientToServer);
}

static string GetRequiredConfiguration(IConfiguration configuration, string key)
{
    var value = configuration[key];

    if (string.IsNullOrWhiteSpace(value) || value.Contains("__SET_IN_SECRET_STORE__", StringComparison.Ordinal))
    {
        throw new InvalidOperationException($"{key} nao configurado. Defina o valor final via variavel de ambiente ou secret store.");
    }

    return value;
}