using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistrawts.Module.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioDashboardPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PermissoesJson",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermissoesJson",
                table: "Usuarios");
        }
    }
}
