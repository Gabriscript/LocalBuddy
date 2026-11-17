using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalBuddy.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReferenceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Context",
                table: "Reviews",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Recommend",
                table: "Reviews",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Context",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Recommend",
                table: "Reviews");
        }
    }
}
