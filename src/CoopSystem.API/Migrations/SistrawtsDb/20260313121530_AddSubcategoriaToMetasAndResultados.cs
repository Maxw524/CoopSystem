using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoopSystem.API.Migrations.SistrawtsDb
{
    /// <inheritdoc />
    public partial class AddSubcategoriaToMetasAndResultados : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ResultadosMensais_IndicadorId_Ano_Mes",
                table: "ResultadosMensais");

            migrationBuilder.DropIndex(
                name: "IX_MetasMensais_IndicadorId_Ano_Mes",
                table: "MetasMensais");

            migrationBuilder.AddColumn<int>(
                name: "SubcategoriaId",
                table: "ResultadosMensais",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubcategoriaId",
                table: "MetasMensais",
                type: "int",
                nullable: true);

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
                name: "IX_MetasMensais_IndicadorId_SubcategoriaId_Ano_Mes",
                table: "MetasMensais",
                columns: new[] { "IndicadorId", "SubcategoriaId", "Ano", "Mes" },
                unique: true,
                filter: "[SubcategoriaId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MetasMensais_SubcategoriaId",
                table: "MetasMensais",
                column: "SubcategoriaId");

            migrationBuilder.AddForeignKey(
                name: "FK_MetasMensais_SubcategoriasIndicadores_SubcategoriaId",
                table: "MetasMensais",
                column: "SubcategoriaId",
                principalTable: "SubcategoriasIndicadores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ResultadosMensais_SubcategoriasIndicadores_SubcategoriaId",
                table: "ResultadosMensais",
                column: "SubcategoriaId",
                principalTable: "SubcategoriasIndicadores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MetasMensais_SubcategoriasIndicadores_SubcategoriaId",
                table: "MetasMensais");

            migrationBuilder.DropForeignKey(
                name: "FK_ResultadosMensais_SubcategoriasIndicadores_SubcategoriaId",
                table: "ResultadosMensais");

            migrationBuilder.DropIndex(
                name: "IX_ResultadosMensais_IndicadorId_SubcategoriaId_Ano_Mes",
                table: "ResultadosMensais");

            migrationBuilder.DropIndex(
                name: "IX_ResultadosMensais_SubcategoriaId",
                table: "ResultadosMensais");

            migrationBuilder.DropIndex(
                name: "IX_MetasMensais_IndicadorId_SubcategoriaId_Ano_Mes",
                table: "MetasMensais");

            migrationBuilder.DropIndex(
                name: "IX_MetasMensais_SubcategoriaId",
                table: "MetasMensais");

            migrationBuilder.DropColumn(
                name: "SubcategoriaId",
                table: "ResultadosMensais");

            migrationBuilder.DropColumn(
                name: "SubcategoriaId",
                table: "MetasMensais");

            migrationBuilder.CreateIndex(
                name: "IX_ResultadosMensais_IndicadorId_Ano_Mes",
                table: "ResultadosMensais",
                columns: new[] { "IndicadorId", "Ano", "Mes" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MetasMensais_IndicadorId_Ano_Mes",
                table: "MetasMensais",
                columns: new[] { "IndicadorId", "Ano", "Mes" },
                unique: true);
        }
    }
}
