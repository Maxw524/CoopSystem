using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoopSystem.API.Migrations.SistrawtsDb
{
    /// <inheritdoc />
    public partial class AddSubcategoriasIndicadores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateIndex(
                name: "IX_IndicadoresSubcategorias_SubcategoriaId",
                table: "IndicadoresSubcategorias",
                column: "SubcategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_SubcategoriasIndicadores_Nome",
                table: "SubcategoriasIndicadores",
                column: "Nome",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IndicadoresSubcategorias");

            migrationBuilder.DropTable(
                name: "SubcategoriasIndicadores");
        }
    }
}
