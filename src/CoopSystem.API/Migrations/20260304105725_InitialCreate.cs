using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoopSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Verificar se a tabela Users já existe antes de criar
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
                BEGIN
                    CREATE TABLE [Users] (
                        [Id] uniqueidentifier NOT NULL,
                        [Username] nvarchar(100) NOT NULL,
                        [PasswordHash] nvarchar(max) NOT NULL,
                        [PasswordSalt] nvarchar(max) NOT NULL,
                        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
                    );
                END
            ");

            // Verificar se a tabela UserRoles já existe antes de criar
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserRoles' AND xtype='U')
                BEGIN
                    CREATE TABLE [UserRoles] (
                        [UserId] uniqueidentifier NOT NULL,
                        [Role] nvarchar(50) NOT NULL,
                        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [Role]),
                        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
                    );
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
