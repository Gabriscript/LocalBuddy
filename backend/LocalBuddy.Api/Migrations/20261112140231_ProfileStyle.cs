using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalBuddy.Api.Migrations
{
    /// <inheritdoc />
    public partial class ProfileStyle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActivityStyle",
                table: "AspNetUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Lifestyle",
                table: "AspNetUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UsualDays",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivityStyle",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Lifestyle",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UsualDays",
                table: "AspNetUsers");
        }
    }
}
