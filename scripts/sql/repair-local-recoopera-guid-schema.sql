SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
        THROW 50000, 'Tabela dbo.Usuarios nao encontrada.', 1;

    IF OBJECT_ID(N'dbo.PlanosAcao', N'U') IS NULL
        THROW 50000, 'Tabela dbo.PlanosAcao nao encontrada.', 1;

    IF OBJECT_ID(N'dbo.MicroAcoes', N'U') IS NULL
        THROW 50000, 'Tabela dbo.MicroAcoes nao encontrada.', 1;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Usuarios')
          AND name = N'Id'
          AND user_type_id = TYPE_ID(N'uniqueidentifier')
    )
    BEGIN
        PRINT 'Schema local ja esta alinhado com Guid. Nenhuma alteracao aplicada.';
        COMMIT TRAN;
        RETURN;
    END;

    IF OBJECT_ID(N'dbo._Backup_Usuarios_PreGuidMigration', N'U') IS NULL
        SELECT * INTO dbo._Backup_Usuarios_PreGuidMigration FROM dbo.Usuarios;

    IF OBJECT_ID(N'dbo._Backup_PlanosAcao_PreGuidMigration', N'U') IS NULL
        SELECT * INTO dbo._Backup_PlanosAcao_PreGuidMigration FROM dbo.PlanosAcao;

    IF OBJECT_ID(N'dbo._Backup_MicroAcoes_PreGuidMigration', N'U') IS NULL
        SELECT * INTO dbo._Backup_MicroAcoes_PreGuidMigration FROM dbo.MicroAcoes;

    IF COL_LENGTH(N'dbo.Usuarios', N'IdGuid') IS NULL
        ALTER TABLE dbo.Usuarios ADD IdGuid uniqueidentifier NULL;

    EXEC(N'
        UPDATE dbo.Usuarios
        SET IdGuid = ISNULL(IdGuid, NEWID())
        WHERE IdGuid IS NULL;
    ');

    IF COL_LENGTH(N'dbo.PlanosAcao', N'ResponsavelIdGuid') IS NULL
        ALTER TABLE dbo.PlanosAcao ADD ResponsavelIdGuid uniqueidentifier NULL;

    IF COL_LENGTH(N'dbo.PlanosAcao', N'CriadoPorIdGuid') IS NULL
        ALTER TABLE dbo.PlanosAcao ADD CriadoPorIdGuid uniqueidentifier NULL;

    EXEC(N'
        UPDATE p
        SET
            ResponsavelIdGuid = ur.IdGuid,
            CriadoPorIdGuid = uc.IdGuid
        FROM dbo.PlanosAcao p
        INNER JOIN dbo.Usuarios ur ON ur.Id = p.ResponsavelId
        INNER JOIN dbo.Usuarios uc ON uc.Id = p.CriadoPorId;
    ');

    DECLARE @MissingPlanos int = 0;
    EXEC sp_executesql
        N'SELECT @Missing = COUNT(*) FROM dbo.PlanosAcao WHERE ResponsavelIdGuid IS NULL OR CriadoPorIdGuid IS NULL;',
        N'@Missing int OUTPUT',
        @MissingPlanos OUTPUT;

    IF @MissingPlanos > 0
        THROW 50001, 'Falha ao converter referencias de usuario em dbo.PlanosAcao.', 1;

    IF COL_LENGTH(N'dbo.MicroAcoes', N'ResponsavelIdGuid') IS NULL
        ALTER TABLE dbo.MicroAcoes ADD ResponsavelIdGuid uniqueidentifier NULL;

    IF COL_LENGTH(N'dbo.MicroAcoes', N'CriadoPorIdGuid') IS NULL
        ALTER TABLE dbo.MicroAcoes ADD CriadoPorIdGuid uniqueidentifier NULL;

    EXEC(N'
        UPDATE m
        SET
            ResponsavelIdGuid = ur.IdGuid,
            CriadoPorIdGuid = uc.IdGuid
        FROM dbo.MicroAcoes m
        INNER JOIN dbo.Usuarios ur ON ur.Id = m.ResponsavelId
        INNER JOIN dbo.Usuarios uc ON uc.Id = m.CriadoPorId;
    ');

    DECLARE @MissingMicroAcoes int = 0;
    EXEC sp_executesql
        N'SELECT @Missing = COUNT(*) FROM dbo.MicroAcoes WHERE ResponsavelIdGuid IS NULL OR CriadoPorIdGuid IS NULL;',
        N'@Missing int OUTPUT',
        @MissingMicroAcoes OUTPUT;

    IF @MissingMicroAcoes > 0
        THROW 50002, 'Falha ao converter referencias de usuario em dbo.MicroAcoes.', 1;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MicroAcoes_Usuarios_CriadoPorId')
        ALTER TABLE dbo.MicroAcoes DROP CONSTRAINT FK_MicroAcoes_Usuarios_CriadoPorId;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_MicroAcoes_Usuarios_ResponsavelId')
        ALTER TABLE dbo.MicroAcoes DROP CONSTRAINT FK_MicroAcoes_Usuarios_ResponsavelId;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PlanosAcao_Usuarios_CriadoPorId')
        ALTER TABLE dbo.PlanosAcao DROP CONSTRAINT FK_PlanosAcao_Usuarios_CriadoPorId;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PlanosAcao_Usuarios_ResponsavelId')
        ALTER TABLE dbo.PlanosAcao DROP CONSTRAINT FK_PlanosAcao_Usuarios_ResponsavelId;

    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE [name] = N'PK_Usuarios')
        ALTER TABLE dbo.Usuarios DROP CONSTRAINT PK_Usuarios;

    EXEC(N'
        EXEC sp_rename N''dbo.Usuarios.Id'', N''LegacyIntId'', N''COLUMN'';
        EXEC sp_rename N''dbo.Usuarios.IdGuid'', N''Id'', N''COLUMN'';
        ALTER TABLE dbo.Usuarios ALTER COLUMN Id uniqueidentifier NOT NULL;
        ALTER TABLE dbo.Usuarios ADD CONSTRAINT PK_Usuarios PRIMARY KEY (Id);

        EXEC sp_rename N''dbo.PlanosAcao.ResponsavelId'', N''LegacyResponsavelId'', N''COLUMN'';
        EXEC sp_rename N''dbo.PlanosAcao.CriadoPorId'', N''LegacyCriadoPorId'', N''COLUMN'';
        EXEC sp_rename N''dbo.PlanosAcao.ResponsavelIdGuid'', N''ResponsavelId'', N''COLUMN'';
        EXEC sp_rename N''dbo.PlanosAcao.CriadoPorIdGuid'', N''CriadoPorId'', N''COLUMN'';
        ALTER TABLE dbo.PlanosAcao ALTER COLUMN ResponsavelId uniqueidentifier NOT NULL;
        ALTER TABLE dbo.PlanosAcao ALTER COLUMN CriadoPorId uniqueidentifier NOT NULL;

        EXEC sp_rename N''dbo.MicroAcoes.ResponsavelId'', N''LegacyResponsavelId'', N''COLUMN'';
        EXEC sp_rename N''dbo.MicroAcoes.CriadoPorId'', N''LegacyCriadoPorId'', N''COLUMN'';
        EXEC sp_rename N''dbo.MicroAcoes.ResponsavelIdGuid'', N''ResponsavelId'', N''COLUMN'';
        EXEC sp_rename N''dbo.MicroAcoes.CriadoPorIdGuid'', N''CriadoPorId'', N''COLUMN'';
        ALTER TABLE dbo.MicroAcoes ALTER COLUMN ResponsavelId uniqueidentifier NOT NULL;
        ALTER TABLE dbo.MicroAcoes ALTER COLUMN CriadoPorId uniqueidentifier NOT NULL;

        ALTER TABLE dbo.PlanosAcao
            ADD CONSTRAINT FK_PlanosAcao_Usuarios_ResponsavelId
            FOREIGN KEY (ResponsavelId) REFERENCES dbo.Usuarios (Id);

        ALTER TABLE dbo.PlanosAcao
            ADD CONSTRAINT FK_PlanosAcao_Usuarios_CriadoPorId
            FOREIGN KEY (CriadoPorId) REFERENCES dbo.Usuarios (Id);

        ALTER TABLE dbo.MicroAcoes
            ADD CONSTRAINT FK_MicroAcoes_Usuarios_ResponsavelId
            FOREIGN KEY (ResponsavelId) REFERENCES dbo.Usuarios (Id);

        ALTER TABLE dbo.MicroAcoes
            ADD CONSTRAINT FK_MicroAcoes_Usuarios_CriadoPorId
            FOREIGN KEY (CriadoPorId) REFERENCES dbo.Usuarios (Id);
    ');

    PRINT 'Schema local convertido com sucesso para Guid em Usuarios e FKs relacionadas.';

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    THROW;
END CATCH;
