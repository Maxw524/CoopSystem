using Microsoft.EntityFrameworkCore;
using Sistrawts.Module.Domain.Entities;

namespace Sistrawts.Module.Infrastructure
{
    public class SistrawtsDbContext : DbContext
    {
        public SistrawtsDbContext(DbContextOptions<SistrawtsDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Setor> Setores { get; set; }
        public DbSet<PlanoAcao> PlanosAcao { get; set; }
        public DbSet<MicroAcao> MicroAcoes { get; set; }
        public DbSet<CategoriaIndicador> CategoriasIndicadores { get; set; }
        public DbSet<Indicador> Indicadores { get; set; }
        public DbSet<MetaMensal> MetasMensais { get; set; }
        public DbSet<ResultadoMensal> ResultadosMensais { get; set; }
        public DbSet<SubcategoriaIndicador> SubcategoriasIndicadores { get; set; }
        public DbSet<IndicadorSubcategoria> IndicadoresSubcategorias { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuração de Usuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Usuarios");
                entity.Property(e => e.Id).HasColumnType("uniqueidentifier").ValueGeneratedNever();
                entity.Property(e => e.Username).IsRequired().HasMaxLength(200);
                entity.Property(e => e.NomeCompleto).IsRequired().HasMaxLength(400);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(400);
                entity.Property(e => e.SenhaHash).IsRequired().HasColumnType("nvarchar(max)");
                entity.Property(e => e.PermiteJuridico).HasDefaultValue(false);
                entity.Property(e => e.PermiteSistrawts).HasDefaultValue(false);
                entity.Property(e => e.PermiteSimuladorTaxa).HasDefaultValue(false);
                entity.Property(e => e.PermissoesJson)
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasDefaultValue("[]");
                entity.Property(e => e.SetorId).HasColumnType("uniqueidentifier");
                entity.Property(e => e.Setor).HasMaxLength(100);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();

                entity.HasOne<Setor>()
                    .WithMany(s => s.Usuarios)
                    .HasForeignKey(e => e.SetorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuração de Setor
            modelBuilder.Entity<Setor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Setores");
                entity.Property(e => e.Id).HasColumnType("uniqueidentifier").ValueGeneratedNever();
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descricao).HasMaxLength(500);
                entity.Property(e => e.Ativo).HasDefaultValue(true);
                entity.HasIndex(e => e.Nome).IsUnique();
            });

            // Configuração de PlanoAcao
            modelBuilder.Entity<PlanoAcao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnType("uniqueidentifier").ValueGeneratedOnAdd();
                entity.Property(e => e.Titulo).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Descricao).HasMaxLength(1000);
                entity.Property(e => e.Trativa).HasMaxLength(2000);
                entity.Property(e => e.PercentualConclusao)
                    .HasColumnType("int")
                    .HasDefaultValue(0);
                entity.Property(e => e.ResponsavelId).HasColumnType("uniqueidentifier");
                entity.Property(e => e.CriadoPorId).HasColumnType("uniqueidentifier");
                
                entity.HasOne(e => e.Responsavel)
                    .WithMany(u => u.PlanosResponsavel)
                    .HasForeignKey(e => e.ResponsavelId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CriadoPor)
                    .WithMany(u => u.PlanosCriados)
                    .HasForeignKey(e => e.CriadoPorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuração de MicroAcao
            modelBuilder.Entity<MicroAcao>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.Titulo).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Descricao).HasMaxLength(1000);
                entity.Property(e => e.Trativa).HasMaxLength(2000);
                entity.Property(e => e.ArquivoComprovacao).HasMaxLength(500);
                entity.Property(e => e.PlanoAcaoId).HasColumnType("uniqueidentifier");
                entity.Property(e => e.ResponsavelId).HasColumnType("uniqueidentifier");
                entity.Property(e => e.CriadoPorId).HasColumnType("uniqueidentifier");

                entity.HasOne(e => e.PlanoAcao)
                    .WithMany(p => p.MicroAcoes)
                    .HasForeignKey(e => e.PlanoAcaoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Responsavel)
                    .WithMany(u => u.MicroAcoesResponsavel)
                    .HasForeignKey(e => e.ResponsavelId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CriadoPor)
                    .WithMany(u => u.MicroAcoesCriadas)
                    .HasForeignKey(e => e.CriadoPorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuração de CategoriaIndicador
            modelBuilder.Entity<CategoriaIndicador>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("CategoriasIndicadores");
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descricao).HasMaxLength(500);
                entity.Property(e => e.DataCriacao).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.DataAtualizacao).HasDefaultValueSql("GETDATE()");
            });

            // Configuração de Indicador
            modelBuilder.Entity<Indicador>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Indicadores");
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.NomeMeta).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Descricao).HasMaxLength(1000);
                entity.Property(e => e.DataCriacao).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.DataAtualizacao).HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.Categoria)
                    .WithMany(c => c.Indicadores)
                    .HasForeignKey(e => e.CategoriaId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuração de MetaMensal
            modelBuilder.Entity<MetaMensal>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("MetasMensais");
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.ValorMeta)
                    .HasColumnType("decimal(18,2)");

                entity.HasOne(e => e.Indicador)
                    .WithMany(i => i.MetasMensais)
                    .HasForeignKey(e => e.IndicadorId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relacionamento opcional com Subcategoria
                entity.HasOne(e => e.Subcategoria)
                    .WithMany()
                    .HasForeignKey(e => e.SubcategoriaId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Índice único para não duplicar meta no mesmo mês/ano por subcategoria
                entity.HasIndex(e => new { e.IndicadorId, e.SubcategoriaId, e.Ano, e.Mes }).IsUnique();
            });

            // Configuração de ResultadoMensal
            modelBuilder.Entity<ResultadoMensal>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("ResultadosMensais");
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.ValorResultado)
                    .HasColumnType("decimal(18,2)");
                entity.Property(e => e.DataRegistro).HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.Indicador)
                    .WithMany(i => i.ResultadosMensais)
                    .HasForeignKey(e => e.IndicadorId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relacionamento opcional com Subcategoria
                entity.HasOne(e => e.Subcategoria)
                    .WithMany()
                    .HasForeignKey(e => e.SubcategoriaId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Índice único para não duplicar resultado no mesmo mês/ano por subcategoria
                entity.HasIndex(e => new { e.IndicadorId, e.SubcategoriaId, e.Ano, e.Mes }).IsUnique();
            });

            // Configuração de SubcategoriaIndicador
            modelBuilder.Entity<SubcategoriaIndicador>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("SubcategoriasIndicadores");
                entity.Property(e => e.Id).HasColumnType("int").ValueGeneratedOnAdd();
                entity.Property(e => e.Nome).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Descricao).HasMaxLength(200);
                entity.Property(e => e.DataCriacao).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.DataAtualizacao).HasDefaultValueSql("GETDATE()");
                
                // Índice único para nomes de subcategorias
                entity.HasIndex(e => e.Nome).IsUnique();
            });

            // Configuração de IndicadorSubcategoria (tabela de junção)
            modelBuilder.Entity<IndicadorSubcategoria>(entity =>
            {
                entity.HasKey(e => new { e.IndicadorId, e.SubcategoriaId });
                entity.ToTable("IndicadoresSubcategorias");
                
                entity.HasOne(e => e.Indicador)
                    .WithMany(i => i.Subcategorias)
                    .HasForeignKey(e => e.IndicadorId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Subcategoria)
                    .WithMany(s => s.Indicadores)
                    .HasForeignKey(e => e.SubcategoriaId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
