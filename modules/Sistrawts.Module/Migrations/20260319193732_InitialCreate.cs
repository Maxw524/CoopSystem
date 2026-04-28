using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistrawts.Module.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CategoriasIndicadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasIndicadores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubcategoriasIndicadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubcategoriasIndicadores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NomeCompleto = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    SenhaHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    Admin = table.Column<bool>(type: "bit", nullable: false),
                    PermiteJuridico = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PermiteSistrawts = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PermiteSimuladorTaxa = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Indicadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomeMeta = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CategoriaId = table.Column<int>(type: "int", nullable: false),
                    EhPercentual = table.Column<bool>(type: "bit", nullable: false),
                    QuantoMaiorMelhor = table.Column<bool>(type: "bit", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Indicadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Indicadores_CategoriasIndicadores_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "CategoriasIndicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlanosAcao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    DataInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PrevisaoConclusao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataConclusao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PercentualConclusao = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 0m),
                    Trativa = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Relatorio = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    ResponsavelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CriadoPorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanosAcao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanosAcao_Usuarios_CriadoPorId",
                        column: x => x.CriadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlanosAcao_Usuarios_ResponsavelId",
                        column: x => x.ResponsavelId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IndicadoresSubcategorias",
                columns: table => new
                {
                    IndicadorId = table.Column<int>(type: "int", nullable: false),
                    SubcategoriaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IndicadoresSubcategorias", x => new { x.IndicadorId, x.SubcategoriaId });
                    table.ForeignKey(
                        name: "FK_IndicadoresSubcategorias_Indicadores_IndicadorId",
                        column: x => x.IndicadorId,
                        principalTable: "Indicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IndicadoresSubcategorias_SubcategoriasIndicadores_SubcategoriaId",
                        column: x => x.SubcategoriaId,
                        principalTable: "SubcategoriasIndicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetasMensais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IndicadorId = table.Column<int>(type: "int", nullable: false),
                    SubcategoriaId = table.Column<int>(type: "int", nullable: true),
                    Ano = table.Column<int>(type: "int", nullable: false),
                    Mes = table.Column<int>(type: "int", nullable: false),
                    ValorMeta = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetasMensais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MetasMensais_Indicadores_IndicadorId",
                        column: x => x.IndicadorId,
                        principalTable: "Indicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetasMensais_SubcategoriasIndicadores_SubcategoriaId",
                        column: x => x.SubcategoriaId,
                        principalTable: "SubcategoriasIndicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ResultadosMensais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IndicadorId = table.Column<int>(type: "int", nullable: false),
                    SubcategoriaId = table.Column<int>(type: "int", nullable: true),
                    Ano = table.Column<int>(type: "int", nullable: false),
                    Mes = table.Column<int>(type: "int", nullable: false),
                    ValorResultado = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DataRegistro = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResultadosMensais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResultadosMensais_Indicadores_IndicadorId",
                        column: x => x.IndicadorId,
                        principalTable: "Indicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResultadosMensais_SubcategoriasIndicadores_SubcategoriaId",
                        column: x => x.SubcategoriaId,
                        principalTable: "SubcategoriasIndicadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MicroAcoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Trativa = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DataInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PrevisaoConclusao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataConclusao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Concluida = table.Column<bool>(type: "bit", nullable: false),
                    ArquivoComprovacao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PlanoAcaoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResponsavelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CriadoPorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MicroAcoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MicroAcoes_PlanosAcao_PlanoAcaoId",
                        column: x => x.PlanoAcaoId,
                        principalTable: "PlanosAcao",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MicroAcoes_Usuarios_CriadoPorId",
                        column: x => x.CriadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MicroAcoes_Usuarios_ResponsavelId",
                        column: x => x.ResponsavelId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Indicadores_CategoriaId",
                table: "Indicadores",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_IndicadoresSubcategorias_SubcategoriaId",
                table: "IndicadoresSubcategorias",
                column: "SubcategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_MetasMensais_IndicadorId_SubcategoriaId_Ano_Mes",
                table: "MetasMensais",
                columns: new[] { "IndicadorId", "SubcategoriaId", "Ano", "Mes" },
                unique: true,
                filter: "[SubcategoriaId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MetasMensais_SubcategoriaId",
                table: "MetasMensais",
                column: "SubcategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_MicroAcoes_CriadoPorId",
                table: "MicroAcoes",
                column: "CriadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_MicroAcoes_PlanoAcaoId",
                table: "MicroAcoes",
                column: "PlanoAcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_MicroAcoes_ResponsavelId",
                table: "MicroAcoes",
                column: "ResponsavelId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanosAcao_CriadoPorId",
                table: "PlanosAcao",
                column: "CriadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanosAcao_ResponsavelId",
                table: "PlanosAcao",
                column: "ResponsavelId");

            migrationBuilder.CreateIndex(
                name: "IX_ResultadosMensais_IndicadorId_SubcategoriaId_Ano_Mes",
                table: "ResultadosMensais",
                columns: new[] { "IndicadorId", "SubcategoriaId", "Ano", "Mes" },
                unique: true,
                filter: "[SubcategoriaId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ResultadosMensais_SubcategoriaId",
                table: "ResultadosMensais",
                column: "SubcategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_SubcategoriasIndicadores_Nome",
                table: "SubcategoriasIndicadores",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Username",
                table: "Usuarios",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IndicadoresSubcategorias");

            migrationBuilder.DropTable(
                name: "MetasMensais");

            migrationBuilder.DropTable(
                name: "MicroAcoes");

            migrationBuilder.DropTable(
                name: "ResultadosMensais");

            migrationBuilder.DropTable(
                name: "PlanosAcao");

            migrationBuilder.DropTable(
                name: "Indicadores");

            migrationBuilder.DropTable(
                name: "SubcategoriasIndicadores");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "CategoriasIndicadores");
        }
    }
}
